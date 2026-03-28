import { applyCaseAction } from "../_backend/caseService.js";
import { getCaseRecord } from "../_backend/caseStore.js";
import type { CaseActionRequest } from "../../src/types/api.js";
import type { AppAction } from "../../src/types/actions.js";
export default async function handler(
  request: { body: CaseActionRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  // Handle audit export as a special action
  if (request.body.action?.type === "EXPORT_AUDIT") {
    const caseId = request.body.caseId ?? "case-demo-001";
    const caseRecord = await getCaseRecord(caseId);
    response.status(200).json({
      caseId,
      exportedAt: new Date().toISOString(),
      events: caseRecord.auditLog,
      totalEvents: caseRecord.auditLog.length,
    });
    return;
  }

  const caseRecord = await applyCaseAction(request.body.caseId, request.body.action as AppAction);
  response.status(200).json({ caseRecord });
}
