import type {
  ActiveProjectStatus,
  ActivityEntry,
  Lead,
  LeadStatus,
} from "@/app/_lib/crm-data";
import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbAppointment, DbLead, DbLeadStatus } from "@/lib/supabase/database";
import { activitiesService } from "./activities";
import { appointmentsService } from "./appointments";

const appointmentTypeByDb = {
  phone_consult: "Phone consult",
  site_walk: "Site walk",
  design_review: "Design review",
  proposal_review: "Proposal review",
} satisfies Record<string, Lead["appointment"]["type"]>;

const dbAppointmentTypeByType = {
  "Phone consult": "phone_consult",
  "Site walk": "site_walk",
  "Design review": "design_review",
  "Proposal review": "proposal_review",
} as const;

function appointmentFromDb(dbAppointment: DbAppointment): Lead["appointment"] {
  const appointmentDate = new Date(dbAppointment.appointment_at);

  return {
    date: dbAppointment.appointment_at.slice(0, 10),
    notes: dbAppointment.notes ?? "",
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(appointmentDate),
    type:
      appointmentTypeByDb[
        dbAppointment.appointment_type as keyof typeof appointmentTypeByDb
      ] ?? "Phone consult",
  };
}

const dbStatusByLeadStatus: Record<LeadStatus, DbLeadStatus> = {
  Cold: "lost_not_interested",
  Contacted: "contacted",
  "Appointment Completed": "appointment_completed",
  "Appointment Set": "appointment_set",
  "Phone Appointment Set": "phone_appointment_set",
  "In-Person Appointment Set": "in_person_appointment_set",
  "Contact Attempted": "contact_attempted",
  "Follow Up Later": "follow_up_later",
  "Lost / Not Interested": "lost_not_interested",
  "New Inquiry": "new_lead",
  "New Lead": "new_lead",
  Nurture: "follow_up_later",
  "Proposal Sent": "quote_sent",
  "Quote Approved": "quote_approved",
  "Quote Needed": "quote_needed",
  "Quote Sent": "quote_sent",
  "Waiting on Customer": "waiting_on_customer",
  "Wrong Phone Number": "wrong_phone_number",
  "Getting a Quote Elsewhere": "getting_quote_elsewhere",
  Won: "quote_approved",
};

const leadStatusByDbStatus: Record<DbLeadStatus, LeadStatus> = {
  appointment_completed: "Appointment Completed",
  appointment_set: "Appointment Set",
  phone_appointment_set: "Phone Appointment Set",
  in_person_appointment_set: "In-Person Appointment Set",
  contact_attempted: "Contact Attempted",
  contacted: "Contacted",
  follow_up_later: "Follow Up Later",
  lost_not_interested: "Lost / Not Interested",
  new_lead: "New Lead",
  quote_approved: "Quote Approved",
  quote_needed: "Quote Needed",
  quote_sent: "Quote Sent",
  waiting_on_customer: "Waiting on Customer",
  wrong_phone_number: "Wrong Phone Number",
  getting_quote_elsewhere: "Getting a Quote Elsewhere",
};

const activeProjectByDb = {
  completed: "Completed",
  final_payment_received: "Final Payment Received",
  in_progress: "In Progress",
  initial_payment_received: "Initial Payment Received",
  second_payment_received: "Second Payment Received",
} satisfies Record<string, ActiveProjectStatus>;

const dbActiveProjectByStatus = {
  Completed: "completed",
  "Final Payment Received": "final_payment_received",
  "In Progress": "in_progress",
  "Initial Payment Received": "initial_payment_received",
  "Second Payment Received": "second_payment_received",
} as const;

