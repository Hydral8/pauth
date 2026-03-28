import type {
  CaseActionRequest,
  CaseActionResponse,
  CaseResponse,
  HealthResponse,
  IntakeUploadRequest,
  IntakeUploadResponse,
  StartVoiceCallRequest,
  StartVoiceCallResponse,
  SubmitRequest,
  SubmitResponse,
  VoiceIntentResponse,
  VoiceStatusResponse
} from "../types/api";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const payload = (await response.json()) as T & { message?: string; blockerDetail?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.blockerDetail ?? `Request failed: ${response.status}`);
  }

  return payload;
}

export function fetchHealth() {
  return request<HealthResponse>("/api/health");
}

export function fetchDemoCase() {
  return request<CaseResponse>("/api/case/demo");
}

export function uploadIntakeDocument(payload: IntakeUploadRequest) {
  return request<IntakeUploadResponse>("/api/case/intake", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function applyCaseAction(payload: CaseActionRequest) {
  return request<CaseActionResponse>("/api/case/action", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function parseVoiceCommand(text: string, caseId?: string) {
  return request<VoiceIntentResponse>("/api/voice/intent", {
    method: "POST",
    body: JSON.stringify({ text, caseId })
  });
}

export function fetchVoiceStatus(caseId?: string) {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return request<VoiceStatusResponse>(`/api/voice/status${query}`);
}

export function startVoiceCall(payload: StartVoiceCallRequest) {
  return request<StartVoiceCallResponse>("/api/voice/call", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function submitCase(payload: SubmitRequest) {
  return request<SubmitResponse>("/api/submit", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export interface OrchestrationResponse {
  caseRecord: import("../types/domain").CaseRecord;
  stepsRun: string[];
  gatedAt: string | null;
}

export function runOrchestration(caseId: string, permissions: string[]) {
  return request<OrchestrationResponse>("/api/case/orchestrate", {
    method: "POST",
    body: JSON.stringify({ caseId, permissions })
  });
}

export interface AuditExportResponse {
  caseId: string;
  exportedAt: string;
  events: import("../types/domain").AuditEvent[];
  totalEvents: number;
}

export function exportAuditLog(caseId: string) {
  return request<AuditExportResponse>(`/api/audit/export?caseId=${encodeURIComponent(caseId)}`);
}
