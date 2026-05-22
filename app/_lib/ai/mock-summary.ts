import type { AiLeadSummary, Lead } from "../crm-data";

const missingInfoChecks = [
  { label: "budget", test: (lead: Lead) => lead.value > 0 },
  { label: "timeline", test: (lead: Lead) => /timeline|asap|month|week|start|days/i.test(`${lead.notes} ${lead.projectInfo}`) },
  { label: "property access", test: (lead: Lead) => /access|gate|alley|driveway|yard|site/i.test(`${lead.notes} ${lead.projectInfo}`) },
  { label: "plans/permits", test: (lead: Lead) => /permit|plans|drawing|architect|design/i.test(`${lead.notes} ${lead.projectInfo}`) },
  { label: "ADU type", test: (lead: Lead) => /detached|garage|conversion|studio|bedroom|adu/i.test(`${lead.notes} ${lead.projectInfo}`) },
  { label: "desired square footage", test: (lead: Lead) => /sq ft|sqft|square feet|sf|\d{3,4}\s?(ft|sf)/i.test(`${lead.notes} ${lead.projectInfo}`) },
];

export function detectMissingLeadInfo(lead: Lead) {
  return missingInfoChecks
    .filter((check) => !check.test(lead))
    .map((check) => check.label);
}

function getLastConversation(lead: Lead) {
  const conversation = lead.activity.find((entry) =>
    ["call", "text", "email", "note"].includes(entry.type),
  );

  return conversation
    ? `${conversation.label}: ${conversation.detail}`
    : "No conversation activity has been logged yet.";
}

function getTemperature(lead: Lead): AiLeadSummary["leadTemperature"] {
  if (
    lead.priority === "Hot" ||
    [
      "Appointment Set",
      "Phone Appointment Set",
      "In-Person Appointment Set",
    ].includes(lead.status)
  ) {
    return "Hot";
  }

  if (lead.status === "Cold" || lead.priority === "Nurture") {
    return "Cold";
  }

  return "Warm";
}

function getSuggestedStatus(lead: Lead, missingInfo: string[]) {
  if (lead.appointment.date && lead.appointment.time !== "Not set") {
    return "Move to Appointment Set";
  }

  if (missingInfo.includes("budget") || missingInfo.includes("ADU type")) {
    return "Waiting on Customer";
  }

  if (lead.value >= 100000 && missingInfo.length <= 2) {
    return "Move to Quote Needed";
  }

  return "Follow up tomorrow";
}

export function createMockLeadSummary(lead: Lead): AiLeadSummary {
  const missingInformation = detectMissingLeadInfo(lead);
  const leadTemperature = getTemperature(lead);
  const suggestedStatusUpdate = getSuggestedStatus(lead, missingInformation);

  return {
    currentSituation: `${lead.name} is a ${lead.priority.toLowerCase()} ${lead.stage.toLowerCase()} lead assigned to ${lead.assignedRep}. Current CRM status is ${lead.status}.`,
    leadTemperature,
    lastConversationSummary: getLastConversation(lead),
    suggestedNextStep:
      missingInformation.length > 0
        ? `Ask for ${missingInformation.slice(0, 2).join(" and ")} before quoting.`
        : lead.nextStep || "Book the next sales follow-up.",
    missingInformation,
    suggestedStatusUpdate,
    suggestedUpdateOptions: [
      "Move to Appointment Set",
      "Move to Quote Needed",
      "Follow up tomorrow",
      "Mark as Hot",
      "Mark as Cold",
      "Send quote",
      "Waiting on Customer",
    ],
  };
}
