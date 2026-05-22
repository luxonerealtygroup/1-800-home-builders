export type LeadStage = "New" | "Qualified" | "Proposal" | "Contract";
export type LeadStatus =
  | "New Lead"
  | "New Inquiry"
  | "Contact Attempted"
  | "Contacted"
  | "Appointment Set"
  | "Phone Appointment Set"
  | "In-Person Appointment Set"
  | "Appointment Completed"
  | "Quote Needed"
  | "Quote Sent"
  | "Quote Approved"
  | "Proposal Sent"
  | "Lost / Not Interested"
  | "Follow Up Later"
  | "Waiting on Customer"
  | "Wrong Phone Number"
  | "Getting a Quote Elsewhere"
  | "Won"
  | "Cold"
  | "Nurture";
export type ActiveProjectStatus =
  | "Initial Payment Received"
  | "In Progress"
  | "Second Payment Received"
  | "Final Payment Received"
  | "Completed";

export type ActivityEntry = {
  id: string;
  type:
    | "call"
    | "text"
    | "email"
    | "note"
    | "follow-up"
    | "appointment"
    | "ai";
  label: string;
  detail: string;
  createdAt: string;
};

export type AiLeadSummary = {
  currentSituation: string;
  leadTemperature: "Hot" | "Warm" | "Cold";
  lastConversationSummary: string;
  suggestedNextStep: string;
  missingInformation: string[];
  suggestedStatusUpdate: string;
  suggestedUpdateOptions: string[];
};

export type Appointment = {
  date: string;
  time: string;
  type: "Phone consult" | "Site walk" | "Design review" | "Proposal review";
  notes: string;
};

export type Lead = {
  id: string;
  name: string;
  address: string;
  city: string;
  budget: string;
  projectType: string;
  timeline: string;
  stage: LeadStage;
  status: LeadStatus;
  priority: "Hot" | "Warm" | "Nurture";
  assignedRep: string;
  nextFollowUpDate: string;
  source: string;
  nextStep: string;
  lastTouch: string;
  probability: number;
  value: number;
  phone: string;
  email: string;
  notes: string;
  projectInfo: string;
  appointment: Appointment;
  activity: ActivityEntry[];
  activeProjectStatus?: ActiveProjectStatus;
  archivedAt?: string;
  isArchived?: boolean;
};

export type Project = {
  id: string;
  name: string;
  phase: string;
  due: string;
  owner: string;
  progress: number;
};

