import type { AppAction } from "../../src/types/actions";
import type { CaseRecord, VoiceIntent } from "../../src/types/domain";
import { getDemoCase } from "./caseService";
import type { VoiceIntentRequest, VoiceIntentResponse, VoiceReasoningPayload } from "../types/api";

function timestamp() {
  return new Date().toISOString();
}

function parseVoiceIntent(rawText: string): VoiceIntent {
  const normalized = rawText.trim().toLowerCase();

  if (normalized.includes("summarize")) {
    return { type: "summarize", rawText };
  }

  if (normalized.includes("why") || normalized.includes("explain")) {
    return { type: "explain", rawText };
  }

  if (normalized.includes("add note") || normalized.includes("therapy") || normalized.includes("pt")) {
    const extractedNote = rawText.match(/add note[:\s-]*(.+)$/i)?.[1]?.trim();

    return {
      type: "add_note",
      rawText,
      payload: {
        note: extractedNote || "Failed conservative therapy for 6 weeks documented."
      }
    };
  }

  if (normalized.includes("approve") || normalized.includes("send") || normalized.includes("submit")) {
    return { type: "approve_submit", rawText };
  }

  return { type: "unknown", rawText };
}

function buildReasoning(caseRecord: CaseRecord): VoiceReasoningPayload {
  const matchedCriteria = caseRecord.criteria
    .filter((criterion) => criterion.status === "matched")
    .map((criterion) => criterion.clauseTitle);
  const missingCriteria = caseRecord.criteria
    .filter((criterion) => criterion.status !== "matched")
    .map((criterion) => `${criterion.clauseTitle}: ${criterion.missingReason ?? criterion.clauseText}`);

  return {
    summary: `${matchedCriteria.length} of ${caseRecord.criteria.length} policy criteria are satisfied. ${caseRecord.recommendation.summary}`,
    confidence: caseRecord.recommendation.confidence,
    matchedCriteria,
    missingCriteria,
    nextStep: caseRecord.recommendation.missingItems[0] ?? "Ready for human approval and submission."
  };
}

function buildSummaryReply(caseRecord: CaseRecord) {
  return `${caseRecord.patient.name} is a ${caseRecord.patient.age}-year-old patient requesting ${caseRecord.requestedService.label} for ${caseRecord.patient.diagnosis.join(", ")}. ${caseRecord.recommendation.summary}`;
}

function buildExplainReply(reasoning: VoiceReasoningPayload) {
  if (reasoning.missingCriteria.length === 0) {
    return `The case is supported across all policy criteria and is ready for approval. Confidence is ${reasoning.confidence} percent.`;
  }

  return `The request is not ready yet because ${reasoning.missingCriteria[0]}. Confidence is ${reasoning.confidence} percent with ${reasoning.matchedCriteria.length} criteria already satisfied.`;
}

function buildAction(intent: VoiceIntent, caseRecord: CaseRecord): AppAction | null {
  switch (intent.type) {
    case "summarize":
      return { type: "SUMMARIZE_PATIENT" };
    case "explain":
      return { type: "EXPLAIN_DECISION" };
    case "add_note":
      return {
        type: "RESOLVE_MISSING_ITEM",
        payload: {
          note: intent.payload?.note ?? "Failed conservative therapy documented for 6 weeks.",
          source: "voice"
        }
      };
    case "approve_submit":
      return caseRecord.recommendation.missingItems.length === 0
        ? {
            type: "APPROVE_SUBMIT",
            payload: { source: "voice" }
          }
        : null;
    default:
      return null;
  }
}

function buildReply(intent: VoiceIntent, caseRecord: CaseRecord, reasoning: VoiceReasoningPayload): string {
  switch (intent.type) {
    case "summarize":
      return buildSummaryReply(caseRecord);
    case "explain":
      return buildExplainReply(reasoning);
    case "add_note":
      return `Queued note for review: ${intent.payload?.note ?? "Failed conservative therapy for 6 weeks documented."}`;
    case "approve_submit":
      return caseRecord.recommendation.missingItems.length === 0
        ? "Case is ready. Human approval can be recorded and the submission flow can start."
        : `Submission is blocked until ${caseRecord.recommendation.missingItems[0]}`;
    default:
      return "Voice command not recognized. Try summarize, explain, add note, or approve and send.";
  }
}

export function parseCommand(input: VoiceIntentRequest): VoiceIntentResponse {
  const { caseRecord } = getDemoCase();
  const intent = parseVoiceIntent(input.text);
  const reasoning = buildReasoning(caseRecord);
  const action = buildAction(intent, caseRecord);
  const reply = buildReply(intent, caseRecord, reasoning);
  const eventTitle =
    intent.type === "approve_submit" && action === null ? "Voice approval blocked" : "Voice intent parsed";

  return {
    intent,
    action,
    reply,
    reasoning,
    events: [
      {
        id: "voice-api-1",
        at: timestamp(),
        actor: "voice_router",
        title: eventTitle,
        detail: reply
      }
    ]
  };
}
