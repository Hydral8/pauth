import { applyCaseAction } from "../../backend/caseService";
import type { CaseActionRequest } from "../../src/types/api";
import type { AppAction } from "../../src/types/actions";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: CaseActionRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const caseRecord = await applyCaseAction(request.body.caseId, request.body.action as AppAction);
  response.status(200).json({ caseRecord });
}
