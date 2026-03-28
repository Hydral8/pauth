
export default async function handler(
  request: { body: Record<string, unknown>; query?: { caseId?: string } },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const { syncVoiceWebhook } = await import("../_backend/voiceService");
  const caseRecord = await syncVoiceWebhook(request.body, request.query?.caseId);
  response.status(200).json({
    received: true,
    payloadType: request.body.type ?? request.body.message ?? "unknown",
    caseId: caseRecord.id
  });
}
