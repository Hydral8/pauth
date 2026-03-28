import type { CaseRecord } from "../../src/types/domain";
import { getCaseRecord, saveCaseRecord } from "../caseStore";
import type {
  SwarmAgentResult,
  SwarmCapability,
  SwarmExecutionContext,
  SwarmMessage,
  SwarmOrchestrationResult,
} from "./types";
import {
  selectAgent,
  setAgentStatus,
  findAgentsByCapability,
  getAgent,
} from "./registry";
import {
  sendMessage as busSend,
  readMessages as busRead,
  getMessageLog,
  clearMessageBus,
} from "./messageBus";
import {
  createTask,
  updateTask,
  getReadyTasks,
  getBlockedTasks,
  getTasksByStatus,
  allTasksTerminal,
  clearTasks,
  listTasks,
} from "./taskQueue";

// ---------------------------------------------------------------------------
// Swarm Coordinator
//
// Replaces the linear pipeline with dynamic, dependency-aware, parallel
// execution. Agents communicate through a permission-gated message bus
// and are dispatched based on capability matching.
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 20; // safety: prevent infinite scheduling loops

/**
 * Build the task graph for a case.
 * Scans registered agents, resolves dependency ordering, and creates
 * SwarmTasks for every capability that has at least one agent.
 */
function buildTaskGraph(capabilities: SwarmCapability[]): Map<SwarmCapability, string> {
  const capToTaskId = new Map<SwarmCapability, string>();

  for (const cap of capabilities) {
    const agents = findAgentsByCapability(cap);
    if (agents.length === 0) continue;

    // Collect dependency task ids
    const agent = agents[0]; // use first match to read dependsOn
    const depTaskIds: string[] = [];
    for (const depCap of agent.def.dependsOn) {
      const depTaskId = capToTaskId.get(depCap);
      if (depTaskId) depTaskIds.push(depTaskId);
    }

    const task = createTask(cap, {
      priority: agent.def.priority ?? 0,
      dependsOnTasks: depTaskIds,
    });
    capToTaskId.set(cap, task.id);
  }

  return capToTaskId;
}

/**
 * Check whether a capability is gated by a permission the caller doesn't have.
 */
function isPermissionGated(
  agentId: string,
  capability: SwarmCapability,
  permissions: Set<string>
): boolean {
  const entry = getAgent(agentId);
  if (!entry) return true;
  const gate = entry.def.permissionGates.find((g) => g.capability === capability);
  if (!gate || gate.requiredPermission === null) return false;
  return !permissions.has(gate.requiredPermission);
}

/**
 * Build the execution context that gets passed to each agent.
 */
function buildContext(
  caseRecord: CaseRecord,
  task: ReturnType<typeof getReadyTasks>[number],
  permissions: Set<string>,
  capToTaskId: Map<SwarmCapability, string>
): SwarmExecutionContext {
  return {
    caseRecord,
    task,
    permissions,
    sendMessage: (msg) => {
      busSend(msg, permissions);
    },
    delegate: async (capability, payload) => {
      // Find an agent for the requested capability and run it inline
      const delegateAgent = selectAgent(capability);
      if (!delegateAgent) {
        return {
          success: false,
          caseRecord,
          error: `No agent available for capability: ${capability}`,
        };
      }

      // Permission check on delegation
      if (isPermissionGated(delegateAgent.def.id, capability, permissions)) {
        return {
          success: false,
          caseRecord,
          error: `Delegation blocked: "${capability}" requires permission`,
        };
      }

      // Create an inline sub-task
      const subTask = createTask(capability, { priority: (delegateAgent.def.priority ?? 0) + 1 });
      updateTask(subTask.id, { status: "running", assignedAgent: delegateAgent.def.id, startedAt: new Date().toISOString() });

      const subCtx = buildContext(caseRecord, subTask, permissions, capToTaskId);
      const subResult = await delegateAgent.def.execute(subCtx);

      updateTask(subTask.id, {
        status: subResult.success ? "completed" : "failed",
        completedAt: new Date().toISOString(),
        result: subResult,
      });

      // Notify via message bus
      busSend(
        {
          type: subResult.success ? "task_completed" : "task_failed",
          from: delegateAgent.def.id,
          to: task.assignedAgent ?? "coordinator",
          capability,
          payload: payload ?? {},
          permissionScope: null,
        },
        permissions
      );

      return subResult;
    },
    readMessages: () => busRead(task.assignedAgent ?? "coordinator"),
  };
}

/**
 * Run the swarm orchestration for a case.
 *
 * Instead of a hardcoded sequential pipeline, this:
 * 1. Builds a dependency-aware task graph from registered agent capabilities
 * 2. Dispatches all ready (unblocked) tasks in parallel each iteration
 * 3. Respects permission gates — blocked capabilities are reported, not skipped
 * 4. Supports agent-to-agent delegation mid-execution
 * 5. Logs every inter-agent message for audit
 */
