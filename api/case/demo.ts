import { getDemoCase, initCase } from "../_backend/caseService.js";

export default async function handler(
  request: { body?: any; query?: Record<string, string | undefined>; method?: string },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  // POST: initialize a new case from a template
  if (request.method === "POST" && request.body?.caseRecord) {
    response.status(200).json(await initCase(request.body.caseRecord));
    return;
  }

  // GET: fetch existing case (or default demo)
  const caseId = request.query?.caseId;
  response.status(200).json(await getDemoCase(caseId));
}
