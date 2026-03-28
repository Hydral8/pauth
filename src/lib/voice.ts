import type { VoiceIntent } from "../types/domain";

export function parseVoiceIntent(rawText: string): VoiceIntent {
  const normalized = rawText.trim().toLowerCase();

  if (normalized.includes("summarize")) {
    return { type: "summarize", rawText };
  }

  if (normalized.includes("why") || normalized.includes("explain") || normalized.includes("what's missing") || normalized.includes("what is missing") || normalized.includes("missing")) {
    return { type: "explain", rawText };
  }

  if (normalized.includes("add note") || normalized.includes("therapy") || normalized.includes("pt")) {
    return {
      type: "add_note",
      rawText,
      payload: {
        note: "Failed conservative therapy for 6 weeks documented."
      }
    };
  }

  if (normalized.includes("approve") || normalized.includes("send") || normalized.includes("submit")) {
    return { type: "approve_submit", rawText };
  }

  return { type: "unknown", rawText };
}
