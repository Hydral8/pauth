import { approveCase } from "../../backend/toolsService";
import type { ApproveCaseRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: ApproveCaseRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const result = await approveCase(request.body ?? {});
  response.status(result.status === "blocked" ? 409 : 200).json(result);
}
