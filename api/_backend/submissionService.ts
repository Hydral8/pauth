import { appReducer } from "../../src/lib/reducer.js";
import type { SubmitResponse } from "../../src/types/api.js";
import { getCaseRecord, saveCaseRecord } from "./caseStore.js";

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

  if (!["approved", "submitting", "submitted"].includes(caseRecord.status)) {
    return {
      status: "blocked",
      executionState: "blocked",
      auditExportId: buildAuditExportId(caseId),
      blockerCode: "approval_required",
      blockerDetail: "Explicit approval is required before submission.",
      caseRecord
    };
  }

  const approvedCase = caseRecord;
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
