import { submitCaseTool } from "../../backend/toolsService";
import type { SubmitCaseToolRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: SubmitCaseToolRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const result = await submitCaseTool(request.body ?? {});
  response.status(result.status === "blocked" ? 409 : 200).json(result);
}
