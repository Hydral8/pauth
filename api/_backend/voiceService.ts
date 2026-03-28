import type {
  StartVoiceCallRequest,
  StartVoiceCallResponse,
  VoiceIntentResponse,
  VoiceStatusResponse
} from "../../src/types/api";
import type { AppAction } from "../../src/types/actions";
import type { CaseRecord, VoiceCallRecord, VoiceIntent } from "../../src/types/domain";
import { applyCaseAction, replaceCaseRecord } from "./caseService";
import { getCaseRecord } from "./caseStore";
import { submitAuthorization } from "./submissionService";
import { classifyIntent } from "./agents/intentClassifier";

function now() {
  return new Date().toISOString();
}

function getVoiceConfig() {
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const publicServerUrl = process.env.PUBLIC_SERVER_URL;

  return {
    configured: Boolean(apiKey && assistantId),
    apiKey,
    assistantId,
    phoneNumberId,
    publicServerUrl
  };
}

async function parseVoiceIntent(rawText: string): Promise<VoiceIntent> {
  return classifyIntent(rawText);
}

function buildReasoning(caseRecord: CaseRecord) {
  const matchedCriteria = caseRecord.criteria.filter((criterion) => criterion.status === "matched").map((criterion) => criterion.clauseTitle);
  const missingCriteria = caseRecord.criteria
    .filter((criterion) => criterion.status !== "matched")
    .map((criterion) => `${criterion.clauseTitle}: ${criterion.missingReason ?? criterion.clauseText}`);

  return {
    summary: `${matchedCriteria.length} of ${caseRecord.criteria.length} criteria are satisfied. ${caseRecord.recommendation.summary}`,
    confidence: caseRecord.recommendation.confidence,
    matchedCriteria,
    missingCriteria,
    nextStep: caseRecord.recommendation.missingItems[0] ?? "Ready for submission."
  };
}

function buildReply(intent: VoiceIntent, caseRecord: CaseRecord) {
  if (intent.type === "summarize") {
    return `${caseRecord.patient.name} is requesting ${caseRecord.requestedService.label}. ${caseRecord.recommendation.summary}`;
  }

  if (intent.type === "explain") {
    return caseRecord.recommendation.missingItems[0]
      ? `The case is blocked because ${caseRecord.recommendation.missingItems[0]}`
      : "The case satisfies the current policy criteria and is ready for approval.";
  }

  if (intent.type === "add_note") {
    return `Added reviewer note: ${intent.payload?.note ?? "Failed conservative therapy for 6 weeks documented."}`;
  }

  if (intent.type === "approve_submit") {
    return caseRecord.status === "submitted"
      ? "The authorization packet has been submitted."
      : caseRecord.recommendation.missingItems.length === 0
        ? "Approval recorded and submission initiated."
        : `Submission is blocked until ${caseRecord.recommendation.missingItems[0]}`;
  }

  return "Voice command not recognized. Try summarize, explain, add note, or approve and send.";
}

async function applyVoiceIntent(caseId: string, intent: VoiceIntent): Promise<CaseRecord> {
  await applyCaseAction(caseId, { type: "VOICE_COMMAND_RECEIVED", payload: intent });

  if (intent.type === "summarize") {
    return applyCaseAction(caseId, { type: "SUMMARIZE_PATIENT" });
  }

  if (intent.type === "explain") {
    return applyCaseAction(caseId, { type: "EXPLAIN_DECISION" });
  }

  if (intent.type === "add_note") {
    return applyCaseAction(caseId, {
      type: "RESOLVE_MISSING_ITEM",
      payload: {
        note: intent.payload?.note ?? "Failed conservative therapy for 6 weeks documented.",
        source: "voice"
      }
    });
  }

  if (intent.type === "approve_submit") {
    const response = await submitAuthorization(caseId);
    return response.caseRecord;
  }

  return getCaseRecord(caseId);
}

export async function parseVoiceCommand(caseId: string | undefined, text: string): Promise<VoiceIntentResponse> {
  const activeCaseId = caseId ?? "case-demo-001";
  const intent = await parseVoiceIntent(text);
  const caseRecord = await applyVoiceIntent(activeCaseId, intent);
  const reasoning = buildReasoning(caseRecord);

  return {
    intent,
    events: [
      {
        id: `voice-${Date.now().toString(36)}`,
        at: now(),
        actor: "voice_router",
        title: "Voice command processed",
        detail: buildReply(intent, caseRecord)
      }
    ],
    reply: buildReply(intent, caseRecord),
    reasoning,
    caseRecord
  };
}

export async function getVoiceStatus(caseId: string | undefined): Promise<VoiceStatusResponse> {
  const config = getVoiceConfig();
  const caseRecord = await getCaseRecord(caseId ?? "case-demo-001");

  return {
    provider: "vapi",
    configured: config.configured,
    phoneCallingEnabled: Boolean(config.configured && config.phoneNumberId && config.publicServerUrl),
    assistantId: config.assistantId,
    phoneNumberId: config.phoneNumberId,
    publicServerUrl: config.publicServerUrl,
    recentCalls: [...caseRecord.voiceCalls].reverse().slice(0, 5)
  };
}

