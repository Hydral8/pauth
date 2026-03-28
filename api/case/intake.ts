import { attachDocument } from "../_backend/caseService";
import type { IntakeUploadRequest } from "../../src/types/api";
export default async function handler(
  request: { body: IntakeUploadRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await attachDocument(request.body));
}
