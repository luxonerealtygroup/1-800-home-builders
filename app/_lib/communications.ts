import type { ActivityEntry, Lead } from "./crm-data";

export type CommunicationChannel = "call" | "text" | "email";
export type CommunicationStatus =
  | "attempted"
  | "completed"
  | "delivered"
  | "sent"
  | "failed"
  | "no_answer"
  | "voicemail";

export type MessageTemplate = {
  id: string;
  label: string;
  channel: "text" | "email";
  body: string;
};

export type CommunicationRecord = {
  id: string;
  leadId: string;
  leadName: string;
  channel: CommunicationChannel;
  status: CommunicationStatus;
  label: string;
  detail: string;
  createdAt: string;
};

export const messageTemplates: MessageTemplate[] = [
  {
    id: "first-text",
    label: "First text",
    channel: "text",
    body: "Hi {{name}}, this is {{rep}} with 1-800 Home Builders. I saw your ADU request and wanted to help with the next step. Is now a good time to connect?",
  },
  {
    id: "missed-call-text",
    label: "Missed call text",
    channel: "text",
    body: "Hi {{name}}, I just tried calling about your ADU project. No rush, but I can help answer budget, timeline, and feasibility questions when you are free.",
  },
  {
    id: "appointment-reminder",
    label: "Appointment reminder",
    channel: "text",
    body: "Hi {{name}}, quick reminder about our ADU consultation. Please have any plans, property photos, or access notes ready if you have them.",
  },
  {
    id: "quote-follow-up",
    label: "Quote follow-up",
    channel: "email",
    body: "Hi {{name}}, I wanted to follow up on the ADU quote and see what questions came up. I can walk through scope, timeline, financing, or next steps.",
  },
  {
    id: "final-follow-up",
    label: "Final follow-up",
    channel: "email",
    body: "Hi {{name}}, I wanted to close the loop on your ADU project. If the timing has changed, I can keep your file warm and reconnect when it makes sense.",
  },
  {
    id: "site-walk-confirmation",
    label: "Site walk confirmation",
    channel: "text",
    body: "Hi {{name}}, confirming our site walk at {{address}} for your {{projectType}}. See you then!",
  },
  {
    id: "proposal-ready",
    label: "Proposal ready",
    channel: "email",
    body: "Hi {{name}}, your proposal for the {{projectType}} project at {{address}} (estimated {{budget}}) is ready. Let me know a good time to walk through it together.",
  },
  {
    id: "contract-signed-thanks",
    label: "Contract signed - thank you",
    channel: "email",
    body: "Hi {{name}}, thank you for choosing us for your {{projectType}} project! {{rep}} will be in touch shortly with next steps to get started.",
  },
];

export function personalizeTemplate(template: string, lead: Lead) {
  return template
    .replaceAll("{{name}}", lead.name.split(" ")[0] || lead.name)
    .replaceAll("{{rep}}", lead.assignedRep || "your ADU specialist")
    .replaceAll("{{address}}", lead.address || "your property")
    .replaceAll("{{city}}", lead.city || "")
    .replaceAll("{{budget}}", lead.budget || "your estimated budget")
    .replaceAll("{{projectType}}", lead.projectType || "ADU");
}

export function activityToCommunication(
  lead: Lead,
  activity: ActivityEntry,
): CommunicationRecord | null {
  if (!isCommunicationChannel(activity.type)) {
    return null;
  }

  return {
    id: activity.id,
    leadId: lead.id,
    leadName: lead.name,
    channel: activity.type,
    status: inferCommunicationStatus(activity),
    label: activity.label,
    detail: activity.detail,
    createdAt: activity.createdAt,
  };
}

function isCommunicationChannel(
  value: ActivityEntry["type"],
): value is CommunicationChannel {
  return value === "call" || value === "text" || value === "email";
}

function inferCommunicationStatus(activity: ActivityEntry): CommunicationStatus {
  const content = `${activity.label} ${activity.detail}`.toLowerCase();

  if (content.includes("failed")) {
    return "failed";
  }

  if (content.includes("no answer")) {
    return "no_answer";
  }

  if (content.includes("voicemail")) {
    return "voicemail";
  }

  if (content.includes("completed")) {
    return "completed";
  }

  if (content.includes("delivered")) {
    return "delivered";
  }

  if (content.includes("sent")) {
    return "sent";
  }

  return "attempted";
}

export function mockCommunicationResponse({
  channel,
  provider,
  status,
}: {
  channel: CommunicationChannel;
  provider: "twilio_voice" | "twilio_sms" | "resend_or_sendgrid";
  status: CommunicationStatus;
}) {
  return {
    id: `mock-${channel}-${Date.now().toString(36)}`,
    mode: "mock",
    provider,
    status,
    success: true,
    message: "Mock communication response. Add provider keys to connect live sending later.",
  };
}
