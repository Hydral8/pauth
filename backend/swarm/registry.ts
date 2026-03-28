import type { SwarmAgentDef, SwarmAgentStatus, SwarmCapability } from "./types";

// ---------------------------------------------------------------------------
// Agent Registry — discover agents by capability, manage lifecycle
// ---------------------------------------------------------------------------

interface RegisteredAgent {
  def: SwarmAgentDef;
  status: SwarmAgentStatus;
  lastActive?: string;
}

const agents = new Map<string, RegisteredAgent>();

/** Register an agent definition. Overwrites if id already exists. */
export function registerAgent(def: SwarmAgentDef): void {
  agents.set(def.id, { def, status: "idle" });
}

/** Unregister an agent by id. */
export function unregisterAgent(id: string): boolean {
  return agents.delete(id);
}

/** Get a single agent by id. */
export function getAgent(id: string): RegisteredAgent | undefined {
  return agents.get(id);
}

/** Find all agents that advertise a given capability. */
export function findAgentsByCapability(capability: SwarmCapability): RegisteredAgent[] {
  return Array.from(agents.values()).filter(
    (a) => a.status !== "disabled" && a.def.capabilities.includes(capability)
  );
}

/**
 * Select the best agent for a capability.
 * Prefers idle agents, then highest priority, then earliest registration order.
 */
export function selectAgent(capability: SwarmCapability): RegisteredAgent | undefined {
  const candidates = findAgentsByCapability(capability);
  if (candidates.length === 0) return undefined;

  // Sort: idle first, then by priority descending
  candidates.sort((a, b) => {
    const statusOrder = (s: SwarmAgentStatus) => (s === "idle" ? 0 : s === "busy" ? 1 : 2);
    const sDiff = statusOrder(a.status) - statusOrder(b.status);
    if (sDiff !== 0) return sDiff;
    return (b.def.priority ?? 0) - (a.def.priority ?? 0);
  });

  return candidates[0];
}

/** Update an agent's runtime status. */
export function setAgentStatus(id: string, status: SwarmAgentStatus): void {
  const entry = agents.get(id);
  if (entry) {
    entry.status = status;
    entry.lastActive = new Date().toISOString();
  }
}

/** List all registered agents. */
export function listAgents(): RegisteredAgent[] {
  return Array.from(agents.values());
}

/** Get a map of capability → agent ids that can serve it. */
export function getCapabilityMap(): Map<SwarmCapability, string[]> {
  const map = new Map<SwarmCapability, string[]>();
  for (const [id, entry] of agents) {
    for (const cap of entry.def.capabilities) {
      const existing = map.get(cap) ?? [];
      existing.push(id);
      map.set(cap, existing);
    }
  }
  return map;
}

/** Clear all registrations (useful for testing). */
export function clearRegistry(): void {
  agents.clear();
}