export async function runSwarmOrchestration(
  caseId: string,
  permissions: Set<string> = new Set(),
  requestedCapabilities?: SwarmCapability[]
): Promise<SwarmOrchestrationResult> {
  // Reset per-run state
  clearTasks();
  clearMessageBus();

  let caseRecord = await getCaseRecord(caseId);

  // Default capability ordering if not specified
  const capabilities: SwarmCapability[] = requestedCapabilities ?? [
    "extract",
    "policy",
    "draft",
    "submit",
  ];

  // Build the task graph
  const capToTaskId = buildTaskGraph(capabilities);

  const tasksCompleted: string[] = [];
  const tasksFailed: string[] = [];
  const gatedCapabilities: SwarmCapability[] = [];

  let iterations = 0;

  while (!allTasksTerminal() && iterations < MAX_ITERATIONS) {
    iterations++;
    const readyTasks = getReadyTasks();

    if (readyTasks.length === 0) {
      // Mark any remaining pending tasks whose deps failed as blocked
      for (const blocked of getBlockedTasks()) {
        updateTask(blocked.id, { status: "failed" });
        tasksFailed.push(blocked.capability);
      }
      break;
    }

    // Dispatch all ready tasks in parallel
    const executions = readyTasks.map(async (task) => {
      const agent = selectAgent(task.capability);
      if (!agent) {
        updateTask(task.id, { status: "failed" });
        tasksFailed.push(task.capability);
        return;
      }

      // Permission gate check
      if (isPermissionGated(agent.def.id, task.capability, permissions)) {
        updateTask(task.id, { status: "failed" });
        gatedCapabilities.push(task.capability);

        busSend(
          {
            type: "task_failed",
            from: "coordinator",
            to: agent.def.id,
            capability: task.capability,
            payload: { reason: "permission_denied" },
            permissionScope: null,
          },
          permissions
        );
        return;
      }

      // Assign and run
      updateTask(task.id, {
        status: "running",
        assignedAgent: agent.def.id,
        startedAt: new Date().toISOString(),
      });
      setAgentStatus(agent.def.id, "busy");

      // Notify agent of assignment
      busSend(
        {
          type: "task_assigned",
          from: "coordinator",
          to: agent.def.id,
          capability: task.capability,
          payload: { taskId: task.id },
          permissionScope: null,
        },
        permissions
      );

      const ctx = buildContext(caseRecord, task, permissions, capToTaskId);

      try {
        const result = await agent.def.execute(ctx);

        if (result.success) {
          caseRecord = result.caseRecord;
          await saveCaseRecord(caseRecord);
          updateTask(task.id, {
            status: "completed",
            completedAt: new Date().toISOString(),
            result,
          });
          tasksCompleted.push(task.capability);

          busSend(
            {
              type: "task_completed",
              from: agent.def.id,
              to: "coordinator",
              capability: task.capability,
              payload: {},
              permissionScope: null,
            },
            permissions
          );

          // Handle dynamic delegation requests
          if (result.delegationRequests?.length) {
            for (const delegatedCap of result.delegationRequests) {
              if (!capToTaskId.has(delegatedCap)) {
                const depIds = [task.id];
                const newTask = createTask(delegatedCap, {
                  priority: (agent.def.priority ?? 0) + 1,
                  dependsOnTasks: depIds,
                });
                capToTaskId.set(delegatedCap, newTask.id);
              }
            }
          }
        } else {
          // Retry logic
          const retryCount = (task.retryCount ?? 0) + 1;
          if (retryCount <= task.maxRetries) {
            updateTask(task.id, { status: "pending", retryCount });
          } else {
            updateTask(task.id, {
              status: "failed",
              completedAt: new Date().toISOString(),
              result,
            });
            tasksFailed.push(task.capability);
          }

          busSend(
            {
              type: "task_failed",
              from: agent.def.id,
              to: "coordinator",
              capability: task.capability,
              payload: { error: result.error ?? "unknown" },
              permissionScope: null,
            },
            permissions
          );
        }

        setAgentStatus(agent.def.id, "idle");
      } catch (error) {
        setAgentStatus(agent.def.id, "error");
        updateTask(task.id, { status: "failed", completedAt: new Date().toISOString() });
        tasksFailed.push(task.capability);

        // Audit the failure
        caseRecord = {
          ...caseRecord,
          auditLog: [
            ...caseRecord.auditLog,
            {
              id: `audit-swarm-${caseRecord.auditLog.length + 1}`,
              at: new Date().toISOString(),
              actor: agent.def.actor,
              title: `${task.capability} agent crashed`,
              detail: error instanceof Error ? error.message : "Unknown error",
            },
          ],
        };
        await saveCaseRecord(caseRecord);
      }
    });

    // Wait for the parallel batch to complete
    await Promise.all(executions);
  }

  // Final save
  await saveCaseRecord(caseRecord);

  // Mark any remaining pending tasks as blocked
  const stillPending = getTasksByStatus("pending");
  const tasksBlocked = stillPending.map((t) => t.capability);

  return {
    caseRecord,
    tasksCompleted,
    tasksFailed,
    tasksBlocked,
    messageLog: getMessageLog(),
    gatedCapabilities,
  };
}
