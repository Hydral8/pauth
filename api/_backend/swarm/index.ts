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
} from "./types.js";

export { runSwarmOrchestration } from "./coordinator.js";

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
} from "./registry.js";

export {
  sendMessage,
  readMessages,
  peekMessages,
  subscribe,
  getMessageLog,
  clearMessageBus,
} from "./messageBus.js";

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
} from "./taskQueue.js";

export { bootstrapSwarmAgents } from "./agents.js";
