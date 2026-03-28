import { startVoiceCall } from "../../backend/voiceService";
import type { StartVoiceCallRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: StartVoiceCallRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const result = await startVoiceCall(request.body);
  response.status(result.configured ? 200 : 503).json(result);
}
