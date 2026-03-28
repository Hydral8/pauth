import type { CaseRecord } from "../types/domain";

export function getDashboardMetrics(caseRecord: CaseRecord) {
  const matchedCriteria = caseRecord.criteria.filter((criterion) => criterion.status === "matched").length;
  const missingCriteria = caseRecord.criteria.filter((criterion) => criterion.status === "missing").length;

  return {
    matchedCriteria,
    totalCriteria: caseRecord.criteria.length,
    missingCriteria,
    confidence: caseRecord.recommendation.confidence,
    nextAction: missingCriteria > 0 ? "Add PT failure note" : "Ready for submission"
  };
}

export function getReasoningViewModel(caseRecord: CaseRecord) {
  const factsById = new Map(caseRecord.facts.map((fact) => [fact.id, fact]));
  const documentsById = new Map(caseRecord.documents.map((document) => [document.id, document]));

  const facts = caseRecord.facts.map((fact) => {
    const linkedCriteria = caseRecord.criteria.filter((criterion) => criterion.evidenceFactIds.includes(fact.id));
    const document = documentsById.get(fact.evidenceDocId);

    return {
      ...fact,
      documentTitle: document?.title ?? fact.sourceLabel,
      linkedCriteriaCount: linkedCriteria.length,
      linkedCriteriaTitles: linkedCriteria.map((criterion) => criterion.clauseTitle)
    };
  });

  const criteria = caseRecord.criteria.map((criterion) => {
    const evidenceFacts = criterion.evidenceFactIds
      .map((factId) => factsById.get(factId))
      .filter((fact): fact is NonNullable<typeof fact> => Boolean(fact));

    return {
      ...criterion,
      evidenceFacts,
      evidenceSummary:
        evidenceFacts.length > 0 ? evidenceFacts.map((fact) => fact.label).join(", ") : criterion.missingReason ?? "Evidence not yet attached."
    };
  });

  const matchedCount = criteria.filter((criterion) => criterion.status === "matched").length;
  const missingCount = criteria.filter((criterion) => criterion.status === "missing").length;
  const warningCount = criteria.filter((criterion) => criterion.status === "warning").length;
  const totalCriteria = criteria.length || 1;
  const completionPercent = Math.round((matchedCount / totalCriteria) * 100);
  const evidenceLinks = criteria.reduce((count, criterion) => count + criterion.evidenceFacts.length, 0);

  const recommendationTone: "live" | "success" | "warning" =
    caseRecord.recommendation.status === "likely_approve"
      ? "success"
      : caseRecord.recommendation.status === "deny"
        ? "warning"
        : "live";

  return {
    facts,
    criteria,
    summary: {
      matchedCount,
      missingCount,
      warningCount,
      totalCriteria: caseRecord.criteria.length,
      completionPercent,
      evidenceLinks,
      confidence: caseRecord.recommendation.confidence,
      recommendationTone
    }
  };
}
