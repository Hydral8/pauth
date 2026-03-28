import { bootstrapSwarmAgents } from "../_backend/swarm/index.js";
import { runSwarmOrchestration } from "../_backend/swarm/coordinator.js";
import type { SwarmCapability } from "../_backend/swarm/types.js";

export default async function handler(
  request: {
    body: {
      caseId?: string;
      permissions?: string[];
      capabilities?: SwarmCapability[];
    };
  },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  // Ensure all agents are registered
  bootstrapSwarmAgents();

  const caseId = request.body.caseId ?? "case-demo-001";
  const permissions = new Set(request.body.permissions ?? []);
  const capabilities = request.body.capabilities; // optional subset

  const result = await runSwarmOrchestration(caseId, permissions, capabilities);

  response.status(200).json({
    caseRecord: result.caseRecord,
    tasksCompleted: result.tasksCompleted,
    tasksFailed: result.tasksFailed,
    tasksBlocked: result.tasksBlocked,
    gatedCapabilities: result.gatedCapabilities,
    messageCount: result.messageLog.length,
    messageLog: result.messageLog,
  });
}
