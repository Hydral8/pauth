import { json } from "../../backend/http";
import { getVoiceStatus } from "../../backend/voiceService";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  return json(200, await getVoiceStatus(url.searchParams.get("caseId") ?? undefined));
}
