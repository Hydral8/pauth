import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import { TimelineItem } from "../ui/TimelineItem";
import type { AuditActor, CaseRecord, CaseStatus } from "../../types/domain";

const statusLabels: Record<CaseStatus, string> = {
  intake: "Intake open",
  reasoning: "Reasoning in progress",
  "needs-info": "Blocked on documentation",
  ready: "Ready for review",
  approved: "Approved by reviewer",
  submitting: "Submitting to payer",
  submitted: "Submitted"
};

const packetLabels: Record<CaseRecord["packet"]["status"], string> = {
  not_ready: "Packet not ready",
  drafted: "Packet drafted",
  approved: "Packet approved",
  submitted: "Packet submitted"
};

const actorLabels: Record<AuditActor, string> = {
  system: "System",
  extraction_agent: "Extraction agent",
  policy_agent: "Policy agent",
  drafting_agent: "Drafting agent",
  submission_agent: "Submission agent",
  human: "Reviewer",
  voice_router: "Voice router"
};

export function AuditPanel({
  caseRecord,
  onResolveMissing,
  onApproveSubmit,
  submissionError
}: {
  caseRecord: CaseRecord;
  onResolveMissing: () => void | Promise<void>;
  onApproveSubmit: () => void | Promise<void>;
  submissionError?: string | null;
}) {
  const isBlocked = caseRecord.status === "needs-info";
  const isReadyForApproval = caseRecord.status === "ready";
  const isSubmitting = caseRecord.status === "submitting";
  const isSubmitted = caseRecord.status === "submitted";
  const latestEvent = caseRecord.auditLog[caseRecord.auditLog.length - 1];
  const timeline = [...caseRecord.auditLog].reverse();
  const replaySteps = timeline.slice(0, 4);

  return (
    <Panel>
      <SectionHeader
        step="Approval"
        title="Review & Submit"
        badge={<Badge tone={isSubmitted ? "success" : isBlocked ? "warning" : "default"}>{packetLabels[caseRecord.packet.status]}</Badge>}
      />
      <div className="audit-grid">
        <Card>
          <div className="panel-title-row">
            <h4>Approval controls</h4>
            <Badge tone={isBlocked ? "warning" : isSubmitted ? "success" : "default"}>{statusLabels[caseRecord.status]}</Badge>
          </div>
          <div className="audit-summary-stack">
            <div className="signal-card">
              <span className="signal-label">Packet</span>
              <strong>{caseRecord.packet.formName}</strong>
              <p>{caseRecord.packet.attachments.length} supporting attachments included for release.</p>
            </div>
            <div className="signal-card">
              <span className="signal-label">Gate check</span>
              <strong>{isBlocked ? "Missing documentation" : "Reviewer sign-off enabled"}</strong>
              <p>
                {isBlocked
                  ? caseRecord.recommendation.missingItems[0] ?? "Resolve the remaining evidence gap before approval."
                  : "All policy criteria are satisfied and the packet can move to human approval."}
              </p>
            </div>
          </div>
          <div className="action-row audit-actions">
            <Button variant="secondary" onClick={onResolveMissing} disabled={!isBlocked}>
              Auto-add missing documentation
            </Button>
            <Button onClick={onApproveSubmit} disabled={!isReadyForApproval}>
              {isSubmitting ? "Submitting..." : isSubmitted ? "Submitted" : "Approve & Submit"}
            </Button>
          </div>
          <p>
            {isBlocked
              ? "Submission is locked until the reviewer resolves the required PT failure note."
              : isReadyForApproval
                ? "Submission is permission-gated and waiting for explicit reviewer approval."
                : isSubmitted
                  ? "Submission has cleared approval and execution. The audit log below captures the full chain of custody."
                  : "Approval has been recorded and the submission agent controls final execution state."}
          </p>
          {submissionError ? <p className="voice-error">{submissionError}</p> : null}
        </Card>

        <Card>
          <div className="panel-title-row">
            <h4>Execution status</h4>
            <Badge>Progress</Badge>
          </div>
          <div className="execution-list">
            <div className={`execution-step ${caseRecord.packet.status !== "not_ready" ? "is-complete" : ""}`}>
              <strong>1. Packet assembly</strong>
              <p>{packetLabels[caseRecord.packet.status]}</p>
            </div>
            <div className={`execution-step ${["approved", "submitting", "submitted"].includes(caseRecord.status) ? "is-complete" : ""}`}>
              <strong>2. Reviewer approval</strong>
              <p>{caseRecord.status === "approved" || isSubmitting || isSubmitted ? "Human approval captured." : "Awaiting reviewer sign-off."}</p>
            </div>
            <div className={`execution-step ${isSubmitting || isSubmitted ? "is-active" : ""} ${isSubmitted ? "is-complete" : ""}`}>
              <strong>3. Submission agent</strong>
              <p>{isSubmitted ? "Payer endpoint accepted the packet." : isSubmitting ? "Packet is in flight to the payer endpoint." : "Queued until approval is granted."}</p>
            </div>
          </div>
          <div className="audit-meta">
            <div>
              <span className="signal-label">Last event</span>
              <strong>{latestEvent?.title ?? "No events yet"}</strong>
            </div>
            <div>
              <span className="signal-label">Timestamp</span>
              <strong>
                {latestEvent
                  ? new Date(latestEvent.at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Pending"}
              </strong>
            </div>
          </div>
        </Card>

        <Card>
          <div className="panel-title-row">
            <h4>Replay steps</h4>
            <Badge>Recent</Badge>
          </div>
          <div className="replay-list">
            {replaySteps.map((event, index) => (
              <div key={event.id} className="replay-item">
                <span className="replay-index">0{index + 1}</span>
                <div>
                  <strong>{event.title}</strong>
                  <p>{actorLabels[event.actor]}</p>
                </div>
              </div>
            ))}
          </div>
          <p>Use the full audit timeline to reconstruct exactly when a reviewer, agent, or voice action changed execution state.</p>
        </Card>

        <Card>
          <div className="panel-title-row">
            <h4>Audit timeline</h4>
            <Badge>{timeline.length} events</Badge>
          </div>
          <ul className="timeline-list">
            {timeline.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </ul>
        </Card>
      </div>
    </Panel>
  );
}
