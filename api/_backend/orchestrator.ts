import type { AuditActor, CaseRecord } from "../../src/types/domain";
import { getCaseRecord, saveCaseRecord } from "./caseStore";
import { runExtractionAgent } from "./agents/extractionAgent";
import { runPolicyAgent } from "./agents/policyAgent";
import { runDraftingAgent } from "./agents/draftingAgent";
import { submitAuthorization } from "./submissionService";

interface AgentStep {
  name: string;
  actor: AuditActor;
  permission: string | null; // null = no permission needed
  run: (caseRecord: CaseRecord) => Promise<CaseRecord>;
}

export interface OrchestrationResult {
  caseRecord: CaseRecord;
  stepsRun: string[];
  gatedAt?: string; // step name where pipeline was gated
}

export async function runOrchestration(
  caseId: string,
  permissions: Set<string> = new Set()
): Promise<OrchestrationResult> {
  let caseRecord = await getCaseRecord(caseId);
  const stepsRun: string[] = [];

  const steps: AgentStep[] = [
    {
      name: "extraction",
      actor: "extraction_agent",
      permission: null,
      run: async (cr) => {
        // Run extraction on all documents in parallel
        let updated = cr;
        const extractions = cr.documents.map((doc) =>
          runExtractionAgent(cr, doc)
        );
        const results = await Promise.all(extractions);

        // Merge all extracted facts
        const allFacts = results.flatMap((r) =>
          r.facts.filter((f) => !cr.facts.some((existing) => existing.id === f.id))
        );
        const allAuditEntries = results.flatMap((r) =>
          r.auditLog.filter((e) => !cr.auditLog.some((existing) => existing.id === e.id))
        );

        // Merge patient updates from all extractions
        let patient = cr.patient;
        for (const r of results) {
          patient = {
            ...patient,
            diagnosis: Array.from(new Set([...patient.diagnosis, ...r.patient.diagnosis])),
            medications: Array.from(new Set([...patient.medications, ...r.patient.medications])),
            history: Array.from(new Set([...patient.history, ...r.patient.history])),
          };
        }

        updated = {
          ...cr,
          facts: [...cr.facts, ...allFacts],
          patient,
          auditLog: [...cr.auditLog, ...allAuditEntries],
        };
        return updated;
      },
    },
    {
      name: "policy",
      actor: "policy_agent",
      permission: null,
      run: runPolicyAgent,
    },
    {
      name: "drafting",
      actor: "drafting_agent",
      permission: "draft",
      run: runDraftingAgent,
    },
    {
      name: "submission",
      actor: "submission_agent",
      permission: "submit",
      run: async (cr) => {
        const result = await submitAuthorization(caseId);
        return result.caseRecord;
      },
    },
  ];

  for (const step of steps) {
    // Check permission gate
    if (step.permission && !permissions.has(step.permission)) {
      await saveCaseRecord(caseRecord);
      return { caseRecord, stepsRun, gatedAt: step.name };
    }

    try {
      caseRecord = await step.run(caseRecord);
      stepsRun.push(step.name);
      await saveCaseRecord(caseRecord);
    } catch (error) {
      console.error(`Orchestrator: ${step.name} failed:`, error);
      caseRecord = {
        ...caseRecord,
        auditLog: [
          ...caseRecord.auditLog,
          {
            id: `audit-${caseRecord.auditLog.length + 1}`,
            at: new Date().toISOString(),
            actor: step.actor,
            title: `${step.name} failed`,
            detail: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
      await saveCaseRecord(caseRecord);
      return { caseRecord, stepsRun, gatedAt: step.name };
    }
  }

  await saveCaseRecord(caseRecord);
  return { caseRecord, stepsRun };
}
