import { chatText, isOpenAIConfigured } from "../lib/openai";
import type { CaseRecord } from "../../../src/types/domain";

const SYSTEM_PROMPT = `You are a drafting agent for a prior authorization system.
Generate a concise prior authorization request letter based on the case details.
Include: patient info, diagnosis, requested service, clinical justification, and supporting evidence.
Write in a professional, clinical tone suitable for payer submission.
Keep it under 300 words.`;

export async function runDraftingAgent(caseRecord: CaseRecord): Promise<CaseRecord> {
  if (!isOpenAIConfigured()) return caseRecord;

  const matchedCriteria = caseRecord.criteria.filter((c) => c.status === "matched");
  const factsText = caseRecord.facts.map((f) => `- ${f.label}: ${f.evidenceQuote ?? f.value ?? ""}`).join("\n");
  const criteriaText = matchedCriteria.map((c) => `- ${c.clauseTitle}: ${c.clauseText}`).join("\n");

  const userPrompt = `Generate a prior authorization request letter for:

Patient: ${caseRecord.patient.name}, age ${caseRecord.patient.age}
Member ID: ${caseRecord.patient.memberId}
Payer: ${caseRecord.patient.payer}
Diagnosis: ${caseRecord.patient.diagnosis.join(", ")}

Requested: ${caseRecord.requestedService.label}
CPT: ${caseRecord.requestedService.cptCode ?? "N/A"}
ICD-10: ${caseRecord.requestedService.icd10Codes.join(", ")}
Rationale: ${caseRecord.requestedService.rationale}

Clinical evidence:
${factsText}

Policy criteria satisfied:
${criteriaText}`;

  try {
    const formContent = await chatText(SYSTEM_PROMPT, userPrompt);

    const attachments = [
      ...caseRecord.documents.map((d) => d.fileName),
      "Prior authorization request letter",
    ];

    return {
      ...caseRecord,
      packet: {
        ...caseRecord.packet,
        status: "drafted",
        formContent,
        attachments,
        generatedAt: new Date().toISOString(),
      },
      auditLog: [
        ...caseRecord.auditLog,
        {
          id: `audit-${caseRecord.auditLog.length + 1}`,
          at: new Date().toISOString(),
          actor: "drafting_agent",
          title: "Auth packet drafted",
          detail: `Generated prior authorization letter with ${attachments.length} attachments.`,
        },
      ],
    };
  } catch (error) {
    console.error("Drafting agent error:", error);
    return caseRecord;
  }
}
