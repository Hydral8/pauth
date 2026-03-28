import { Router } from "express";
import { parseCommand } from "../services/voiceService";
import type { VoiceIntentRequest } from "../types/api";

export const voiceRouter = Router();

voiceRouter.post("/intent", (request, response) => {
  const body = request.body as Partial<VoiceIntentRequest> | undefined;

  if (typeof body?.text !== "string" || body.text.trim().length === 0) {
    response.status(400).json({ error: "text is required" });
    return;
  }

  response.json(
    parseCommand({
      text: body.text,
      caseId: body.caseId
    })
  );
});
