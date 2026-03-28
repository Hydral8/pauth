import { getVoiceStatus } from "../../backend/voiceService";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { query?: { caseId?: string } },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await getVoiceStatus(request.query?.caseId));
}