export const leads: Lead[] = [
  {
    id: "maria-garcia",
    name: "Maria Garcia",
    address: "1182 Olive Street",
    city: "Pasadena, CA",
    budget: "$310k",
    projectType: "Detached ADU",
    timeline: "ASAP",
    stage: "New",
    status: "New Lead",
    priority: "Hot",
    assignedRep: "Nina",
    nextFollowUpDate: "2026-05-20",
    source: "Website form",
    nextStep: "Call today at 2:30 PM",
    lastTouch: "18 min ago",
    probability: 34,
    value: 310000,
    phone: "(626) 555-0194",
    email: "maria.g@example.com",
    notes:
      "Detached 1-bed ADU for rental income. Wants fast feasibility feedback before meeting with family this weekend.",
    projectInfo: "Detached 1-bed ADU for rental income behind primary home.",
    appointment: {
      date: "2026-05-20",
      time: "2:30 PM",
      type: "Phone consult",
      notes: "Initial budget and feasibility call.",
    },
    activity: [
      {
        id: "act-maria-1",
        type: "note",
        label: "Lead created",
        detail: "Website inquiry captured with rental-income goal.",
        createdAt: "2026-05-20T09:12:00.000Z",
      },
      {
        id: "act-maria-2",
        type: "follow-up",
        label: "Follow-up due",
        detail: "Call today at 2:30 PM.",
        createdAt: "2026-05-20T09:18:00.000Z",
      },
    ],
  },
  {
    id: "jordan-lee",
    name: "Jordan Lee",
    address: "7428 Laurel Canyon Blvd",
    city: "North Hollywood, CA",
    budget: "$420k",
    projectType: "Garage conversion",
    timeline: "Next 3 months",
    stage: "New",
    status: "New Lead",
    priority: "Hot",
    assignedRep: "Marco",
    nextFollowUpDate: "2026-05-19",
    source: "Referral",
    nextStep: "Send financing options",
    lastTouch: "1 hr ago",
    probability: 58,
    value: 420000,
    phone: "(818) 555-0178",
    email: "jordan.lee@example.com",
    notes:
      "Garage conversion plus small addition. Strong timeline, needs clarity on permitting and monthly payment range.",
    projectInfo: "Garage conversion with small addition and financing review.",
    appointment: {
      date: "2026-05-21",
      time: "10:00 AM",
      type: "Phone consult",
      notes: "Review lending range and build timeline.",
    },
    activity: [
      {
        id: "act-jordan-1",
        type: "call",
        label: "Discovery call completed",
        detail: "Timeline and permit questions captured.",
        createdAt: "2026-05-19T17:20:00.000Z",
      },
    ],
  },
  {
    id: "alyssa-nguyen",
    name: "Alyssa Nguyen",
    address: "3906 Maple Avenue",
    city: "Long Beach, CA",
    budget: "$265k",
    projectType: "Studio ADU",
    timeline: "This year",
    stage: "New",
    status: "New Lead",
    priority: "Warm",
    assignedRep: "Talia",
    nextFollowUpDate: "2026-05-22",
    source: "Open house",
    nextStep: "Review proposal changes",
    lastTouch: "Yesterday",
    probability: 72,
    value: 265000,
    phone: "(562) 555-0132",
    email: "alyssa.n@example.com",
    notes:
      "Compact studio ADU for parent suite. Asked for lower-cost finish package and a clearer construction schedule.",
    projectInfo: "Compact studio ADU for parent suite with value-focused finishes.",
    appointment: {
      date: "2026-05-23",
      time: "1:00 PM",
      type: "Proposal review",
      notes: "Walk through revised finish package.",
    },
    activity: [
      {
        id: "act-alyssa-1",
        type: "email",
        label: "Proposal sent",
        detail: "Lower-cost finish option included.",
        createdAt: "2026-05-19T13:05:00.000Z",
      },
    ],
  },
  {
    id: "ben-carter",
    name: "Ben Carter",
    address: "2219 Fernwood Drive",
    city: "San Diego, CA",
    budget: "$520k",
    projectType: "Two-bedroom ADU",
    timeline: "Ready to start",
    stage: "New",
    status: "New Lead",
    priority: "Hot",
    assignedRep: "Nina",
    nextFollowUpDate: "2026-05-20",
    source: "Google Ads",
    nextStep: "Collect signed scope",
    lastTouch: "2 days ago",
    probability: 88,
    value: 520000,
    phone: "(619) 555-0181",
    email: "ben.carter@example.com",
    notes:
      "Two-bedroom backyard ADU. Decision maker is aligned, final questions are about utility trenching and start date.",
    projectInfo: "Two-bedroom detached backyard ADU with utility trenching questions.",
    appointment: {
      date: "2026-05-20",
      time: "4:00 PM",
      type: "Proposal review",
      notes: "Finalize scope and start-date questions.",
    },
    activity: [
      {
        id: "act-ben-1",
        type: "appointment",
        label: "Proposal review booked",
        detail: "Decision maker aligned, final scope review pending.",
        createdAt: "2026-05-18T16:40:00.000Z",
      },
    ],
  },
  {
    id: "sophia-patel",
    name: "Sophia Patel",
    address: "604 Juniper Lane",
    city: "Anaheim, CA",
    budget: "$350k",
    projectType: "Rental ADU",
    timeline: "Researching options",
    stage: "New",
    status: "New Lead",
    priority: "Warm",
    assignedRep: "Marco",
    nextFollowUpDate: "2026-05-27",
    source: "Instagram",
    nextStep: "Book site walk",
    lastTouch: "3 days ago",
    probability: 49,
    value: 350000,
    phone: "(714) 555-0150",
    email: "sophia.p@example.com",
    notes:
      "Exploring ADU for long-term rental. Needs help comparing prefab, garage conversion, and custom detached options.",
    projectInfo: "Long-term rental ADU options comparison.",
    appointment: {
      date: "2026-05-28",
      time: "11:30 AM",
      type: "Site walk",
      notes: "Assess lot and conversion options.",
    },
    activity: [
      {
        id: "act-sophia-1",
        type: "text",
        label: "Intro text sent",
        detail: "Sent site-walk scheduling options.",
        createdAt: "2026-05-17T11:10:00.000Z",
      },
    ],
  },
];

export const projects: Project[] = [
  {
    id: "p-101",
    name: "Riverside Casita",
    phase: "Design revisions",
    due: "May 22",
    owner: "Nina",
    progress: 42,
  },
  {
    id: "p-102",
    name: "Eagle Rock Studio",
    phase: "Permit packet",
    due: "May 27",
    owner: "Marco",
    progress: 64,
  },
  {
    id: "p-103",
    name: "Cypress Backyard Suite",
    phase: "Pre-construction",
    due: "Jun 03",
    owner: "Talia",
    progress: 81,
  },
];

export const pipelineStages: LeadStage[] = [
  "New",
  "Qualified",
  "Proposal",
  "Contract",
];

export const salesPipelineStatuses: LeadStatus[] = [
  "New Lead",
  "Contact Attempted",
  "Contacted",
  "Phone Appointment Set",
  "In-Person Appointment Set",
  "Appointment Completed",
  "Quote Needed",
  "Quote Sent",
  "Quote Approved",
];

export const lostLeadStatuses: LeadStatus[] = [
  "Lost / Not Interested",
  "Follow Up Later",
  "Waiting on Customer",
  "Wrong Phone Number",
  "Getting a Quote Elsewhere",
];

export const activeProjectStatuses: ActiveProjectStatus[] = [
  "Initial Payment Received",
  "In Progress",
  "Second Payment Received",
  "Final Payment Received",
  "Completed",
];

export function getLeadById(id: string) {
  return leads.find((lead) => lead.id === id);
}
