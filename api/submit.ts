import { submitAuthorization } from "./_backend/submissionService";
import type { SubmitRequest } from "../src/types/api";
export default async function handler(
  request: { body: SubmitRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const result = await submitAuthorization(request.body.caseId);
  response.status(result.status === "blocked" ? 409 : 200).json(result);
}
