import { appReducer } from "../src/lib/reducer";
import type { SubmitResponse } from "../src/types/api";
import { getCaseRecord, saveCaseRecord } from "./caseStore";

function buildAuditExportId(caseId: string) {
  return `audit-${caseId.toLowerCase()}-${Date.now().toString(36)}`;
}

export async function submitAuthorization(caseId: string): Promise<SubmitResponse> {
  const caseRecord = await getCaseRecord(caseId);
  const missingCriteriaCount = caseRecord.criteria.filter((criterion) => criterion.status === "missing").length;

  if (missingCriteriaCount > 0) {
    return {
      status: "blocked",
      executionState: "blocked",
      auditExportId: buildAuditExportId(caseId),
      blockerCode: "missing_information",
      blockerDetail: `Resolve ${missingCriteriaCount} missing policy item${missingCriteriaCount === 1 ? "" : "s"} before submission.`,
      caseRecord
    };
  }

  const approvedCase = caseRecord.status === "approved" || caseRecord.status === "submitting" || caseRecord.status === "submitted"
    ? caseRecord
    : appReducer(caseRecord, { type: "APPROVE_SUBMIT", payload: { source: "manual" } });
  const submittingCase = appReducer(approvedCase, { type: "SUBMISSION_STARTED" });
  const submittedCase = appReducer(submittingCase, { type: "SUBMISSION_SUCCEEDED" });
  const confirmationId = `CONF-${caseId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  await saveCaseRecord(submittedCase);

  return {
    status: "submitted",
    executionState: "submitted",
    submittedAt: new Date().toISOString(),
    confirmationId,
    auditExportId: buildAuditExportId(caseId),
    caseRecord: submittedCase
  };
}
