import { parseVoiceCommand } from "../../backend/voiceService";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: { text: string; caseId?: string } },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await parseVoiceCommand(request.body.caseId, request.body.text));
}
