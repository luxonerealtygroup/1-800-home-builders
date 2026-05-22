export type EmailInboxProvider =
  | "mock"
  | "gmail"
  | "google_workspace"
  | "outlook"
  | "imap";

export type LeadEmail = {
  id: string;
  provider: EmailInboxProvider;
  from: string;
  fromEmail: string;
  receivedAt: string;
  subject: string;
  body: string;
  threadId: string;
};

export type ParsedLeadEmail = {
  fullName: string;
  phone: string;
  email: string;
  propertyAddress: string;
  city: string;
  projectType: string;
  budget: number;
  timeline: string;
  messageBody: string;
  leadSource: string;
  sourceEmailId: string;
  threadId: string;
};

export type DuplicateMatch = {
  field: "email" | "phone" | "property_address";
  leadId: string;
  leadName: string;
  value: string;
};

export type EmailImportStatus =
  | "ready"
  | "duplicate"
  | "imported"
  | "needs_review";
