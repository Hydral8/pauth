import { attachDocument } from "../../backend/caseService";
import { json, readJson } from "../../backend/http";
import type { IntakeUploadRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request: Request) {
  const payload = await readJson<IntakeUploadRequest>(request);
  return json(200, await attachDocument(payload));
}
