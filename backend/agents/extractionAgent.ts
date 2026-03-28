import { chatJSON, isOpenAIConfigured } from "../lib/openai";
import type { ClinicalFact, CaseRecord, SourceDocument } from "../../src/types/domain";

interface ExtractionResult {
  facts: Array<{
    label: string;
    value: string;
    evidenceQuote: string;
    sourceLabel: string;
  }>;
  patientUpdates: {
    diagnosis: string[];
    medications: string[];
    history: string[];
  };
}

const SYSTEM_PROMPT = `You are a clinical data extraction agent for a prior authorization system.
Given patient information, the requested service, and a document that was just uploaded, extract structured clinical facts.

Each fact should be a discrete clinical finding relevant to the prior authorization decision.
Include evidence quotes that would appear in the source document.

Return JSON with this exact structure:
{
  "facts": [
    {
      "label": "Short descriptive label of the clinical fact",
      "value": "The specific value or finding",
      "evidenceQuote": "A plausible quote from the source document supporting this fact",
      "sourceLabel": "Type of source (e.g., Clinical note, Lab result, Payer policy)"
    }
  ],
  "patientUpdates": {
    "diagnosis": ["ICD-10 codes found, e.g. M54.16"],
    "medications": ["Any medications mentioned"],
    "history": ["Relevant history items"]
  }
}

Extract 3-6 facts. Be specific and clinically relevant. Focus on findings that matter for the prior authorization decision.`;

export async function runExtractionAgent(
  caseRecord: CaseRecord,
  document: SourceDocument
): Promise<CaseRecord> {
  if (!isOpenAIConfigured()) return caseRecord;

  const userPrompt = `Patient: ${caseRecord.patient.name}, age ${caseRecord.patient.age}
Payer: ${caseRecord.patient.payer}
Diagnosis codes: ${caseRecord.patient.diagnosis.join(", ")}
Current medications: ${caseRecord.patient.medications.join(", ")}
History: ${caseRecord.patient.history.join("; ")}
Requested service: ${caseRecord.requestedService.label} (CPT: ${caseRecord.requestedService.cptCode ?? "N/A"})
ICD-10: ${caseRecord.requestedService.icd10Codes.join(", ")}
Rationale: ${caseRecord.requestedService.rationale}

Document just uploaded:
- Title: ${document.title}
- Type: ${document.kind}
- File: ${document.fileName}

Extract clinical facts from this document that are relevant to the prior authorization for ${caseRecord.requestedService.label}.`;

  try {
    const result = await chatJSON<ExtractionResult>(SYSTEM_PROMPT, userPrompt);
    const baseId = `fact-${document.id}-`;
    const newFacts: ClinicalFact[] = result.facts.map((f, i) => ({
      id: `${baseId}${i + 1}`,
      label: f.label,
      value: f.value,
      evidenceDocId: document.id,
      evidenceQuote: f.evidenceQuote,
      sourceLabel: f.sourceLabel,
    }));

    // Merge: keep existing facts from other docs, replace facts from this doc
    const existingFacts = caseRecord.facts.filter(
      (f) => f.evidenceDocId !== document.id
    );

    return {
      ...caseRecord,
      facts: [...existingFacts, ...newFacts],
      patient: {
        ...caseRecord.patient,
        diagnosis: Array.from(new Set([...caseRecord.patient.diagnosis, ...result.patientUpdates.diagnosis])),
        medications: Array.from(new Set([...caseRecord.patient.medications, ...result.patientUpdates.medications])),
        history: Array.from(new Set([...caseRecord.patient.history, ...result.patientUpdates.history])),
      },
      auditLog: [
        ...caseRecord.auditLog,
        {
          id: `audit-${caseRecord.auditLog.length + 1}`,
          at: new Date().toISOString(),
          actor: "extraction_agent",
          title: "Facts extracted",
          detail: `Extracted ${newFacts.length} clinical facts from ${document.fileName}.`,
        },
      ],
    };
  } catch (error) {
    console.error("Extraction agent error:", error);
    return caseRecord;
  }
}
