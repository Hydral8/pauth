import type { SwarmMessage, SwarmMessageType } from "./types";

// ---------------------------------------------------------------------------
// Permission-gated message bus for inter-agent communication
// ---------------------------------------------------------------------------

type MessageHandler = (msg: SwarmMessage) => void;

interface Subscription {
  agentId: string;
  filter?: { types?: SwarmMessageType[]; from?: string };
  handler: MessageHandler;
}

let messageCounter = 0;
const messageLog: SwarmMessage[] = [];
const subscriptions: Subscription[] = [];
const mailboxes = new Map<string, SwarmMessage[]>();

/** Create a unique message id. */
function nextMessageId(): string {
  return `msg-${++messageCounter}-${Date.now().toString(36)}`;
}

/**
 * Send a message through the bus.
 * Enforces permission: if the message targets a capability with a required
 * permission, the sender must include that permission in `permissionScope`.
 */
export function sendMessage(
  msg: Omit<SwarmMessage, "id" | "timestamp">,
  activePermissions: Set<string>
): SwarmMessage {
  // Permission check: if the message has a permissionScope requirement,
  // verify the sender has it
  if (msg.permissionScope && !activePermissions.has(msg.permissionScope)) {
    const blocked: SwarmMessage = {
      ...msg,
      id: nextMessageId(),
      timestamp: new Date().toISOString(),
      type: "task_failed",
      payload: {
        ...msg.payload,
        error: `Permission denied: requires "${msg.permissionScope}"`,
      },
    };
    messageLog.push(blocked);
    return blocked;
  }

  const fullMsg: SwarmMessage = {
    ...msg,
    id: nextMessageId(),
    timestamp: new Date().toISOString(),
  };

  // Store in log
  messageLog.push(fullMsg);

  // Deliver to mailbox
  const inbox = mailboxes.get(fullMsg.to) ?? [];
  inbox.push(fullMsg);
  mailboxes.set(fullMsg.to, inbox);

  // Notify subscribers
  for (const sub of subscriptions) {
    if (sub.agentId !== fullMsg.to) continue;
    if (sub.filter?.types && !sub.filter.types.includes(fullMsg.type)) continue;
    if (sub.filter?.from && sub.filter.from !== fullMsg.from) continue;
    sub.handler(fullMsg);
  }

  return fullMsg;
}

/** Read and drain all messages in an agent's mailbox. */
export function readMessages(agentId: string): SwarmMessage[] {
  const inbox = mailboxes.get(agentId) ?? [];
  mailboxes.set(agentId, []);
  return inbox;
}

/** Peek at messages without draining. */
export function peekMessages(agentId: string): SwarmMessage[] {
  return [...(mailboxes.get(agentId) ?? [])];
}

/** Subscribe to messages for a given agent with optional filters. */
export function subscribe(
  agentId: string,
  handler: MessageHandler,
  filter?: Subscription["filter"]
): () => void {
  const sub: Subscription = { agentId, handler, filter };
  subscriptions.push(sub);
  // Return unsubscribe function
  return () => {
    const idx = subscriptions.indexOf(sub);
    if (idx >= 0) subscriptions.splice(idx, 1);
  };
}

/** Get the full message log (for audit). */
export function getMessageLog(): SwarmMessage[] {
  return [...messageLog];
}

/** Clear all state (for testing). */
export function clearMessageBus(): void {
  messageCounter = 0;
  messageLog.length = 0;
  subscriptions.length = 0;
  mailboxes.clear();
}
