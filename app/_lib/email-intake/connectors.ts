import type { LeadEmail } from "./types";

export async function connectGmailInbox(): Promise<LeadEmail[]> {
  throw new Error("Gmail API connection placeholder. Not connected yet.");
}

export async function connectGoogleWorkspaceInbox(): Promise<LeadEmail[]> {
  throw new Error("Google Workspace inbox placeholder. Not connected yet.");
}

export async function connectOutlookInbox(): Promise<LeadEmail[]> {
  throw new Error("Outlook inbox placeholder. Not connected yet.");
}

export async function connectImapInbox(): Promise<LeadEmail[]> {
  throw new Error("IMAP inbox placeholder. Not connected yet.");
}
