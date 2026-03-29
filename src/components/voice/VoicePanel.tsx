import { useMemo, useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CommandChip } from "../ui/CommandChip";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import type { StartVoiceCallResponse, VoiceStatusResponse } from "../../types/api";
import type { CaseRecord, VoiceCallRecord } from "../../types/domain";

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike;
}

export function VoicePanel({
  caseRecord,
  onCommand,
  voiceStatus,
  onPlaceCall,
  isCalling,
  latestCall
}: {
  caseRecord: CaseRecord;
  onCommand: (command: string) => void | Promise<void>;
  voiceStatus?: VoiceStatusResponse;
  onPlaceCall: (phoneNumber: string) => Promise<StartVoiceCallResponse>;
  isCalling: boolean;
  latestCall?: VoiceCallRecord;
}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draftCommand, setDraftCommand] = useState("");
  const [heardCommand, setHeardCommand] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callMessage, setCallMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognition = useMemo(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return null;
    }
    const instance = new SpeechRecognition();
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    return instance;
  }, []);

  const submitCommand = async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onCommand(trimmed);
      setDraftCommand("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Voice command failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Panel>
      <SectionHeader
        step="Voice"
        title="Voice Controls"
        badge={<Badge tone="live">Voice enabled</Badge>}
      />
      <div className="two-column-grid">
        <Card className="voice-orb-panel">
          <button
            className={`voice-orb ${isListening ? "listening" : ""}`}
            disabled={!recognition || isProcessing}
            onClick={() => {
              if (!recognition) {
                return;
              }

              if (isListening) {
                recognition.stop();
                return;
              }

              setErrorMessage(null);
              recognition.onstart = () => setIsListening(true);
              recognition.onend = () => setIsListening(false);
              recognition.onerror = () => {
                setIsListening(false);
                setErrorMessage("Microphone access was blocked. Use a quick command or type below.");
              };
              recognition.onresult = (event) => {
                const spoken = event.results[0][0].transcript;
                setHeardCommand(spoken);
                void submitCommand(spoken);
              };
              recognition.start();
            }}
          >
            <svg className="voice-orb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="1" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          </button>
          <div className="voice-status-stack">
            <p className="voice-state">
              {isListening
                ? "Listening for a command"
                : recognition
                  ? "Speech recognition is ready for browser commands"
                  : "Speech API unavailable. Use typed commands or a live phone call."}
            </p>
            {heardCommand ? <p className="voice-heard">Last heard: “{heardCommand}”</p> : null}
            {errorMessage ? <p className="voice-error">{errorMessage}</p> : null}
          </div>
          <div className="voice-chips">
            {[
              "Summarize patient",
              "Why is this denied?",
              "What's missing?",
              "Add note: failed conservative therapy for 6 weeks",
              "Approve and send"
            ].map((command) => (
              <CommandChip key={command} label={command} onClick={() => void submitCommand(command)} disabled={isProcessing} />
            ))}
          </div>
          <form
            className="voice-fallback-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitCommand(draftCommand);
            }}
          >
            <label className="voice-input-label" htmlFor="voice-command-input">
              Typed command fallback
            </label>
            <textarea
              id="voice-command-input"
              className="voice-input"
              rows={3}
              placeholder="Example: Add note: failed supervised PT for 6 weeks"
              value={draftCommand}
              onChange={(event) => setDraftCommand(event.target.value)}
            />
            <div className="voice-fallback-actions">
              <Button type="submit" disabled={isProcessing || !draftCommand.trim()}>
                {isProcessing ? "Running..." : "Run command"}
              </Button>
              <Badge>Ready</Badge>
            </div>
          </form>
        </Card>

        <Card className="voice-transcript-panel">
          <div className="panel-title-row">
            <h4>Live Call Control</h4>
            <Badge tone="success">Dial-out ready</Badge>
          </div>
          <form
            className="voice-call-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setCallMessage(null);
              setErrorMessage(null);
              try {
                const response = await onPlaceCall(phoneNumber);
                setCallMessage(response.message);
                if (response.configured) {
                  setPhoneNumber("");
                }
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Unable to start the call.");
              }
            }}
          >
            <label className="voice-input-label" htmlFor="voice-phone-input">
              Patient callback number
            </label>
            <input
              id="voice-phone-input"
              className="voice-text-input"
              placeholder="+1 415 555 0188"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
            <div className="voice-fallback-actions">
              <Button type="submit" disabled={isCalling || !phoneNumber.trim()}>
                {isCalling ? "Dialing..." : "Start live call"}
              </Button>
              <Badge>Connected</Badge>
            </div>
          </form>

          {callMessage ? <p className="voice-heard">{callMessage}</p> : null}

          <div className="voice-call-list">
            <div className="panel-title-row">
              <h4>Recent voice activity</h4>
              <Badge>{caseRecord.voiceCalls.length} calls</Badge>
            </div>
            {latestCall ? (
              <div className="voice-call-item">
                <strong>{latestCall.target}</strong>
                <p>Status: {latestCall.status}</p>
                <p>{new Date(latestCall.updatedAt).toLocaleString()}</p>
              </div>
            ) : (
              <p>No phone calls started yet.</p>
            )}
          </div>

          <div className="transcript-log">
            {[...caseRecord.transcript].reverse().slice(0, 5).map((entry) => (
              <div key={entry.id} className={`transcript-item transcript-${entry.speaker}`}>
                <div className="transcript-copy">
                  <div className="transcript-meta">
                    <strong>{entry.speaker === "user" ? "Voice command" : "System"}</strong>
                    {entry.intent ? <Badge className="transcript-intent">{entry.intent.replace("_", " ")}</Badge> : null}
                  </div>
                  <p>{entry.text}</p>
                </div>
                <span className="timeline-time">
                  {new Date(entry.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Panel>
  );
}
