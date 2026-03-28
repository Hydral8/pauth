import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import { getReasoningViewModel } from "../../lib/selectors";
import type { AppActionHandler } from "../../types/actions";
import type { CaseRecord } from "../../types/domain";

export function ReasoningPanel({
  caseRecord,
  metrics,
  dispatch
}: {
  caseRecord: CaseRecord;
  metrics: { confidence: number };
  dispatch: AppActionHandler;
}) {
  const reasoning = getReasoningViewModel(caseRecord);

  return (
    <>
      <Panel>
        <SectionHeader
          step="Step 2"
          title="Live Reasoning"
          badge={<Badge tone="live">{reasoning.summary.totalCriteria} clauses analyzed</Badge>}
        />
        <div className="reasoning-grid">
          <Card>
            <div className="panel-title-row">
              <h4>Extracted Clinical Facts</h4>
              <Badge>Source-linked</Badge>
            </div>
            <ul className="data-list">
              {reasoning.facts.map((fact) => (
                <li key={fact.id} className="fact-row">
                  <div className="list-copy">
                    <strong>{fact.label}</strong>
                    <p>
                      {fact.documentTitle}
                      {fact.evidenceQuote ? ` • "${fact.evidenceQuote}"` : ""}
                    </p>
                    <div className="evidence-pill-row">
                      <span className="evidence-pill">{fact.linkedCriteriaCount} linked criteria</span>
                      {fact.linkedCriteriaTitles.map((title) => (
                        <span key={title} className="evidence-pill evidence-pill-muted">
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="fact-tag">{fact.sourceLabel}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="panel-title-row">
              <h4>Policy Criteria Checklist</h4>
              <Badge>Line-by-line match</Badge>
            </div>
            <ul className="data-list">
              {reasoning.criteria.map((criterion) => (
                <li key={criterion.id} className="criterion-row">
                  <div className="list-copy">
                    <strong>{criterion.clauseTitle}</strong>
                    <p>{criterion.clauseText}</p>
                    <p className="criterion-detail">{criterion.evidenceSummary}</p>
                  </div>
                  <span className={`criterion-status criterion-${criterion.status}`}>{criterion.status}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="reasoning-wide-card">
            <div className="panel-title-row">
              <h4>Evidence Map</h4>
              <Badge tone={reasoning.summary.missingCount > 0 ? "warning" : "success"}>
                {reasoning.summary.evidenceLinks} links
              </Badge>
            </div>
            <div className="evidence-map">
              {reasoning.criteria.map((criterion) => (
                <div key={criterion.id} className="evidence-map-row">
                  <div>
                    <strong>{criterion.clauseTitle}</strong>
                    <p>{criterion.status === "missing" ? "Gap to resolve before release" : "Supporting evidence attached"}</p>
                  </div>
                  <div className="evidence-pill-row">
                    {criterion.evidenceFacts.length > 0 ? (
                      criterion.evidenceFacts.map((fact) => (
                        <span key={fact.id} className="evidence-pill">
                          {fact.label}
                        </span>
                      ))
                    ) : (
                      <span className="evidence-pill evidence-pill-alert">{criterion.missingReason ?? "No evidence attached"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          step="Step 3"
          title="Recommendation"
          badge={<Badge tone={reasoning.summary.recommendationTone}>{caseRecord.status}</Badge>}
        />
        <div className="decision-grid">
          <Card className="spotlight">
            <span>System recommendation</span>
            <strong>{caseRecord.recommendation.summary}</strong>
            <p>Confidence: {metrics.confidence}%</p>
          </Card>
          <Card>
            <span>Decision confidence</span>
            <strong>{reasoning.summary.completionPercent}% criteria coverage</strong>
            <p>
              {reasoning.summary.matchedCount} matched, {reasoning.summary.missingCount} missing, {reasoning.summary.warningCount} warnings.
            </p>
            <div className="confidence-bar" aria-hidden="true">
              <div className="confidence-bar-fill" style={{ width: `${reasoning.summary.confidence}%` }} />
            </div>
          </Card>
          <Card>
            <span>{caseRecord.recommendation.missingItems.length > 0 ? "Missing items" : "Decision support"}</span>
            <strong>{caseRecord.recommendation.missingItems[0] ?? caseRecord.requestedService.cptCode}</strong>
            <p>
              {caseRecord.recommendation.missingItems.length > 0
                ? "Human approval remains gated until the missing documentation is attached."
                : `ICD-10: ${caseRecord.requestedService.icd10Codes.join(", ")}`}
            </p>
            <Button variant="secondary" onClick={() => dispatch({ type: "EXPLAIN_DECISION" })}>
              Explain decision
            </Button>
          </Card>
        </div>
      </Panel>
    </>
  );
}
