import type { SwarmAgentDef } from "./types.js";
import { registerAgent } from "./registry.js";
import { runExtractionAgent } from "../agents/extractionAgent.js";
import { runPolicyAgent } from "../agents/policyAgent.js";
import { runDraftingAgent } from "../agents/draftingAgent.js";
import { submitAuthorization } from "../submissionService.js";

// ---------------------------------------------------------------------------
// Swarm agent wrappers — adapt existing agents to the SwarmAgentDef interface
// ---------------------------------------------------------------------------

export const extractionSwarmAgent: SwarmAgentDef = {
  id: "swarm-extraction",
  name: "Extraction Agent",
  actor: "extraction_agent",
  capabilities: ["extract"],
  dependsOn: [], // no deps — can run immediately
  permissionGates: [{ capability: "extract", requiredPermission: null }],
  priority: 10,
  execute: async (ctx) => {
    try {
      let caseRecord = ctx.caseRecord;

      // Run extraction on all documents in parallel (same as original)
      const extractions = caseRecord.documents.map((doc) =>
        runExtractionAgent(caseRecord, doc)
      );
      const results = await Promise.all(extractions);

      // Merge facts from all documents
      const allFacts = results.flatMap((r) =>
        r.facts.filter((f) => !caseRecord.facts.some((existing) => existing.id === f.id))
      );
      const allAuditEntries = results.flatMap((r) =>
        r.auditLog.filter((e) => !caseRecord.auditLog.some((existing) => existing.id === e.id))
      );

      // Merge patient info
      let patient = caseRecord.patient;
      for (const r of results) {
        patient = {
          ...patient,
          diagnosis: Array.from(new Set([...patient.diagnosis, ...r.patient.diagnosis])),
          medications: Array.from(new Set([...patient.medications, ...r.patient.medications])),
          history: Array.from(new Set([...patient.history, ...r.patient.history])),
        };
      }

      caseRecord = {
        ...caseRecord,
        facts: [...caseRecord.facts, ...allFacts],
        patient,
        auditLog: [...caseRecord.auditLog, ...allAuditEntries],
      };

      // Notify coordinator that extraction is done
      ctx.sendMessage({
        type: "task_completed",
        from: "swarm-extraction",
        to: "coordinator",
        capability: "extract",
        payload: { factsExtracted: allFacts.length, documentsProcessed: results.length },
        permissionScope: null,
      });

      return { success: true, caseRecord };
    } catch (error) {
      return {
        success: false,
        caseRecord: ctx.caseRecord,
        error: error instanceof Error ? error.message : "Extraction failed",
      };
    }
  },
};

export const policySwarmAgent: SwarmAgentDef = {
  id: "swarm-policy",
  name: "Policy Agent",
  actor: "policy_agent",
  capabilities: ["policy"],
  dependsOn: ["extract"], // needs facts before it can evaluate
  permissionGates: [{ capability: "policy", requiredPermission: null }],
  priority: 8,
  execute: async (ctx) => {
    try {
      const caseRecord = await runPolicyAgent(ctx.caseRecord);

      ctx.sendMessage({
        type: "task_completed",
        from: "swarm-policy",
        to: "coordinator",
        capability: "policy",
        payload: {
          criteriaMatched: caseRecord.criteria.filter((c) => c.status === "matched").length,
          criteriaMissing: caseRecord.criteria.filter((c) => c.status === "missing").length,
          confidence: caseRecord.recommendation.confidence,
        },
        permissionScope: null,
      });

      // If there are missing items, request a review agent (dynamic delegation)
      const missingCount = caseRecord.criteria.filter((c) => c.status === "missing").length;

      return {
        success: true,
        caseRecord,
        delegationRequests: missingCount > 0 ? ["review"] : undefined,
      };
    } catch (error) {
      return {
        success: false,
        caseRecord: ctx.caseRecord,
        error: error instanceof Error ? error.message : "Policy evaluation failed",
      };
    }
  },
};

export const draftingSwarmAgent: SwarmAgentDef = {
  id: "swarm-drafting",
  name: "Drafting Agent",
  actor: "drafting_agent",
  capabilities: ["draft"],
  dependsOn: ["policy"], // needs criteria evaluation
  permissionGates: [{ capability: "draft", requiredPermission: "draft" }],
  priority: 5,
  execute: async (ctx) => {
    try {
      const caseRecord = await runDraftingAgent(ctx.caseRecord);

      ctx.sendMessage({
        type: "task_completed",
        from: "swarm-drafting",
        to: "coordinator",
        capability: "draft",
        payload: { packetStatus: caseRecord.packet.status },
        permissionScope: "draft",
      });

      return { success: true, caseRecord };
    } catch (error) {
      return {
        success: false,
        caseRecord: ctx.caseRecord,
        error: error instanceof Error ? error.message : "Drafting failed",
      };
    }
  },
};

export const submissionSwarmAgent: SwarmAgentDef = {
  id: "swarm-submission",
  name: "Submission Agent",
  actor: "submission_agent",
  capabilities: ["submit"],
  dependsOn: ["draft"], // needs the auth packet drafted
  permissionGates: [{ capability: "submit", requiredPermission: "submit" }],
  priority: 1,
  execute: async (ctx) => {
    try {
      const result = await submitAuthorization(ctx.caseRecord.id);

      ctx.sendMessage({
        type: "task_completed",
        from: "swarm-submission",
        to: "coordinator",
        capability: "submit",
        payload: { submissionStatus: result.status },
        permissionScope: "submit",
      });

      return { success: true, caseRecord: result.caseRecord };
    } catch (error) {
      return {
        success: false,
        caseRecord: ctx.caseRecord,
        error: error instanceof Error ? error.message : "Submission failed",
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Bootstrap — register all agents into the swarm
// ---------------------------------------------------------------------------

let bootstrapped = false;

export function bootstrapSwarmAgents(): void {
  if (bootstrapped) return;

  registerAgent(extractionSwarmAgent);
  registerAgent(policySwarmAgent);
  registerAgent(draftingSwarmAgent);
  registerAgent(submissionSwarmAgent);

  bootstrapped = true;
}
