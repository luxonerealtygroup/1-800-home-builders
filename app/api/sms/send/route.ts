import { mockCommunicationResponse } from "../../../_lib/communications";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const hasTwilioSmsKeys =
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_PHONE_NUMBER);

  if (!hasTwilioSmsKeys) {
    return Response.json({
      ...mockCommunicationResponse({
        channel: "text",
        provider: "twilio_sms",
        status: "sent",
      }),
      to: body.phone ?? null,
      body: body.message ?? "",
    });
  }

  return Response.json({
    ...mockCommunicationResponse({
      channel: "text",
      provider: "twilio_sms",
      status: "sent",
    }),
    note: "Twilio SMS keys exist, but live SMS sending is not connected yet.",
    to: body.phone ?? null,
    body: body.message ?? "",
  });
}
