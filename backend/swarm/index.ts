// Swarm infrastructure barrel export
export type {
  SwarmCapability,
  SwarmAgentDef,
  SwarmAgentStatus,
  SwarmMessage,
  SwarmMessageType,
  SwarmTask,
  SwarmTaskStatus,
  SwarmExecutionContext,
  SwarmAgentResult,
  SwarmOrchestrationResult,
  PermissionGate,
} from "./types";

export { runSwarmOrchestration } from "./coordinator";

export {
  registerAgent,
  unregisterAgent,
  getAgent,
  findAgentsByCapability,
  selectAgent,
  setAgentStatus,
  listAgents,
  getCapabilityMap,
  clearRegistry,
} from "./registry";

export {
  sendMessage,
  readMessages,
  peekMessages,
  subscribe,
  getMessageLog,
  clearMessageBus,
} from "./messageBus";

export {
  createTask,
  getTask,
  updateTask,
  getReadyTasks,
  getTasksByStatus,
  allTasksTerminal,
  getBlockedTasks,
  listTasks,
  clearTasks,
} from "./taskQueue";

export { bootstrapSwarmAgents } from "./agents";
