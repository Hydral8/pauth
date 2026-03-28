import { attachDocument } from "../_backend/caseService.js";
import type { IntakeUploadRequest } from "../../src/types/api.js";
export default async function handler(
  request: { body: IntakeUploadRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await attachDocument(request.body));
}
