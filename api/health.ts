import { getPersistenceMode } from "../backend/lib/turso";

export const config = {
  runtime: "nodejs"
};

export default async function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  response.status(200).json({
    ok: true,
    persistence: getPersistenceMode(),
    voiceProvider: "vapi"
  });
}
