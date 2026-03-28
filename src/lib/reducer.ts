import type { AppAction } from "../types/actions";
import type { AuditActor, CaseRecord, TranscriptEntry } from "../types/domain";

function timestamp() {
  return new Date().toISOString();
}

function pushTranscript(caseRecord: CaseRecord, entry: Omit<TranscriptEntry, "id" | "at">): TranscriptEntry[] {
  return [
    ...caseRecord.transcript,
    {
      id: `tx-${caseRecord.transcript.length + 1}`,
      at: timestamp(),
      ...entry
    }
  ];
}

function pushAudit(caseRecord: CaseRecord, actor: AuditActor, title: string, detail: string) {
  return [
    ...caseRecord.auditLog,
    {
      id: `audit-${caseRecord.auditLog.length + 1}`,
      at: timestamp(),
      actor,
      title,
      detail
    }
  ];
}

export function appReducer(state: CaseRecord, action: AppAction): CaseRecord {
  switch (action.type) {
    case "HYDRATE_CASE":
      return action.payload;

    case "UPLOAD_DOCUMENT":
      return {
        ...state,
        documents: state.documents.map((document) =>
          document.kind === action.payload.kind
            ? { ...document, fileName: action.payload.fileName, uploadedAt: timestamp() }
            : document
        ),
        auditLog: pushAudit(state, "human", "Document updated", `${action.payload.fileName} attached to ${action.payload.kind}.`)
      };

    case "RUN_DEMO_FLOW":
      return {
        ...state,
        status: "reasoning",
        auditLog: pushAudit(state, "system", "Demo flow started", "System demo initiated for live walkthrough.")
      };

    case "EXPLAIN_DECISION":
      return {
        ...state,
        transcript: pushTranscript(state, {
          speaker: "system",
          text:
            state.recommendation.status === "incomplete"
              ? "Four policy clauses are satisfied. The remaining blocker is explicit documentation of failed supervised PT."
              : "All policy clauses are currently satisfied and the packet is ready for release."
        })
      };

    case "SUMMARIZE_PATIENT":
      return {
        ...state,
        transcript: pushTranscript(state, {
          speaker: "system",
          text:
            "Maya Patel is a 46-year-old patient with 8 weeks of lumbar pain and radicular symptoms, failed NSAIDs, and worsening neurologic findings."
        })
      };

    case "VOICE_COMMAND_RECEIVED":
      return {
        ...state,
        transcript:
          action.payload.type === "unknown"
            ? pushTranscript(
                {
                  ...state,
                  transcript: pushTranscript(state, {
                    speaker: "user",
                    text: action.payload.rawText,
                    intent: action.payload.type
                  })
                },
                {
                  speaker: "system",
                  text: "I can summarize the patient, explain the decision, add the PT failure note, or approve and send."
                }
              )
            : pushTranscript(state, {
                speaker: "user",
                text: action.payload.rawText,
                intent: action.payload.type
              }),
        auditLog: pushAudit(state, "voice_router", "Voice command parsed", `Intent detected: ${action.payload.type}.`)
      };

    case "RESOLVE_MISSING_ITEM":
      return {
        ...state,
        status: "ready",
        criteria: state.criteria.map((criterion) =>
          criterion.id === "criterion-5"
            ? {
                ...criterion,
                status: "matched",
                missingReason: undefined,
                evidenceFactIds: ["fact-3"]
              }
            : criterion
        ),
        recommendation: {
          status: "likely_approve",
          confidence: 97,
          summary: "All policy requirements are satisfied. The case is ready for human approval.",
          missingItems: []
        },
        packet: {
          ...state.packet,
          status: "drafted",
          generatedAt: timestamp()
        },
        transcript: pushTranscript(state, {
          speaker: "system",
          text: action.payload.note
        }),
        auditLog: pushAudit(
          state,
          action.payload.source === "voice" ? "voice_router" : "human",
          "Missing documentation resolved",
          action.payload.note
        )
      };

    case "APPROVE_SUBMIT":
      return {
        ...state,
        status: "approved",
        packet: {
          ...state.packet,
          status: "approved",
          generatedAt: state.packet.generatedAt ?? timestamp()
        },
        auditLog: pushAudit(state, "human", "Human approval recorded", `Approval captured via ${action.payload.source}.`)
      };

    case "SUBMISSION_STARTED":
      return {
        ...state,
        status: "submitting",
        auditLog: pushAudit(state, "submission_agent", "Submission started", "Submission agent is sending the auth packet.")
      };

    case "SUBMISSION_SUCCEEDED":
      return {
        ...state,
        status: "submitted",
        packet: {
          ...state.packet,
          status: "submitted",
          generatedAt: state.packet.generatedAt ?? timestamp()
        },
        auditLog: pushAudit(state, "submission_agent", "Submission complete", "Payer endpoint accepted the authorization packet.")
      };

    default:
      return state;
  }
}
