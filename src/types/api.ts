import type { AuditEvent, CaseRecord, VoiceCallRecord, VoiceIntent } from "./domain";

export interface HealthResponse {
  ok: true;
  persistence: "remote";
  voiceProvider: "vapi";
}

export interface CaseResponse {
  caseRecord: CaseRecord;
}

export interface CaseActionRequest {
  caseId?: string;
  action: {
    type: string;
    payload?: unknown;
  };
}

export type CaseActionResponse = CaseResponse;

export interface VoiceIntentResponse {
  intent: VoiceIntent;
  events: AuditEvent[];
  reply: string;
  reasoning: {
    summary: string;
    confidence: number;
    matchedCriteria: string[];
    missingCriteria: string[];
    nextStep: string;
  };
  caseRecord: CaseRecord;
}

export interface SubmitRequest {
  caseId: string;
}

export interface SubmitResponse {
  status: "blocked" | "submitted";
  executionState: "not_started" | "blocked" | "submitted";
  submittedAt?: string;
  confirmationId?: string;
  auditExportId: string;
  blockerCode?: "approval_required" | "missing_information";
  blockerDetail?: string;
  caseRecord: CaseRecord;
}

export interface IntakeUploadRequest {
  caseId?: string;
  kind: string;
  fileName: string;
}

export interface IntakeUploadResponse {
  caseRecord: CaseRecord;
}

export interface VoiceStatusResponse {
  provider: "vapi";
  configured: boolean;
  phoneCallingEnabled: boolean;
  assistantId?: string;
  phoneNumberId?: string;
  publicServerUrl?: string;
  recentCalls: VoiceCallRecord[];
}

export interface StartVoiceCallRequest {
  caseId?: string;
  phoneNumber: string;
}

export interface StartVoiceCallResponse {
  provider: "vapi";
  configured: boolean;
  message: string;
  caseRecord: CaseRecord;
  call?: VoiceCallRecord;
}

export interface ToolRequestBase {
  caseId?: string;
}

export interface GetCaseSummaryRequest extends ToolRequestBase {}

export interface GetCaseSummaryResponse {
  caseId: string;
  patientName: string;
  requestedService: string;
  payer: string;
  caseStatus: CaseRecord["status"];
  recommendationStatus: CaseRecord["recommendation"]["status"];
  confidence: number;
  summary: string;
}

export interface GetMissingCriteriaRequest extends ToolRequestBase {}

export interface GetMissingCriteriaResponse {
  caseId: string;
  missingCount: number;
  missingCriteria: Array<{
    id: string;
    clauseTitle: string;
    missingReason: string;
  }>;
  nextStep: string;
}

export interface AddCaseNoteRequest extends ToolRequestBase {
  note: string;
}

export interface AddCaseNoteResponse {
  caseRecord: CaseRecord;
  recordedNote: string;
  status: "recorded";
}

export interface ApproveCaseRequest extends ToolRequestBase {
  source?: "voice" | "manual";
}

export interface ApproveCaseResponse {
  caseRecord: CaseRecord;
  status: "approved" | "blocked";
  blockerDetail?: string;
}

export interface SubmitCaseToolRequest extends ToolRequestBase {}

export interface SubmitCaseToolResponse extends SubmitResponse {}

export interface GetAuditEventsRequest extends ToolRequestBase {
  limit?: number;
}

export interface GetAuditEventsResponse {
  caseId: string;
  events: AuditEvent[];
}
