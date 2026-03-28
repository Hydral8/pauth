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
