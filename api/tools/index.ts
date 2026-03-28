import { getCaseSummary, getMissingCriteria, addCaseNote, approveCase, submitCaseTool, getAuditEvents } from "../../backend/toolsService";
const actions: Record<string, (body: any) => Promise<any>> = {
  "get-case-summary": getCaseSummary,
  "get-missing-criteria": getMissingCriteria,
  "add-case-note": addCaseNote,
  "approve-case": approveCase,
  "submit-case": submitCaseTool,
  "get-audit-events": getAuditEvents,
};

export default async function handler(
  request: { body: { action: string; [key: string]: unknown }; query?: Record<string, string | undefined> },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const action = request.body?.action ?? request.query?.action;
  if (!action || !actions[action]) {
    response.status(400).json({ error: `Unknown tool action: ${action}. Valid: ${Object.keys(actions).join(", ")}` });
    return;
  }

  const result = await actions[action](request.body);
  const isBlocked = result?.status === "blocked";
  response.status(isBlocked ? 409 : 200).json(result);
}
