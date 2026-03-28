import { parseVoiceCommand, getVoiceStatus, startVoiceCall } from "../../backend/voiceService";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: any; query?: Record<string, string | undefined>; method?: string },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const action = request.body?.action ?? request.query?.action;

  if (action === "status" || request.method === "GET") {
    response.status(200).json(await getVoiceStatus(request.query?.caseId));
    return;
  }

  if (action === "intent") {
    response.status(200).json(await parseVoiceCommand(request.body.caseId, request.body.text));
    return;
  }

  if (action === "call") {
    const result = await startVoiceCall(request.body);
    response.status(result.configured ? 200 : 503).json(result);
    return;
  }

  response.status(400).json({ error: `Unknown voice action: ${action}. Valid: status, intent, call` });
}
