import { AppHeader } from "../components/layout/AppHeader";
import { AppShell } from "../components/layout/AppShell";
import { ErrorState } from "../components/layout/ErrorState";
import { HeroSection } from "../components/layout/HeroSection";
import { LoadingState } from "../components/layout/LoadingState";
import { StatusRail } from "../components/layout/StatusRail";
import { AuditPanel } from "../components/audit/AuditPanel";
import { IntakePanel } from "../components/intake/IntakePanel";
import { ReasoningPanel } from "../components/reasoning/ReasoningPanel";
import { VoicePanel } from "../components/voice/VoicePanel";
import { useCaseController } from "./useCaseController";

export function App() {
  const {
    caseRecord,
    metrics,
    runAction,
    placeVoiceCall,
    isBootstrapping,
    hasBootstrapError,
    backendOnline,
    isSubmitting,
    voiceStatus,
    isVoiceCalling,
    lastVoiceCall,
    submissionError
  } = useCaseController();

  if (isBootstrapping) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (hasBootstrapError) {
    return (
      <AppShell>
        <ErrorState onRetry={() => window.location.reload()} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader backendOnline={backendOnline} />
      <div className="app-grid">
        <div className="app-main">
          <HeroSection caseRecord={caseRecord} metrics={metrics} onRunDemo={() => runAction({ type: "RUN_DEMO_FLOW" })} actionBusy={isSubmitting} />
          <IntakePanel caseRecord={caseRecord} dispatch={runAction} />
          <ReasoningPanel caseRecord={caseRecord} metrics={metrics} dispatch={runAction} />
          <VoicePanel
            caseRecord={caseRecord}
            onCommand={(rawText) =>
              runAction({
                type: "VOICE_COMMAND_RECEIVED",
                payload: {
                  type: "unknown",
                  rawText
                }
              })
            }
            voiceStatus={voiceStatus}
            onPlaceCall={placeVoiceCall}
            isCalling={isVoiceCalling}
            latestCall={lastVoiceCall}
          />
          <AuditPanel
            caseRecord={caseRecord}
            onResolveMissing={() =>
              runAction({
                type: "RESOLVE_MISSING_ITEM",
                payload: {
                  note: "Failed conservative therapy for 6 weeks added by reviewer.",
                  source: "manual"
                }
              })
            }
            onApproveSubmit={() => runAction({ type: "APPROVE_SUBMIT", payload: { source: "manual" } })}
            submissionError={submissionError}
          />
        </div>
        <StatusRail backendOnline={backendOnline} caseStatus={caseRecord.status} packetStatus={caseRecord.packet.status} />
      </div>
    </AppShell>
  );
}
