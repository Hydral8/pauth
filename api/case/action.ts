import { applyCaseAction } from "../../backend/caseService";
import { json, readJson } from "../../backend/http";
import type { CaseActionRequest } from "../../src/types/api";
import type { AppAction } from "../../src/types/actions";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request: Request) {
  const payload = await readJson<CaseActionRequest>(request);
  const caseRecord = await applyCaseAction(payload.caseId, payload.action as AppAction);
  return json(200, { caseRecord });
}
