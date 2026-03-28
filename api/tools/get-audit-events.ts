import { getAuditEvents } from "../../backend/toolsService";
import type { GetAuditEventsRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: GetAuditEventsRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await getAuditEvents(request.body ?? {}));
}
