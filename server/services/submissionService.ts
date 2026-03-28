import { createInitialCase } from "../../src/lib/mockData";
import type { AuditEvent } from "../../src/types/domain";
import type {
  AuditExportResponse,
  SubmissionBlockerCode,
  SubmissionExecutionState,
  SubmissionStatusResponse,
  SubmitRequest,
  SubmitResponse
} from "../types/api";

interface SubmissionRecord {
  caseId: string;
  executionState: SubmissionExecutionState;
  updatedAt: string;
  confirmationId?: string;
  auditExportId: string;
  blockerCode?: SubmissionBlockerCode;
  blockerDetail?: string;
  events: AuditEvent[];
}

const submissionRecords = new Map<string, SubmissionRecord>();

function timestamp() {
  return new Date().toISOString();
}

function normalizeCaseId(caseId: string) {
  return caseId.trim() || "demo";
}

function createAuditEvent(id: string, actor: AuditEvent["actor"], title: string, detail: string): AuditEvent {
  return {
    id,
    at: timestamp(),
    actor,
    title,
    detail
  };
}

function buildExportId(caseId: string) {
  return `audit-${caseId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
}

function buildConfirmationId(caseId: string) {
  return `CONF-${caseId.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${Date.now().toString(36).toUpperCase()}`;
}

function getBaseAuditLog(input: SubmitRequest) {
  return input.auditLog?.length ? input.auditLog : createInitialCase().auditLog;
}

function evaluateBlocker(input: SubmitRequest) {
  if (typeof input.missingCriteriaCount === "number" && input.missingCriteriaCount > 0) {
    return {
      blockerCode: "missing_information" as const,
      blockerDetail: `Submission blocked until ${input.missingCriteriaCount} missing policy item${input.missingCriteriaCount === 1 ? "" : "s"} ${input.missingCriteriaCount === 1 ? "is" : "are"} resolved.`
    };
  }

  if (input.caseStatus && !["approved", "submitting", "submitted"].includes(input.caseStatus)) {
    return {
      blockerCode: "approval_required" as const,
      blockerDetail: "Submission requires human approval before the auth packet can be released."
    };
  }

  if (input.packetStatus && !["approved", "submitted"].includes(input.packetStatus)) {
    return {
      blockerCode: "approval_required" as const,
      blockerDetail: "Packet must be marked approved before backend submission can proceed."
    };
  }

  return null;
}

export function submitAuthorization(input: SubmitRequest): SubmitResponse {
  const caseId = normalizeCaseId(input.caseId);
  const baseAuditLog = getBaseAuditLog(input);
  const exportId = buildExportId(caseId);
  const blocker = evaluateBlocker(input);

  if (blocker) {
    const events = [
      ...baseAuditLog,
      createAuditEvent(
        `audit-${baseAuditLog.length + 1}`,
        "submission_agent",
        "Submission blocked",
        blocker.blockerDetail
      )
    ];

    submissionRecords.set(caseId, {
      caseId,
      executionState: "blocked",
      updatedAt: timestamp(),
      auditExportId: exportId,
      blockerCode: blocker.blockerCode,
      blockerDetail: blocker.blockerDetail,
      events
    });

    return {
      status: "blocked",
      executionState: "blocked",
      auditExportId: exportId,
      auditEvents: events,
      blockerCode: blocker.blockerCode,
      blockerDetail: blocker.blockerDetail
    };
  }

  const confirmationId = buildConfirmationId(caseId);
  const events = [
    ...baseAuditLog,
    createAuditEvent(
      `audit-${baseAuditLog.length + 1}`,
      "submission_agent",
      "Submission started",
      "Approval gate cleared. Submission agent is delivering the authorization packet."
    ),
    createAuditEvent(
      `audit-${baseAuditLog.length + 2}`,
      "submission_agent",
      "Submission accepted",
      `Payer endpoint accepted the authorization packet under confirmation ${confirmationId}.`
    )
  ];
  const submittedAt = timestamp();

  submissionRecords.set(caseId, {
    caseId,
    executionState: "submitted",
    updatedAt: submittedAt,
    confirmationId,
    auditExportId: exportId,
    events
  });

  return {
    status: "submitted",
    executionState: "submitted",
    submittedAt,
    confirmationId,
    auditExportId: exportId,
    auditEvents: events
  };
}

export function getSubmissionStatus(caseId: string): SubmissionStatusResponse {
  const normalizedCaseId = normalizeCaseId(caseId);
  const record = submissionRecords.get(normalizedCaseId);

  if (!record) {
    return {
      caseId: normalizedCaseId,
      executionState: "not_started",
      updatedAt: timestamp()
    };
  }

  return {
    caseId: record.caseId,
    executionState: record.executionState,
    updatedAt: record.updatedAt,
    confirmationId: record.confirmationId,
    auditExportId: record.auditExportId,
    blockerCode: record.blockerCode,
    blockerDetail: record.blockerDetail
  };
}

export function exportSubmissionAudit(caseId: string): AuditExportResponse {
  const normalizedCaseId = normalizeCaseId(caseId);
  const record = submissionRecords.get(normalizedCaseId);

  if (!record) {
    const demoCase = createInitialCase();

    return {
      exportId: `audit-${normalizedCaseId.toLowerCase()}-snapshot`,
      caseId: normalizedCaseId,
      generatedAt: timestamp(),
      format: "json",
      fileName: `${normalizedCaseId.toLowerCase()}-audit-export.json`,
      executionState: "not_started",
      events: demoCase.auditLog
    };
  }

  return {
    exportId: record.auditExportId,
    caseId: record.caseId,
    generatedAt: record.updatedAt,
    format: "json",
    fileName: `${record.caseId.toLowerCase()}-audit-export.json`,
    executionState: record.executionState,
    confirmationId: record.confirmationId,
    events: record.events
  };
}
