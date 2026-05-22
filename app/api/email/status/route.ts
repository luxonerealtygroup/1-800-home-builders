import { mockCommunicationResponse } from "../../../_lib/communications";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return Response.json({
    ...mockCommunicationResponse({
      channel: "email",
      provider: "resend_or_sendgrid",
      status: "delivered",
    }),
    emailId: body.emailId ?? null,
  });
}