export async function startVoiceCall(input: StartVoiceCallRequest): Promise<StartVoiceCallResponse> {
  const caseId = input.caseId ?? "case-demo-001";
  const config = getVoiceConfig();
  const caseRecord = await getCaseRecord(caseId);

  if (!config.configured || !config.phoneNumberId || !config.apiKey) {
    return {
      provider: "vapi",
      configured: false,
      message: "Vapi environment variables are missing. Set VAPI_PRIVATE_KEY, VAPI_ASSISTANT_ID, and VAPI_PHONE_NUMBER_ID.",
      caseRecord
    };
  }

  const startedAt = now();
  const provisionalCall: VoiceCallRecord = {
    id: `call-${Date.now().toString(36)}`,
    provider: "vapi",
    direction: "outbound",
    target: input.phoneNumber,
    status: "queued",
    assistantId: config.assistantId,
    startedAt,
    updatedAt: startedAt
  };

  let finalCall = provisionalCall;
  let message = `Queued outbound Vapi call to ${input.phoneNumber}.`;

  try {
    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistantId: config.assistantId,
        phoneNumberId: config.phoneNumberId,
        customer: {
          number: input.phoneNumber
        },
        assistantOverrides: {
          variableValues: {
            case_id: caseId,
            patient_name: caseRecord.patient.name
          }
        }
      })
    });

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(String(payload.message ?? `Vapi call creation failed with status ${response.status}`));
    }

    finalCall = {
      ...provisionalCall,
      externalCallId: typeof payload.id === "string" ? payload.id : undefined,
      status: typeof payload.status === "string" ? (payload.status as VoiceCallRecord["status"]) : "queued",
      updatedAt: now()
    };
    message = `Outbound call created for ${input.phoneNumber}.`;
  } catch (error) {
    finalCall = {
      ...provisionalCall,
      status: "failed",
      updatedAt: now(),
      summary: error instanceof Error ? error.message : "Voice call failed to start."
    };
    message = finalCall.summary ?? message;
  }

  const nextCase: CaseRecord = {
    ...caseRecord,
    voiceCalls: [finalCall, ...caseRecord.voiceCalls].slice(0, 20),
    auditLog: [
      ...caseRecord.auditLog,
      {
        id: `audit-${caseRecord.auditLog.length + 1}`,
        at: now(),
        actor: "voice_router",
        title: "Voice call created",
        detail: message
      }
    ]
  };

  await replaceCaseRecord(nextCase);

  return {
    provider: "vapi",
    configured: true,
    message,
    caseRecord: nextCase,
    call: finalCall
  };
}

export async function syncVoiceWebhook(payload: Record<string, unknown>, caseIdHint?: string) {
  const bodyCall = (payload.call ?? payload.message ?? {}) as Record<string, unknown>;
  const variableValues = (bodyCall.assistantOverrides as { variableValues?: Record<string, unknown> } | undefined)?.variableValues;
  const caseId =
    caseIdHint ??
    (typeof variableValues?.case_id === "string" ? variableValues.case_id : undefined) ??
    (typeof payload.caseId === "string" ? payload.caseId : undefined) ??
    "case-demo-001";

  const caseRecord = await getCaseRecord(caseId);
  const externalCallId =
    (typeof bodyCall.id === "string" ? bodyCall.id : undefined) ??
    (typeof payload.callId === "string" ? payload.callId : undefined);
  const status =
    (typeof bodyCall.status === "string" ? bodyCall.status : undefined) ??
    (typeof payload.status === "string" ? payload.status : undefined) ??
    "unknown";

  if (!externalCallId) {
    return caseRecord;
  }

  const existing = caseRecord.voiceCalls.find((call) => call.externalCallId === externalCallId);
  if (!existing) {
    return caseRecord;
  }

  const nextCall: VoiceCallRecord = {
    ...existing,
    status: status as VoiceCallRecord["status"],
    updatedAt: now(),
    summary:
      (typeof (bodyCall.analysis as { summary?: unknown } | undefined)?.summary === "string"
        ? ((bodyCall.analysis as { summary?: string }).summary as string)
        : existing.summary) ?? existing.summary,
    transcript:
      (typeof payload.transcript === "string" ? payload.transcript : existing.transcript) ?? existing.transcript
  };

  const nextCase: CaseRecord = {
    ...caseRecord,
    voiceCalls: caseRecord.voiceCalls.map((call) => (call.externalCallId === externalCallId ? nextCall : call)),
    auditLog: [
      ...caseRecord.auditLog,
      {
        id: `audit-${caseRecord.auditLog.length + 1}`,
        at: now(),
        actor: "voice_router",
        title: "Voice call updated",
        detail: `Call ${externalCallId} changed to ${nextCall.status}.`
      }
    ]
  };

  await replaceCaseRecord(nextCase);
  return nextCase;
}
