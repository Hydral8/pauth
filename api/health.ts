import { getPersistenceMode } from "./_backend/lib/turso";
export default async function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  response.status(200).json({
    ok: true,
    persistence: getPersistenceMode(),
    voiceProvider: "vapi"
  });
}
