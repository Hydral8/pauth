import { useCallback, useState } from "react";
import { AppHeader } from "../components/layout/AppHeader";
import { AppShell } from "../components/layout/AppShell";
import { ErrorState } from "../components/layout/ErrorState";
import { HeroSection } from "../components/layout/HeroSection";
import { LoadingState } from "../components/layout/LoadingState";
import { SettingsPanel } from "../components/settings/SettingsPanel";
import { AuditPanel } from "../components/audit/AuditPanel";
import { IntakePanel } from "../components/intake/IntakePanel";
import { ReasoningPanel } from "../components/reasoning/ReasoningPanel";
import { VoicePanel } from "../components/voice/VoicePanel";
import { useCaseController } from "./useCaseController";
import { PATIENT_TEMPLATES } from "../lib/patientTemplates";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "intake", label: "Intake" },
  { id: "reasoning", label: "Reasoning" },
  { id: "voice", label: "Voice" },
  { id: "approval", label: "Approval" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface DemoStepState {
  index: number;
  total: number;
  label: string;
  description: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [demoStep, setDemoStep] = useState<DemoStepState | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

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
    submissionError,
    orchestrate,
    loadNewCase
  } = useCaseController();

  const runDemo = useCallback(async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);

    const total = 4;

    // Step 1: Run extraction + policy agents via orchestrator
    setActiveTab("intake");
    setDemoStep({
      index: 1, total,
      label: "Running AI agents",
      description: "The extraction agent parses documents for clinical facts. The policy agent then evaluates criteria against payer policy.",
    });
    try {
      // Orchestrate without draft/submit permissions — will run extraction + policy then gate
      await orchestrate([]);
    } catch { /* continue */ }
    await sleep(1500);

    // Step 2: Show reasoning results
    setActiveTab("reasoning");
    setDemoStep({
      index: 2, total,
      label: "Criteria evaluated",
      description: "Policy criteria have been matched against clinical evidence. Expand any row to see the AI-generated evidence links.",
    });
    await sleep(3000);

    // Step 3: Resolve missing items + draft packet
    setDemoStep({
      index: 3, total,
      label: "Resolving gaps & drafting packet",
      description: "Adding missing documentation and generating the prior authorization letter.",
    });
    try {
      await runAction({
        type: "RESOLVE_MISSING_ITEM",
        payload: { note: "Supervised PT failure documented for 6 weeks.", source: "demo" },
      });
      // Now orchestrate with draft permission to generate the auth letter
      await orchestrate(["draft"]);
    } catch { /* continue */ }
    await sleep(2000);

    // Step 4: Approve and submit
    setActiveTab("approval");
    setDemoStep({
      index: 4, total,
      label: "Submitting to payer",
      description: "All criteria met. Approving and submitting the authorization packet.",
    });
    try {
      await runAction({ type: "APPROVE_SUBMIT", payload: { source: "manual" } });
    } catch { /* continue */ }
    await sleep(2000);

    setDemoStep(null);
    setIsDemoRunning(false);
  }, [isDemoRunning, runAction, orchestrate]);

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

      {demoStep && (
        <div className="demo-banner">
          <div className="demo-banner-header">
            <div className="demo-banner-dot" />
            <span className="demo-banner-step">Step {demoStep.index} of {demoStep.total}</span>
            <strong>{demoStep.label}</strong>
          </div>
          <p>{demoStep.description}</p>
          <div className="demo-progress">
            <div className="demo-progress-fill" style={{ width: `${(demoStep.index / demoStep.total) * 100}%` }} />
          </div>
        </div>
      )}

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === "overview" && (
          <>
            <HeroSection
              caseRecord={caseRecord}
              metrics={metrics}
              onRunDemo={runDemo}
              actionBusy={isDemoRunning || isSubmitting}
            />
            <div className="case-picker">
              <h3>Start a new case</h3>
              <p>Select a patient to begin a fresh prior authorization workflow with AI-powered analysis.</p>
              <div className="case-picker-grid">
                {PATIENT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    className={`case-picker-card ${caseRecord.id === template.id ? "case-picker-active" : ""}`}
                    onClick={async () => {
                      await loadNewCase(template.case);
                      setActiveTab("intake");
                    }}
                    disabled={isDemoRunning}
                  >
                    <strong>{template.label}</strong>
                    <p>{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "intake" && (
          <IntakePanel caseRecord={caseRecord} dispatch={runAction} />
        )}

        {activeTab === "reasoning" && (
          <ReasoningPanel caseRecord={caseRecord} metrics={metrics} dispatch={runAction} />
        )}

        {activeTab === "voice" && (
          <VoicePanel
            caseRecord={caseRecord}
            onCommand={(rawText) =>
              runAction({
                type: "VOICE_COMMAND_RECEIVED",
                payload: { type: "unknown", rawText },
              })
            }
            voiceStatus={voiceStatus}
            onPlaceCall={placeVoiceCall}
            isCalling={isVoiceCalling}
            latestCall={lastVoiceCall}
          />
        )}

        {activeTab === "approval" && (
          <AuditPanel
            caseRecord={caseRecord}
            onResolveMissing={() =>
              runAction({
                type: "RESOLVE_MISSING_ITEM",
                payload: {
                  note: "Failed conservative therapy for 6 weeks added by reviewer.",
                  source: "manual",
                },
              })
            }
            onApproveSubmit={() => runAction({ type: "APPROVE_SUBMIT", payload: { source: "manual" } })}
            submissionError={submissionError}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPanel backendOnline={backendOnline} voiceStatus={voiceStatus} />
        )}
      </div>
    </AppShell>
  );
}
