import { createInitialCase, createMockCaseById } from "../src/lib/mockData";
import type { CaseRecord } from "../src/types/domain";
import { getDb } from "./lib/turso";

function now() {
  return new Date().toISOString();
}

function parseCaseRecord(value: string): CaseRecord {
  return JSON.parse(value) as CaseRecord;
}

export async function getCaseRecord(caseId = "case-demo-001"): Promise<CaseRecord> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT payload FROM authflow_cases WHERE id = ?",
    args: [caseId]
  });

  const row = result.rows[0] as { payload?: string } | undefined;
  if (row?.payload) {
    return parseCaseRecord(row.payload);
  }

  const seededCase = caseId === "case-demo-001" ? createInitialCase() : createMockCaseById(caseId);
  await saveCaseRecord({ ...seededCase, id: caseId });
  return { ...seededCase, id: caseId };
}

export async function saveCaseRecord(caseRecord: CaseRecord) {
  const db = await getDb();
  await db.execute({
    sql: `
      INSERT INTO authflow_cases (id, payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    args: [caseRecord.id, JSON.stringify(caseRecord), now()]
  });
}
