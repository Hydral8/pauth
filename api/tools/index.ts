import { getCaseSummary, getMissingCriteria, addCaseNote, approveCase, submitCaseTool, getAuditEvents, runSwarm, getSwarmStatus } from "../_backend/toolsService.js";

const actions: Record<string, (body: any) => Promise<any>> = {
  "get-case-summary": getCaseSummary,
  "get-missing-criteria": getMissingCriteria,
  "add-case-note": addCaseNote,
  "approve-case": approveCase,
  "submit-case": submitCaseTool,
  "get-audit-events": getAuditEvents,
  "run-swarm": runSwarm,
  "get-swarm-status": getSwarmStatus,
};

export default async function handler(
  request: { body: any; query?: Record<string, string | undefined> },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const body = request.body ?? {};

  // Vapi tool call format: { message: { type: "tool-calls", toolCallList: [...] } }
  const vapiMessage = body.message;
  if (vapiMessage?.type === "tool-calls" && Array.isArray(vapiMessage.toolCallList)) {
    const results = [];
    for (const toolCall of vapiMessage.toolCallList) {
      const name = toolCall.function?.name;
      const args = typeof toolCall.function?.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function?.arguments ?? {};
      const fn = name ? actions[name] : undefined;
      if (fn) {
        const result = await fn(args);
        results.push({
          toolCallId: toolCall.id,
          result: JSON.stringify(result),
        });
      }
    }
    response.status(200).json({ results });
    return;
  }

  // Internal format: { action: "get-case-summary", ...params }
  const action = body.action ?? request.query?.action;
  if (!action || !actions[action]) {
    response.status(400).json({ error: `Unknown tool action: ${action}. Valid: ${Object.keys(actions).join(", ")}` });
    return;
  }

  const result = await actions[action](body);
  const isBlocked = result?.status === "blocked";
  response.status(isBlocked ? 409 : 200).json(result);
}
