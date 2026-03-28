import type {
  AuditEvent,
  AuthPacket,
  CaseRecord,
  CaseStatus,
  SourceDocumentKind,
  VoiceIntent
} from "../../src/types/domain";
import type { AppAction } from "../../src/types/actions";

export interface CaseResponse {
  caseRecord: CaseRecord;
}

export interface VoiceIntentRequest {
  text: string;
  caseId?: string;
}

export interface VoiceReasoningPayload {
  summary: string;
  confidence: number;
  matchedCriteria: string[];
  missingCriteria: string[];
  nextStep: string;
}

export interface VoiceIntentResponse {
  intent: VoiceIntent;
  action: AppAction | null;
  reply: string;
  reasoning: VoiceReasoningPayload;
  events: AuditEvent[];
}

export interface SubmitRequest {
  caseId: string;
  caseStatus?: CaseStatus;
  packetStatus?: AuthPacket["status"];
  missingCriteriaCount?: number;
  auditLog?: AuditEvent[];
}

export type SubmissionBlockerCode = "approval_required" | "missing_information";

export type SubmissionExecutionState = "not_started" | "blocked" | "submitted";

export interface SubmitResponse {
  status: "blocked" | "submitted";
  executionState: SubmissionExecutionState;
  submittedAt?: string;
  confirmationId?: string;
  auditExportId: string;
  auditEvents: AuditEvent[];
  blockerCode?: SubmissionBlockerCode;
  blockerDetail?: string;
}

export interface SubmissionStatusResponse {
  caseId: string;
  executionState: SubmissionExecutionState;
  updatedAt: string;
  confirmationId?: string;
  auditExportId?: string;
  blockerCode?: SubmissionBlockerCode;
  blockerDetail?: string;
}

export interface AuditExportResponse {
  exportId: string;
  caseId: string;
  generatedAt: string;
  format: "json";
  fileName: string;
  executionState: SubmissionExecutionState;
  confirmationId?: string;
  events: AuditEvent[];
}

export interface IntakeUploadRequest {
  caseId?: string;
  kind: SourceDocumentKind;
  fileName: string;
}

export type IntakeUploadResponse = CaseResponse;
