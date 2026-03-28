import { Router } from "express";
import { attachDocument, getDemoCase } from "../services/caseService";
import type { IntakeUploadRequest } from "../types/api";

export const caseRouter = Router();

caseRouter.get("/demo", (_request, response) => {
  response.json(getDemoCase());
});

caseRouter.post("/intake", (request, response) => {
  const input = request.body as IntakeUploadRequest;
  response.json(attachDocument(input));
});
