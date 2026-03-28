export type CaseStatus =
  | "intake"
  | "reasoning"
  | "needs-info"
  | "ready"
  | "approved"
  | "submitting"
  | "submitted";

export type DecisionStatus = "likely_approve" | "deny" | "incomplete";

export type CriterionStatus = "matched" | "missing" | "warning";

export type AuditActor =
  | "system"
  | "extraction_agent"
  | "policy_agent"
  | "drafting_agent"
  | "submission_agent"
  | "human"
  | "voice_router"
  | "swarm_coordinator";

export interface PatientInfo {
  id: string;
  name: string;
  age: number;
  payer: string;
  memberId: string;
  diagnosis: string[];
  medications: string[];
  history: string[];
}

export interface RequestedService {
  id: string;
  label: string;
  cptCode?: string;
  icd10Codes: string[];
  rationale: string;
}

export type SourceDocumentKind = "clinical_note" | "payer_policy" | "lab" | "form";

export interface SourceDocument {
  id: string;
  kind: SourceDocumentKind;
  title: string;
  fileName: string;
  uploadedAt: string;
}

export interface ClinicalFact {
  id: string;
  label: string;
  value?: string;
  evidenceDocId: string;
  evidenceQuote?: string;
  sourceLabel: string;
}

export interface PolicyCriterion {
  id: string;
  clauseTitle: string;
  clauseText: string;
  status: CriterionStatus;
  evidenceFactIds: string[];
  missingReason?: string;
}

export interface Recommendation {
  status: DecisionStatus;
  confidence: number;
  summary: string;
  missingItems: string[];
}

export interface AuthPacket {
  status: "not_ready" | "drafted" | "approved" | "submitted";
  formName: string;
  formContent?: string;
  attachments: string[];
  generatedAt?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: AuditActor;
  title: string;
  detail: string;
}

export interface TranscriptEntry {
  id: string;
  at: string;
  speaker: "user" | "system";
  text: string;
  intent?: VoiceIntent["type"];
}

export interface VoiceCallRecord {
  id: string;
  provider: "vapi";
  direction: "outbound";
  target: string;
  status: "queued" | "ringing" | "in-progress" | "ended" | "failed" | "unknown";
  assistantId?: string;
  externalCallId?: string;
  startedAt: string;
  updatedAt: string;
  summary?: string;
  transcript?: string;
}

export interface VoiceIntent {
  type: "summarize" | "explain" | "add_note" | "approve_submit" | "unknown";
  rawText: string;
  payload?: {
    note?: string;
  };
}

export interface CaseRecord {
  id: string;
  status: CaseStatus;
  patient: PatientInfo;
  requestedService: RequestedService;
  documents: SourceDocument[];
  facts: ClinicalFact[];
  criteria: PolicyCriterion[];
  recommendation: Recommendation;
  packet: AuthPacket;
  transcript: TranscriptEntry[];
  auditLog: AuditEvent[];
  voiceCalls: VoiceCallRecord[];
}
