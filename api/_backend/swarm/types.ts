import type { AuditActor, CaseRecord } from "../../../src/types/domain.js";

// ---------------------------------------------------------------------------
// Capabilities & Permissions
// ---------------------------------------------------------------------------

/** A named capability an agent advertises (e.g. "extract", "policy", "draft") */
export type SwarmCapability =
  | "extract"
  | "policy"
  | "draft"
  | "submit"
  | "classify"
  | "review"
  | "summarize";

/** Permission scope required to invoke a capability */
export interface PermissionGate {
  capability: SwarmCapability;
  requiredPermission: string | null; // null = unrestricted
}

// ---------------------------------------------------------------------------
// Agent definition
// ---------------------------------------------------------------------------

export type SwarmAgentStatus = "idle" | "busy" | "error" | "disabled";

export interface SwarmAgentDef {
  id: string;
  name: string;
  actor: AuditActor;
  capabilities: SwarmCapability[];
  /** Capabilities this agent requires to have completed before it can run */
  dependsOn: SwarmCapability[];
  /** Permission gates for each capability this agent provides */
  permissionGates: PermissionGate[];
  /** Execute the agent's work on a case */
  execute: (ctx: SwarmExecutionContext) => Promise<SwarmAgentResult>;
  /** Optional: priority weight (higher = scheduled earlier). Default 0 */
  priority?: number;
}

// ---------------------------------------------------------------------------
// Messages (inter-agent communication)
// ---------------------------------------------------------------------------

export type SwarmMessageType =
  | "task_assigned"
  | "task_completed"
  | "task_failed"
  | "delegation_request"
  | "delegation_response"
  | "info_request"
  | "info_response"
  | "feedback";

export interface SwarmMessage {
  id: string;
  type: SwarmMessageType;
  from: string; // agent id or "coordinator"
  to: string; // agent id or "coordinator"
  capability?: SwarmCapability;
  payload: Record<string, unknown>;
  timestamp: string;
  /** Permission scope under which this message was sent */
  permissionScope: string | null;
}

// ---------------------------------------------------------------------------
// Task queue items
// ---------------------------------------------------------------------------

export type SwarmTaskStatus = "pending" | "running" | "completed" | "failed" | "blocked";

export interface SwarmTask {
  id: string;
  capability: SwarmCapability;
  assignedAgent?: string;
  status: SwarmTaskStatus;
  priority: number;
  dependsOnTasks: string[]; // task ids that must complete first
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: SwarmAgentResult;
  retryCount: number;
  maxRetries: number;
}

// ---------------------------------------------------------------------------
// Execution context passed to agents
// ---------------------------------------------------------------------------

export interface SwarmExecutionContext {
  caseRecord: CaseRecord;
  task: SwarmTask;
  permissions: Set<string>;
  /** Send a message to another agent or the coordinator */
  sendMessage: (msg: Omit<SwarmMessage, "id" | "timestamp">) => void;
  /** Request another capability to run (delegation) */
  delegate: (capability: SwarmCapability, payload?: Record<string, unknown>) => Promise<SwarmAgentResult>;
  /** Read messages addressed to this agent */
  readMessages: () => SwarmMessage[];
}

// ---------------------------------------------------------------------------
// Agent execution result
// ---------------------------------------------------------------------------

export interface SwarmAgentResult {
  success: boolean;
  caseRecord: CaseRecord;
  messages?: SwarmMessage[];
  /** If the agent needs another capability to run first */
  delegationRequests?: SwarmCapability[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Swarm orchestration result (returned to callers)
// ---------------------------------------------------------------------------

export interface SwarmOrchestrationResult {
  caseRecord: CaseRecord;
  tasksCompleted: string[];
  tasksFailed: string[];
  tasksBlocked: string[];
  messageLog: SwarmMessage[];
  gatedCapabilities: SwarmCapability[];
}
