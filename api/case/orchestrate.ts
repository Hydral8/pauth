import { runOrchestration } from "../../backend/orchestrator";

export default async function handler(
  request: { body: { caseId?: string; permissions?: string[] } },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const caseId = request.body.caseId ?? "case-demo-001";
  const permissions = new Set(request.body.permissions ?? []);

  const result = await runOrchestration(caseId, permissions);

  response.status(200).json({
    caseRecord: result.caseRecord,
    stepsRun: result.stepsRun,
    gatedAt: result.gatedAt ?? null,
  });
}
