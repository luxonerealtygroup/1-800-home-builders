import type { LeadEmail, ParsedLeadEmail } from "./types";

function readField(body: string, label: string) {
  const match = body.match(new RegExp(`^${label}:\\s*(.*)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function parseBudget(value: string) {
  const cleanValue = value.toLowerCase().replace(/[$,\s]/g, "");
  const number = Number.parseFloat(cleanValue.replace("k", ""));

  if (Number.isNaN(number)) {
    return 0;
  }

  return cleanValue.includes("k") ? Math.round(number * 1000) : Math.round(number);
}

function readMessage(body: string) {
  const marker = "Message:";
  const index = body.indexOf(marker);

  return index >= 0 ? body.slice(index + marker.length).trim() : body.trim();
}

export function parseLeadEmail(email: LeadEmail): ParsedLeadEmail {
  return {
    fullName: readField(email.body, "Full Name") || email.from,
    phone: readField(email.body, "Phone"),
    email: readField(email.body, "Email") || email.fromEmail,
    propertyAddress: readField(email.body, "Property Address"),
    city: readField(email.body, "City"),
    projectType: readField(email.body, "Project Type"),
    budget: parseBudget(readField(email.body, "Budget")),
    timeline: readField(email.body, "Timeline"),
    messageBody: readMessage(email.body),
    leadSource: readField(email.body, "Lead Source") || email.provider,
    sourceEmailId: email.id,
    threadId: email.threadId,
  };
}
