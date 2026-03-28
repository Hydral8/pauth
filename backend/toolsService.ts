import type {
  AddCaseNoteRequest,
  AddCaseNoteResponse,
  ApproveCaseRequest,
  ApproveCaseResponse,
  GetAuditEventsRequest,
  GetAuditEventsResponse,
  GetCaseSummaryRequest,
  GetCaseSummaryResponse,
  GetMissingCriteriaRequest,
  GetMissingCriteriaResponse,
  SubmitCaseToolRequest,
  SubmitCaseToolResponse
} from "../src/types/api";
import { applyCaseAction } from "./caseService";
import { getCaseRecord } from "./caseStore";
import { submitAuthorization } from "./submissionService";

function resolveCaseId(caseId?: string) {
  return caseId ?? "case-demo-001";
}

export async function getCaseSummary(input: GetCaseSummaryRequest): Promise<GetCaseSummaryResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  return {
    caseId: caseRecord.id,
    patientName: caseRecord.patient.name,
    requestedService: caseRecord.requestedService.label,
    payer: caseRecord.patient.payer,
    caseStatus: caseRecord.status,
    recommendationStatus: caseRecord.recommendation.status,
    confidence: caseRecord.recommendation.confidence,
    summary: caseRecord.recommendation.summary
  };
}

export async function getMissingCriteria(input: GetMissingCriteriaRequest): Promise<GetMissingCriteriaResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  const missingCriteria = caseRecord.criteria
    .filter((criterion) => criterion.status === "missing")
    .map((criterion) => ({
      id: criterion.id,
      clauseTitle: criterion.clauseTitle,
      missingReason: criterion.missingReason ?? criterion.clauseText
    }));

  return {
    caseId: caseRecord.id,
    missingCount: missingCriteria.length,
    missingCriteria,
    nextStep: caseRecord.recommendation.missingItems[0] ?? "Ready for approval."
  };
}

export async function addCaseNote(input: AddCaseNoteRequest): Promise<AddCaseNoteResponse> {
  const nextCase = await applyCaseAction(resolveCaseId(input.caseId), {
    type: "RESOLVE_MISSING_ITEM",
    payload: {
      note: input.note,
      source: "voice"
    }
  });

  return {
    caseRecord: nextCase,
    recordedNote: input.note,
    status: "recorded"
  };
}

export async function approveCase(input: ApproveCaseRequest): Promise<ApproveCaseResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  const missingCount = caseRecord.criteria.filter((criterion) => criterion.status === "missing").length;

  if (missingCount > 0) {
    return {
      caseRecord,
      status: "blocked",
      blockerDetail: `Cannot approve while ${missingCount} policy item${missingCount === 1 ? "" : "s"} remain missing.`
    };
  }

  const nextCase = await applyCaseAction(caseRecord.id, {
    type: "APPROVE_SUBMIT",
    payload: {
      source: input.source ?? "voice"
    }
  });

  return {
    caseRecord: nextCase,
    status: "approved"
  };
}

export async function submitCaseTool(input: SubmitCaseToolRequest): Promise<SubmitCaseToolResponse> {
  return submitAuthorization(resolveCaseId(input.caseId));
}

export async function getAuditEvents(input: GetAuditEventsRequest): Promise<GetAuditEventsResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  return {
    caseId: caseRecord.id,
    events: [...caseRecord.auditLog].reverse().slice(0, input.limit ?? 5)
  };
}
