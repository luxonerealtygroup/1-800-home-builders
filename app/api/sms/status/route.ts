import { mockCommunicationResponse } from "../../../_lib/communications";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return Response.json({
    ...mockCommunicationResponse({
      channel: "text",
      provider: "twilio_sms",
      status: "delivered",
    }),
    messageId: body.messageId ?? null,
  });
}
