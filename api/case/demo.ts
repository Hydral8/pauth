import { getDemoCase } from "../_backend/caseService.js";
export default async function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  response.status(200).json(await getDemoCase());
}
