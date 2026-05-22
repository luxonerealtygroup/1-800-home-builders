import type { LeadEmail } from "./types";

export const mockLeadEmails: LeadEmail[] = [
  {
    id: "email-001",
    provider: "mock",
    from: "Elena Ramirez",
    fromEmail: "elena.ramirez@example.com",
    receivedAt: "2026-05-21T08:34:00.000Z",
    subject: "Interested in a backyard ADU",
    threadId: "thread-elena-ramirez",
    body: `Full Name: Elena Ramirez
Phone: (323) 555-0168
Email: elena.ramirez@example.com
Property Address: 1841 Hyperion Ave
City: Los Angeles, CA
Project Type: Detached backyard ADU
Budget: $375,000
Timeline: Start design within 60 days
Lead Source: Website contact form

Message:
We want to build a detached ADU for rental income. The lot has alley access and we want to understand permitting, design, and financing options.`,
  },
  {
    id: "email-002",
    provider: "mock",
    from: "Marcus Hill",
    fromEmail: "marcus.hill@example.com",
    receivedAt: "2026-05-21T09:12:00.000Z",
    subject: "Garage conversion estimate",
    threadId: "thread-marcus-hill",
    body: `Full Name: Marcus Hill
Phone: 714-555-0144
Email: marcus.hill@example.com
Property Address: 920 Palm Street
City: Anaheim, CA
Project Type: Garage conversion
Budget: $180k
Timeline: ASAP
Lead Source: Google Ads

Message:
I have a detached garage and want to convert it into a studio for my mother. Please call me today if possible.`,
  },
  {
    id: "email-003",
    provider: "mock",
    from: "Priya Shah",
    fromEmail: "priya.shah@example.com",
    receivedAt: "2026-05-21T10:05:00.000Z",
    subject: "Question about ADU feasibility",
    threadId: "thread-priya-shah",
    body: `Full Name: Priya Shah
Phone: (858) 555-0189
Email: priya.shah@example.com
Property Address:
City: San Diego, CA
Project Type: Feasibility consultation
Budget: 250000
Timeline: 3-6 months
Lead Source: Referral

Message:
We are not ready with the exact address yet, but we want to know if a small ADU makes sense for family housing.`,
  },
];
