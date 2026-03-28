import type { SourceDocumentKind, VoiceIntent } from "./domain";
import type { CaseRecord } from "./domain";

export type AppAction =
  | { type: "HYDRATE_CASE"; payload: CaseRecord }
  | { type: "UPLOAD_DOCUMENT"; payload: { kind: SourceDocumentKind; fileName: string } }
  | { type: "RUN_DEMO_FLOW" }
  | { type: "EXPLAIN_DECISION" }
  | { type: "SUMMARIZE_PATIENT" }
  | { type: "RESOLVE_MISSING_ITEM"; payload: { note: string; source: "voice" | "manual" | "demo" } }
  | { type: "VOICE_COMMAND_RECEIVED"; payload: VoiceIntent }
  | { type: "APPROVE_SUBMIT"; payload: { source: "voice" | "manual" | "demo" } }
  | { type: "SUBMISSION_STARTED" }
  | { type: "SUBMISSION_SUCCEEDED" };

export type AppActionHandler = (action: AppAction) => void | Promise<void>;
