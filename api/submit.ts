import { json, readJson } from "../backend/http";
import { submitAuthorization } from "../backend/submissionService";
import type { SubmitRequest } from "../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request: Request) {
  const payload = await readJson<SubmitRequest>(request);
  const result = await submitAuthorization(payload.caseId);
  return json(result.status === "blocked" ? 409 : 200, result);
}
