import { createInitialCase } from "../../src/lib/mockData";
import type { CaseRecord, SourceDocumentKind } from "../../src/types/domain";
import type { CaseResponse, IntakeUploadRequest, IntakeUploadResponse } from "../types/api";

function createCaseResponse(caseRecord: CaseRecord): CaseResponse {
  return { caseRecord };
}

function isDocumentKind(value: unknown): value is SourceDocumentKind {
  return value === "clinical_note" || value === "payer_policy" || value === "lab" || value === "form";
}

export function getDemoCase(): CaseResponse {
  return createCaseResponse(createInitialCase());
}

export function attachDocument(input: IntakeUploadRequest): IntakeUploadResponse {
  const caseRecord = createInitialCase();

  if (!isDocumentKind(input.kind)) {
    return createCaseResponse(caseRecord);
  }

  return createCaseResponse({
    ...caseRecord,
    id: input.caseId ?? caseRecord.id,
    documents: caseRecord.documents.map((document) =>
      document.kind === input.kind
        ? {
            ...document,
            fileName: input.fileName,
            uploadedAt: new Date().toISOString()
          }
        : document
    )
  });
}
