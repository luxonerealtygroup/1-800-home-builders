import { mockCommunicationResponse } from "../../../_lib/communications";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const hasEmailKey = Boolean(process.env.RESEND_API_KEY);

  if (!hasEmailKey) {
    return Response.json({
      ...mockCommunicationResponse({
        channel: "email",
        provider: "resend_or_sendgrid",
        status: "sent",
      }),
      to: body.email ?? null,
      subject: body.subject ?? "ADU project follow-up",
      body: body.message ?? "",
    });
  }

  return Response.json({
    ...mockCommunicationResponse({
      channel: "email",
      provider: "resend_or_sendgrid",
      status: "sent",
    }),
    note: "Email provider key exists, but live email sending is not connected yet.",
    to: body.email ?? null,
    subject: body.subject ?? "ADU project follow-up",
    body: body.message ?? "",
  });
}
