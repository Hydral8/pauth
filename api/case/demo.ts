import { getDemoCase } from "../../backend/caseService";
import { json } from "../../backend/http";

export const config = {
  runtime: "nodejs"
};

export default async function handler() {
  return json(200, await getDemoCase());
}
