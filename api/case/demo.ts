import { getDemoCase } from "../../backend/caseService";

export const config = {
  runtime: "nodejs"
};

export default async function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  response.status(200).json(await getDemoCase());
}
