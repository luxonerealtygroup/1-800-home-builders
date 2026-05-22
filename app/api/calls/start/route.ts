import { mockCommunicationResponse } from "../../../_lib/communications";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const hasTwilioVoiceKeys =
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_PHONE_NUMBER);

  if (!hasTwilioVoiceKeys) {
    return Response.json({
      ...mockCommunicationResponse({
        channel: "call",
        provider: "twilio_voice",
        status: "attempted",
      }),
      to: body.phone ?? null,
    });
  }

  return Response.json({
    ...mockCommunicationResponse({
      channel: "call",
      provider: "twilio_voice",
      status: "attempted",
    }),
    note: "Twilio Voice keys exist, but live call start is not connected yet.",
    to: body.phone ?? null,
  });
}
