import { chatJSON, isOpenAIConfigured } from "../lib/openai.js";
import type { VoiceIntent } from "../../../src/types/domain.js";

interface IntentResult {
  type: "summarize" | "explain" | "add_note" | "approve_submit" | "unknown";
  note?: string;
}

const SYSTEM_PROMPT = `You are a voice intent classifier for a medical prior authorization system.
Classify the user's spoken command into one of these intents:

- "summarize": User wants a patient summary (e.g., "summarize patient", "tell me about this case")
- "explain": User wants to understand the decision or what's missing (e.g., "why denied", "what's missing", "explain decision")
- "add_note": User wants to add clinical documentation (e.g., "add note: failed PT for 6 weeks", "document that therapy failed")
- "approve_submit": User wants to approve and submit (e.g., "approve and send", "submit this", "looks good send it")
- "unknown": Cannot determine intent

If the intent is "add_note", extract the note content from the command.

Return JSON:
{
  "type": "summarize" | "explain" | "add_note" | "approve_submit" | "unknown",
  "note": "extracted note content, only if type is add_note"
}`;

export async function classifyIntent(rawText: string): Promise<VoiceIntent> {
  if (!isOpenAIConfigured()) {
    return fallbackClassify(rawText);
  }

  try {
    const result = await chatJSON<IntentResult>(
      SYSTEM_PROMPT,
      `Classify this voice command: "${rawText}"`,
      "gpt-4o-mini"
    );

    return {
      type: result.type,
      rawText,
      payload: result.note ? { note: result.note } : undefined,
    };
  } catch {
    return fallbackClassify(rawText);
  }
}

function fallbackClassify(rawText: string): VoiceIntent {
  const normalized = rawText.trim().toLowerCase();

  if (normalized.includes("summarize")) return { type: "summarize", rawText };
  if (normalized.includes("why") || normalized.includes("explain") || normalized.includes("missing")) return { type: "explain", rawText };
  if (normalized.includes("add note") || normalized.includes("therapy") || normalized.includes("pt")) {
    const note = rawText.match(/add note[:\s-]*(.+)$/i)?.[1]?.trim();
    return { type: "add_note", rawText, payload: { note: note || "Failed conservative therapy for 6 weeks documented." } };
  }
  if (normalized.includes("approve") || normalized.includes("send") || normalized.includes("submit")) return { type: "approve_submit", rawText };
  return { type: "unknown", rawText };
}
