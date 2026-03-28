import { chatJSON, isOpenAIConfigured } from "../lib/openai";
import type { CaseRecord, CriterionStatus, PolicyCriterion, Recommendation } from "../../src/types/domain";

interface PolicyResult {
  criteria: Array<{
    clauseTitle: string;
    clauseText: string;
    status: CriterionStatus;
    evidenceFactIds: string[];
    missingReason?: string;
  }>;
  recommendation: {
    status: "likely_approve" | "deny" | "incomplete";
    confidence: number;
    summary: string;
    missingItems: string[];
  };
}

const SYSTEM_PROMPT = `You are a policy matching agent for a prior authorization system.
Given a patient's clinical facts and the requested service, evaluate whether the case meets typical payer policy criteria.

For each criterion, determine if the available clinical facts satisfy it. Link each criterion to the specific fact IDs that provide evidence.

Return JSON with this exact structure:
{
  "criteria": [
    {
      "clauseTitle": "Short title for the policy clause",
      "clauseText": "Full text of what the policy requires",
      "status": "matched" or "missing" or "warning",
      "evidenceFactIds": ["fact-id-1", "fact-id-2"],
      "missingReason": "Only if status is missing or warning — what documentation is needed"
    }
  ],
  "recommendation": {
    "status": "likely_approve" or "deny" or "incomplete",
    "confidence": 0-100,
    "summary": "One sentence summary of the recommendation",
    "missingItems": ["List of items still needed, empty if none"]
  }
}

Generate 4-6 criteria typical for the requested service. Be realistic about what payers require.
Use the exact fact IDs provided in the input when linking evidence.`;

export async function runPolicyAgent(caseRecord: CaseRecord): Promise<CaseRecord> {
  if (!isOpenAIConfigured()) return caseRecord;
  if (caseRecord.facts.length === 0) return caseRecord;

  const factsDescription = caseRecord.facts
    .map((f) => `  - [${f.id}] ${f.label}: ${f.value ?? f.evidenceQuote ?? ""}`)
    .join("\n");

  const userPrompt = `Patient: ${caseRecord.patient.name}, age ${caseRecord.patient.age}
Payer: ${caseRecord.patient.payer}
Diagnosis: ${caseRecord.patient.diagnosis.join(", ")}
Medications: ${caseRecord.patient.medications.join(", ")}
History: ${caseRecord.patient.history.join("; ")}

Requested service: ${caseRecord.requestedService.label}
CPT: ${caseRecord.requestedService.cptCode ?? "N/A"}
ICD-10: ${caseRecord.requestedService.icd10Codes.join(", ")}
Rationale: ${caseRecord.requestedService.rationale}

Available clinical facts (use these exact IDs when linking evidence):
${factsDescription}

Evaluate this case against typical ${caseRecord.patient.payer} policy criteria for ${caseRecord.requestedService.label}.`;

  try {
    const result = await chatJSON<PolicyResult>(SYSTEM_PROMPT, userPrompt);

    const criteria: PolicyCriterion[] = result.criteria.map((c, i) => ({
      id: `criterion-${i + 1}`,
      clauseTitle: c.clauseTitle,
      clauseText: c.clauseText,
      status: c.status,
      evidenceFactIds: c.evidenceFactIds,
      missingReason: c.missingReason,
    }));

    const recommendation: Recommendation = {
      status: result.recommendation.status,
      confidence: result.recommendation.confidence,
      summary: result.recommendation.summary,
      missingItems: result.recommendation.missingItems,
    };

    const newStatus = recommendation.missingItems.length > 0 ? "needs-info" : "ready";

    return {
      ...caseRecord,
      status: newStatus,
      criteria,
      recommendation,
      auditLog: [
        ...caseRecord.auditLog,
        {
          id: `audit-${caseRecord.auditLog.length + 1}`,
          at: new Date().toISOString(),
          actor: "policy_agent",
          title: "Policy criteria evaluated",
          detail: `${criteria.filter((c) => c.status === "matched").length}/${criteria.length} criteria matched. Confidence: ${recommendation.confidence}%.`,
        },
      ],
    };
  } catch (error) {
    console.error("Policy agent error:", error);
    return caseRecord;
  }
}
