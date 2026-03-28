import { json, readJson } from "../../backend/http";
import { startVoiceCall } from "../../backend/voiceService";
import type { StartVoiceCallRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request: Request) {
  const payload = await readJson<StartVoiceCallRequest>(request);
  const result = await startVoiceCall(payload);
  return json(result.configured ? 200 : 503, result);
}