function formatBudget(value: number) {
  if (!value) {
    return "$0";
  }

  return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`;
}

function stageFromStatus(status: LeadStatus): Lead["stage"] {
  if (["New Lead", "New Inquiry", "Contact Attempted"].includes(status)) {
    return "New";
  }

  if (
    [
      "Contacted",
      "Appointment Set",
      "Phone Appointment Set",
      "In-Person Appointment Set",
      "Appointment Completed",
      "Follow Up Later",
      "Waiting on Customer",
      "Wrong Phone Number",
      "Getting a Quote Elsewhere",
    ].includes(status)
  ) {
    return "Qualified";
  }

  if (["Quote Needed", "Quote Sent", "Proposal Sent"].includes(status)) {
    return "Proposal";
  }

  return "Contract";
}

function probabilityFromStatus(status: LeadStatus) {
  const stage = stageFromStatus(status);
  const probabilityByStage = {
    Contract: 88,
    New: 28,
    Proposal: 72,
    Qualified: 52,
  };

  return probabilityByStage[stage];
}

export function toDbLead(lead: Lead) {
  return {
    id: lead.id,
    active_project_status: lead.activeProjectStatus
      ? dbActiveProjectByStatus[lead.activeProjectStatus]
      : null,
    archived_at: lead.archivedAt ?? null,
    assigned_rep_name: lead.assignedRep,
    city: lead.city || null,
    email: lead.email || null,
    estimated_value: lead.value,
    full_name: lead.name,
    is_archived: Boolean(lead.isArchived),
    next_followup_at: lead.nextFollowUpDate
      ? `${lead.nextFollowUpDate}T12:00:00.000Z`
      : null,
    next_step: lead.nextStep || null,
    notes: lead.notes || null,
    phone: lead.phone || null,
    priority: lead.priority.toLowerCase(),
    project_info: lead.projectInfo || null,
    project_type: lead.projectType || null,
    property_address: lead.address || null,
    source: lead.source || null,
    status: dbStatusByLeadStatus[lead.status],
    timeline: lead.timeline || null,
  };
}

export function fromDbLead(
  dbLead: DbLead,
  activity: ActivityEntry[] = [],
  appointment?: DbAppointment,
): Lead {
  const status = leadStatusByDbStatus[dbLead.status] ?? "New Lead";
  const value = Number(dbLead.estimated_value ?? 0);

  return {
    activeProjectStatus: dbLead.active_project_status
      ? activeProjectByDb[dbLead.active_project_status]
      : undefined,
    activity,
    address: dbLead.property_address ?? "",
    archivedAt: dbLead.archived_at ?? undefined,
    assignedRep: dbLead.assigned_rep_name ?? "Unassigned",
    appointment: appointment
      ? appointmentFromDb(appointment)
      : {
          date: dbLead.next_followup_at?.slice(0, 10) ?? "",
          notes: "No appointment scheduled yet.",
          time: "Not set",
          type: "Phone consult",
        },
    budget: formatBudget(value),
    city: dbLead.city ?? "",
    email: dbLead.email ?? "",
    id: dbLead.id,
    isArchived: dbLead.is_archived,
    lastTouch: dbLead.updated_at ? "Synced" : "Just now",
    name: dbLead.full_name,
    nextFollowUpDate: dbLead.next_followup_at?.slice(0, 10) ?? "",
    nextStep: dbLead.next_step ?? "Follow up with this lead.",
    notes: dbLead.notes ?? "",
    phone: dbLead.phone ?? "",
    priority:
      dbLead.priority === "hot"
        ? "Hot"
        : dbLead.priority === "nurture"
          ? "Nurture"
          : "Warm",
    probability: probabilityFromStatus(status),
    projectInfo: dbLead.project_info ?? "",
    projectType: dbLead.project_type ?? "ADU",
    source: dbLead.source ?? "Supabase",
    stage: stageFromStatus(status),
    status,
    timeline: dbLead.timeline ?? "Not captured",
    value,
  };
}

export const leadsService = {
  async archiveLead(leadId: string) {
    const [lead] = await supabaseRestClient.update<DbLead[]>(
      "leads",
      {
        archived_at: new Date().toISOString(),
        is_archived: true,
        updated_at: new Date().toISOString(),
      },
      { id: `eq.${leadId}` },
    );

    return lead;
  },
  async createLead(lead: Lead) {
    const [createdLead] = await supabaseRestClient.insert<DbLead[]>(
      "leads",
      toDbLead(lead),
    );

    return createdLead ? fromDbLead(createdLead, lead.activity) : lead;
  },
  async listLeads() {
    const dbLeads = await supabaseRestClient.get<DbLead[]>("leads", {
      order: "created_at.desc",
      select: "*",
    });
    const [activities, appointments] = await Promise.all([
      activitiesService.listActivities(),
      appointmentsService.listAppointments(),
    ]);

    return dbLeads.map((dbLead) =>
      fromDbLead(
        dbLead,
        activities.filter((activity) => activity.lead_id === dbLead.id).map(
          activitiesService.fromDbActivity,
        ),
        appointments.find((appointment) => appointment.lead_id === dbLead.id),
      ),
    );
  },
  async upsertAppointment(
    lead: Lead,
    options: { status?: string } = {},
  ) {
    if (!lead.appointment.date) {
      return null;
    }

    const time = lead.appointment.time && lead.appointment.time !== "Not set"
      ? lead.appointment.time
      : "12:00 PM";
    const appointmentAt = new Date(`${lead.appointment.date} ${time}`);
    const appointmentAtIso = Number.isNaN(appointmentAt.getTime())
      ? `${lead.appointment.date}T12:00:00.000Z`
      : appointmentAt.toISOString();

    return appointmentsService.createAppointment({
      appointment_at: appointmentAtIso,
      appointment_type: dbAppointmentTypeByType[lead.appointment.type] ?? "phone_consult",
      assigned_rep_id: null,
      lead_id: lead.id,
      notes: lead.appointment.notes || null,
      status: options.status ?? "scheduled",
    });
  },
  async updateLead(lead: Lead) {
    const [updatedLead] = await supabaseRestClient.update<DbLead[]>(
      "leads",
      {
        ...toDbLead(lead),
        updated_at: new Date().toISOString(),
      },
      { id: `eq.${lead.id}` },
    );

    return updatedLead ? fromDbLead(updatedLead, lead.activity) : lead;
  },
};
