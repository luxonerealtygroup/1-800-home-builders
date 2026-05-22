import type { Lead } from "../crm-data";
import type { DuplicateMatch, ParsedLeadEmail } from "./types";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function findDuplicateLead(
  parsedLead: ParsedLeadEmail,
  leads: Lead[],
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const parsedEmail = normalizeText(parsedLead.email);
  const parsedPhone = normalizePhone(parsedLead.phone);
  const parsedAddress = normalizeText(parsedLead.propertyAddress);

  leads.forEach((lead) => {
    if (parsedEmail && normalizeText(lead.email) === parsedEmail) {
      matches.push({
        field: "email",
        leadId: lead.id,
        leadName: lead.name,
        value: parsedLead.email,
      });
    }

    if (parsedPhone && normalizePhone(lead.phone) === parsedPhone) {
      matches.push({
        field: "phone",
        leadId: lead.id,
        leadName: lead.name,
        value: parsedLead.phone,
      });
    }

    if (parsedAddress && normalizeText(lead.address) === parsedAddress) {
      matches.push({
        field: "property_address",
        leadId: lead.id,
        leadName: lead.name,
        value: parsedLead.propertyAddress,
      });
    }
  });

  return matches;
}
