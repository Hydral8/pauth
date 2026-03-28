import type {
  AddCaseNoteRequest,
  AddCaseNoteResponse,
  ApproveCaseRequest,
  ApproveCaseResponse,
  GetAuditEventsRequest,
  GetAuditEventsResponse,
  GetCaseSummaryRequest,
  GetCaseSummaryResponse,
  GetMissingCriteriaRequest,
  GetMissingCriteriaResponse,
  SubmitCaseToolRequest,
  SubmitCaseToolResponse
} from "../../src/types/api.js";
import type { SwarmCapability } from "./swarm/types";
import { applyCaseAction } from "./caseService.js";
import { getCaseRecord } from "./caseStore.js";
import { submitAuthorization } from "./submissionService.js";
import { bootstrapSwarmAgents } from "./swarm/agents";
import { runSwarmOrchestration } from "./swarm/coordinator";
import { listAgents } from "./swarm/registry";

function resolveCaseId(caseId?: string) {
  return caseId ?? "case-demo-001";
}

export async function getCaseSummary(input: GetCaseSummaryRequest): Promise<GetCaseSummaryResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  return {
    caseId: caseRecord.id,
    patientName: caseRecord.patient.name,
    requestedService: caseRecord.requestedService.label,
    payer: caseRecord.patient.payer,
    caseStatus: caseRecord.status,
    recommendationStatus: caseRecord.recommendation.status,
    confidence: caseRecord.recommendation.confidence,
    summary: caseRecord.recommendation.summary
  };
}

export async function getMissingCriteria(input: GetMissingCriteriaRequest): Promise<GetMissingCriteriaResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  const missingCriteria = caseRecord.criteria
    .filter((criterion) => criterion.status === "missing")
    .map((criterion) => ({
      id: criterion.id,
      clauseTitle: criterion.clauseTitle,
      missingReason: criterion.missingReason ?? criterion.clauseText
    }));

  return {
    caseId: caseRecord.id,
    missingCount: missingCriteria.length,
    missingCriteria,
    nextStep: caseRecord.recommendation.missingItems[0] ?? "Ready for approval."
  };
}

export async function addCaseNote(input: AddCaseNoteRequest): Promise<AddCaseNoteResponse> {
  const nextCase = await applyCaseAction(resolveCaseId(input.caseId), {
    type: "RESOLVE_MISSING_ITEM",
    payload: {
      note: input.note,
      source: "voice"
    }
  });

  return {
    caseRecord: nextCase,
    recordedNote: input.note,
    status: "recorded"
  };
}

export async function approveCase(input: ApproveCaseRequest): Promise<ApproveCaseResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  const missingCount = caseRecord.criteria.filter((criterion) => criterion.status === "missing").length;

  if (missingCount > 0) {
    return {
      caseRecord,
      status: "blocked",
      blockerDetail: `Cannot approve while ${missingCount} policy item${missingCount === 1 ? "" : "s"} remain missing.`
    };
  }

  const nextCase = await applyCaseAction(caseRecord.id, {
    type: "APPROVE_SUBMIT",
    payload: {
      source: input.source ?? "voice"
    }
  });

  return {
    caseRecord: nextCase,
    status: "approved"
  };
}

export async function submitCaseTool(input: SubmitCaseToolRequest): Promise<SubmitCaseToolResponse> {
  return submitAuthorization(resolveCaseId(input.caseId));
}

export async function getAuditEvents(input: GetAuditEventsRequest): Promise<GetAuditEventsResponse> {
  const caseRecord = await getCaseRecord(resolveCaseId(input.caseId));
  return {
    caseId: caseRecord.id,
    events: [...caseRecord.auditLog].reverse().slice(0, input.limit ?? 5)
  };
}

// ---------------------------------------------------------------------------
// Swarm tools
// ---------------------------------------------------------------------------

export interface RunSwarmRequest {
  caseId?: string;
  permissions?: string[];
  capabilities?: SwarmCapability[];
}

export interface RunSwarmResponse {
  caseId: string;
  tasksCompleted: string[];
  tasksFailed: string[];
  tasksBlocked: string[];
  gatedCapabilities: string[];
  messageCount: number;
  summary: string;
}

export async function runSwarm(input: RunSwarmRequest): Promise<RunSwarmResponse> {
  bootstrapSwarmAgents();
  const caseId = resolveCaseId(input.caseId);
  const permissions = new Set(input.permissions ?? []);
  const result = await runSwarmOrchestration(caseId, permissions, input.capabilities);

  const summary = result.tasksCompleted.length > 0
    ? `Swarm completed ${result.tasksCompleted.join(", ")}. ${result.gatedCapabilities.length > 0 ? `Gated: ${result.gatedCapabilities.join(", ")}.` : ""}`
    : result.gatedCapabilities.length > 0
      ? `Swarm blocked — requires permissions for: ${result.gatedCapabilities.join(", ")}.`
      : "No tasks were executed.";

  return {
    caseId: result.caseRecord.id,
    tasksCompleted: result.tasksCompleted,
    tasksFailed: result.tasksFailed,
    tasksBlocked: result.tasksBlocked,
    gatedCapabilities: result.gatedCapabilities,
    messageCount: result.messageLog.length,
    summary,
  };
}

export interface GetSwarmStatusRequest {
  caseId?: string;
}

export interface GetSwarmStatusResponse {
  agents: Array<{ id: string; name: string; capabilities: string[]; status: string }>;
  agentCount: number;
}

export async function getSwarmStatus(_input: GetSwarmStatusRequest): Promise<GetSwarmStatusResponse> {
  bootstrapSwarmAgents();
  const agents = listAgents().map((a) => ({
    id: a.def.id,
    name: a.def.name,
    capabilities: [...a.def.capabilities],
    status: a.status,
  }));
  return { agents, agentCount: agents.length };
}
