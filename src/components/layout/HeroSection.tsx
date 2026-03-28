import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfidenceGauge } from "../ui/ConfidenceGauge";
import { MetricTile } from "../ui/MetricTile";
import type { CaseRecord } from "../../types/domain";

export function HeroSection({
  caseRecord,
  metrics,
  onRunDemo,
  onLoadMockCase,
  showMockAction,
  actionBusy
}: {
  caseRecord: CaseRecord;
  metrics: {
    confidence: number;
    missingCriteria: number;
    matchedCriteria: number;
    totalCriteria: number;
    nextAction: string;
  };
  onRunDemo: () => void | Promise<void>;
  onLoadMockCase?: () => void;
  showMockAction?: boolean;
  actionBusy?: boolean;
}) {
  return (
    <header className="hero">
      <div className="hero-grid">
        <Card className="hero-copy">
          <p className="section-kicker">Prior Authorization</p>
          <h2>Intake to submission, in minutes.</h2>
          <p className="hero-text">
            Structured case intake, criteria matching, approval workflow, and voice control in one workspace.
          </p>
          <div className="hero-actions">
            <Button onClick={onRunDemo} disabled={actionBusy}>
              {actionBusy ? "Running demo..." : "Run Demo Flow"}
            </Button>
            {showMockAction && onLoadMockCase ? (
              <Button onClick={onLoadMockCase} variant="secondary" disabled={actionBusy}>
                Swap Mock Case
              </Button>
            ) : null}
          </div>
          <div className="hero-metrics">
            <MetricTile label="Target time">&lt; 3 min</MetricTile>
            <MetricTile label="Approval likelihood">{metrics.confidence}%</MetricTile>
            <MetricTile label="Missing items">{metrics.missingCriteria}</MetricTile>
          </div>
        </Card>
        <Card className="hero-visual">
          <div className="signal-card">
            <span className="signal-label">Active case</span>
            <strong>{caseRecord.patient.name}</strong>
            <p>{caseRecord.requestedService.label}</p>
          </div>
          <div className="decision-ring-wrap">
            <ConfidenceGauge
              value={metrics.confidence}
              label={caseRecord.recommendation.status === "incomplete" ? "Needs update" : "Likely approved"}
            />
            <div className="decision-notes">
              <MetricTile label="Matched criteria">
                {metrics.matchedCriteria} / {metrics.totalCriteria}
              </MetricTile>
              <MetricTile label="Next best action">{metrics.nextAction}</MetricTile>
            </div>
          </div>
        </Card>
      </div>
    </header>
  );
}
