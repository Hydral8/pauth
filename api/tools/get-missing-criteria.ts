import { getMissingCriteria } from "../../backend/toolsService";
import type { GetMissingCriteriaRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: GetMissingCriteriaRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await getMissingCriteria(request.body ?? {}));
}
