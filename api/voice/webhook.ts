import { json, readJson } from "../../backend/http";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request: Request) {
  const payload = await readJson<Record<string, unknown>>(request);
  return json(200, { received: true, payloadType: payload.type ?? payload.message ?? "unknown" });
}
