import { Router } from "express";
import { exportSubmissionAudit, getSubmissionStatus, submitAuthorization } from "../services/submissionService";

export const submissionRouter = Router();

submissionRouter.post("/", (request, response) => {
  const result = submitAuthorization({
    caseId: String(request.body?.caseId ?? "demo"),
    caseStatus: request.body?.caseStatus,
    packetStatus: request.body?.packetStatus,
    missingCriteriaCount: request.body?.missingCriteriaCount,
    auditLog: request.body?.auditLog
  });

  response.status(result.status === "blocked" ? 409 : 200).json(result);
});

submissionRouter.get("/:caseId/status", (request, response) => {
  response.json(getSubmissionStatus(String(request.params.caseId ?? "demo")));
});

submissionRouter.get("/:caseId/audit-export", (request, response) => {
  response.json(exportSubmissionAudit(String(request.params.caseId ?? "demo")));
});
