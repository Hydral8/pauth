import { getCaseRecord } from "../../backend/caseStore";

export default async function handler(
  request: { query?: Record<string, string | undefined> },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const caseId = request.query?.caseId ?? "case-demo-001";
  const caseRecord = await getCaseRecord(caseId);

  response.status(200).json({
    caseId,
    exportedAt: new Date().toISOString(),
    patient: {
      name: caseRecord.patient.name,
      memberId: caseRecord.patient.memberId,
      payer: caseRecord.patient.payer,
    },
    requestedService: caseRecord.requestedService.label,
    status: caseRecord.status,
    criteriaSnapshot: caseRecord.criteria.map((c) => ({
      clause: c.clauseTitle,
      status: c.status,
    })),
    recommendation: caseRecord.recommendation,
    events: caseRecord.auditLog,
    totalEvents: caseRecord.auditLog.length,
  });
}
