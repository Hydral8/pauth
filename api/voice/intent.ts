import { json, readJson } from "../../backend/http";
import { parseVoiceCommand } from "../../backend/voiceService";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request: Request) {
  const payload = (await request.json()) as { text: string; caseId?: string };
  return json(200, await parseVoiceCommand(payload.caseId, payload.text));
}
