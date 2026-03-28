import { getCaseSummary } from "../../backend/toolsService";
import type { GetCaseSummaryRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: GetCaseSummaryRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await getCaseSummary(request.body ?? {}));
}
