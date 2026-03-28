import { appReducer } from "../src/lib/reducer";
import type { AppAction } from "../src/types/actions";
import type { CaseResponse, IntakeUploadRequest } from "../src/types/api";
import type { CaseRecord, SourceDocumentKind } from "../src/types/domain";
import { getCaseRecord, saveCaseRecord } from "./caseStore";

function isDocumentKind(value: unknown): value is SourceDocumentKind {
  return value === "clinical_note" || value === "payer_policy" || value === "lab" || value === "form";
}

export async function getDemoCase(): Promise<CaseResponse> {
  return { caseRecord: await getCaseRecord("case-demo-001") };
}

export async function attachDocument(input: IntakeUploadRequest): Promise<CaseResponse> {
  const caseId = input.caseId ?? "case-demo-001";
  const caseRecord = await getCaseRecord(caseId);

  if (!isDocumentKind(input.kind)) {
    return { caseRecord };
  }

  const nextCase = appReducer(caseRecord, {
    type: "UPLOAD_DOCUMENT",
    payload: {
      kind: input.kind,
      fileName: input.fileName
    }
  });

  await saveCaseRecord(nextCase);
  return { caseRecord: nextCase };
}

export async function applyCaseAction(caseId: string | undefined, action: AppAction): Promise<CaseRecord> {
  const activeCaseId = caseId ?? "case-demo-001";
  const caseRecord = await getCaseRecord(activeCaseId);
  const nextCase = appReducer(caseRecord, action);
  await saveCaseRecord(nextCase);
  return nextCase;
}

export async function replaceCaseRecord(caseRecord: CaseRecord) {
  await saveCaseRecord(caseRecord);
  return caseRecord;
}
