import { mockCommunicationResponse } from "../../../_lib/communications";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return Response.json({
    ...mockCommunicationResponse({
      channel: "call",
      provider: "twilio_voice",
      status: "completed",
    }),
    callId: body.callId ?? null,
  });
}
