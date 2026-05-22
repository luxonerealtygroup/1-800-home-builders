import type { Lead } from "../crm-data";
import type { LeadEmail } from "./types";

export type EmailThreadMatch = {
  leadId: string;
  reason: "email" | "phone" | "thread_id";
};

export function findLeadForEmailThread(
  email: LeadEmail,
  leads: Lead[],
): EmailThreadMatch | null {
  const fromEmail = email.fromEmail.toLowerCase();
  const matchingLead = leads.find((lead) =>
    lead.email.toLowerCase() === fromEmail ||
    lead.activity.some((activity) => activity.detail.includes(email.threadId)),
  );

  if (!matchingLead) {
    return null;
  }

  return {
    leadId: matchingLead.id,
    reason:
      matchingLead.email.toLowerCase() === fromEmail ? "email" : "thread_id",
  };
}
