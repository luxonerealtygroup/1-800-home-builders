"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { activitiesService } from "@/lib/services/activities";
import { followupsService } from "@/lib/services/followups";
import { leadsService } from "@/lib/services/leads";
import { notesService } from "@/lib/services/notes";
import { getSupabaseEnv } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import type {
  ActiveProjectStatus,
  ActivityEntry,
  Lead,
  LeadStage,
  LeadStatus,
} from "../_lib/crm-data";

type LeadInput = Omit<
  Lead,
  "id" | "lastTouch" | "probability" | "value" | "activity"
> & {
  value: number;
};
type AddLeadInput = LeadInput & {
  initialActivity?: ActivityInput[];
};
type ActivityInput = Omit<ActivityEntry, "id" | "createdAt">;

type LeadContextValue = {
  addActivity: (leadId: string, activity: ActivityInput) => Promise<void>;
  addLead: (input: AddLeadInput) => Promise<Lead>;
  archiveLead: (leadId: string) => Promise<void>;
  applySuggestedUpdate: (
    leadId: string,
    suggestion: string,
    detail: string,
  ) => Promise<void>;
  deleteLead: (leadId: string) => void;
  getLead: (id: string) => Lead | undefined;
  leads: Lead[];
  loading: boolean;
  refreshLeads: () => Promise<void>;
  supabaseError: string;
  supabaseMode: "connected" | "fallback" | "loading";
  supabaseWarning: string;
  updateLead: (leadId: string, input: LeadInput) => Promise<Lead | undefined>;
  updateAssignedRep: (leadId: string, assignedRep: string) => Promise<void>;
  updateActiveProjectStatus: (
    leadId: string,
    status: ActiveProjectStatus,
  ) => Promise<void>;
  updateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  updateFollowUp: (
    leadId: string,
    nextFollowUpDate: string,
    label: string,
    detail: string,
  ) => Promise<void>;
};

const LEADS_KEY = "adu-crm-leads";
const LEADS_RESET_KEY = "adu-crm-leads-reset-version";
const LEADS_STATUS_MIGRATION_KEY = "adu-crm-leads-status-migration";
const CURRENT_LEADS_RESET_VERSION = "manual-entry-start-v1";
const CURRENT_STATUS_MIGRATION_VERSION = "all-leads-new-lead-v1";

const LeadContext = createContext<LeadContextValue | undefined>(undefined);

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function createUuid() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (digit) =>
    (
      Number(digit) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(digit) / 4)))
    ).toString(16),
  );
}

function stageFromStatus(status: LeadStatus): LeadStage {
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

function buildUpdateDetail(previousLead: Lead, nextLead: LeadInput) {
  const changes = [
    previousLead.status !== nextLead.status
      ? `status changed from ${previousLead.status} to ${nextLead.status}`
      : "",
    previousLead.priority !== nextLead.priority
      ? `priority changed from ${previousLead.priority} to ${nextLead.priority}`
      : "",
    previousLead.assignedRep !== nextLead.assignedRep
      ? `assigned rep changed from ${previousLead.assignedRep} to ${nextLead.assignedRep}`
      : "",
    previousLead.nextFollowUpDate !== nextLead.nextFollowUpDate
      ? `follow-up changed to ${nextLead.nextFollowUpDate}`
      : "",
  ].filter(Boolean);

  return changes.length > 0
    ? `Lead updated: ${changes.join("; ")}.`
    : "Lead profile details were edited.";
}

function migrateLeadsToNewLead(leads: Lead[], shouldMigrate: boolean) {
  if (!shouldMigrate) {
    return leads;
  }

  return leads.map((lead) => {
    if (lead.status === "New Lead" && lead.stage === "New") {
      return lead;
    }

    const entry: ActivityEntry = {
      id: `${lead.id}-new-lead-migration-${Date.now().toString(36)}`,
      type: "note",
      label: "Status reset",
      detail: "Lead moved to New Lead so it appears in the New Lead pipeline.",
      createdAt: new Date().toISOString(),
    };

    return {
      ...lead,
      activeProjectStatus: undefined,
      activity: [entry, ...lead.activity],
      lastTouch: "Just now",
      probability: 28,
      stage: "New" as const,
      status: "New Lead" as const,
    };
  });
}

function getSuggestedLeadUpdates(suggestion: string, tomorrowDate: string) {
  const updates: Partial<Lead> = {};

  if (suggestion === "Move to Appointment Set") {
    updates.status = "Phone Appointment Set";
  }

  if (suggestion === "Move to Quote Needed" || suggestion === "Send quote") {
    updates.status = "Quote Needed";
    updates.nextStep = "Prepare and send quote.";
  }

  if (suggestion === "Waiting on Customer") {
    updates.status = "Waiting on Customer";
  }

  if (suggestion === "Mark as Hot") {
    updates.priority = "Hot";
  }

  if (suggestion === "Mark as Cold") {
    updates.priority = "Nurture";
    updates.status = "Lost / Not Interested";
  }

  if (suggestion === "Follow up tomorrow") {
    updates.nextFollowUpDate = tomorrowDate;
    updates.nextStep = "Follow up tomorrow.";
  }

  return updates;
}

function normalizeLead(lead: Partial<Lead>): Lead | null {
  const stage = lead?.stage;
  const priority = lead?.priority;
  const status = lead?.status;

  if (
    typeof lead?.id !== "string" ||
    typeof lead?.name !== "string" ||
    typeof lead?.address !== "string" ||
    typeof lead?.city !== "string" ||
    typeof lead?.budget !== "string" ||
    !["New", "Qualified", "Proposal", "Contract"].includes(String(stage)) ||
    !["Hot", "Warm", "Nurture"].includes(String(priority)) ||
    typeof lead?.source !== "string" ||
    typeof lead?.nextStep !== "string" ||
    typeof lead?.lastTouch !== "string" ||
    typeof lead?.probability !== "number" ||
    typeof lead?.value !== "number" ||
    typeof lead?.phone !== "string" ||
    typeof lead?.email !== "string" ||
    typeof lead?.notes !== "string"
  ) {
    return null;
  }

  const normalizedStage = stage as LeadStage;
  const normalizedPriority = priority as Lead["priority"];
  const normalizedStatus = [
    "New Lead",
    "New Inquiry",
    "Contact Attempted",
    "Contacted",
    "Appointment Set",
    "Phone Appointment Set",
    "In-Person Appointment Set",
    "Appointment Completed",
    "Quote Needed",
    "Quote Sent",
    "Quote Approved",
    "Proposal Sent",
    "Lost / Not Interested",
    "Follow Up Later",
    "Waiting on Customer",
    "Wrong Phone Number",
    "Getting a Quote Elsewhere",
    "Won",
    "Cold",
    "Nurture",
  ].includes(String(status))
    ? (status as LeadStatus)
    : "New Lead";

  const activity =
    Array.isArray(lead.activity) && lead.activity.length > 0
      ? lead.activity.filter((entry): entry is ActivityEntry => {
          return (
            typeof entry?.id === "string" &&
            ["call", "text", "email", "note", "follow-up", "appointment", "ai"].includes(
              String(entry?.type),
            ) &&
            typeof entry?.label === "string" &&
            typeof entry?.detail === "string" &&
            typeof entry?.createdAt === "string"
          );
        })
      : [
          {
            id: `${lead.id}-activity-seed`,
            type: "note" as const,
            label: "Lead imported",
            detail: lead.nextStep,
            createdAt: new Date().toISOString(),
          },
        ];

  return {
    id: lead.id,
    name: lead.name,
    address: lead.address,
    city: lead.city,
    budget: lead.budget,
    projectType: lead.projectType ?? "ADU",
    timeline: lead.timeline ?? "Not captured",
    stage: stageFromStatus(normalizedStatus) || normalizedStage,
    status: normalizedStatus,
    priority: normalizedPriority,
    assignedRep: lead.assignedRep ?? "Unassigned",
    nextFollowUpDate: lead.nextFollowUpDate ?? todayIsoDate(),
    source: lead.source,
    nextStep: lead.nextStep,
    lastTouch: lead.lastTouch,
    probability: lead.probability,
    value: lead.value,
    phone: lead.phone,
    email: lead.email,
    notes: lead.notes,
    projectInfo:
      lead.projectInfo ??
      `${lead.budget} ADU opportunity at ${lead.address}, ${lead.city}.`,
    appointment: lead.appointment ?? {
      date: lead.nextFollowUpDate ?? todayIsoDate(),
      time: "Not set",
      type: "Phone consult",
      notes: "Appointment details not set.",
    },
    activity,
    activeProjectStatus:
      lead.activeProjectStatus ??
      (normalizedStatus === "Quote Approved"
        ? "Initial Payment Received"
        : undefined),
    archivedAt: lead.archivedAt,
    isArchived: Boolean(lead.isArchived),
  };
}

function readStoredLeads() {
  try {
    const storedLeads = window.localStorage.getItem(LEADS_KEY);

    if (!storedLeads) {
      return [];
    }

    const parsedLeads = JSON.parse(storedLeads);

    if (!Array.isArray(parsedLeads)) {
      return [];
    }

    const normalizedLeads = parsedLeads
      .map((lead) => normalizeLead(lead))
      .filter((lead): lead is Lead => Boolean(lead));

    return normalizedLeads;
  } catch {
    return [];
  }
}

async function importLeadToSupabase(lead: Lead) {
  const leadToImport = isUuid(lead.id)
    ? lead
    : {
        ...lead,
        id: createUuid(),
      };
  const createdLead = await leadsService.createLead(leadToImport);
  const importedLeadId = createdLead.id;

  await Promise.allSettled([
    ...leadToImport.activity.map((activity) =>
      activitiesService.createActivity(importedLeadId, {
        createdAt: activity.createdAt,
        detail: activity.detail,
        label: activity.label,
        type: activity.type,
      }),
    ),
    leadToImport.notes
      ? notesService.createNote(importedLeadId, leadToImport.notes)
      : null,
    leadToImport.nextFollowUpDate
      ? followupsService.createFollowup({
          assigned_rep_id: null,
          completed_at: null,
          due_at: `${leadToImport.nextFollowUpDate}T12:00:00.000Z`,
          lead_id: importedLeadId,
          reason: leadToImport.nextStep,
          status: "open",
        })
      : null,
  ].filter(Boolean));

  return createdLead;
}

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const { authMode } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState("");
  const [supabaseMode, setSupabaseMode] = useState<
    "connected" | "fallback" | "loading"
  >("loading");
  const supabaseEnv = getSupabaseEnv();
  const shouldUseSupabase = supabaseEnv.isConfigured && authMode === "supabase";
  const supabaseWarning = shouldUseSupabase
    ? ""
    : supabaseEnv.isConfigured
      ? "Using local workspace data for this account."
      : `Supabase env vars missing: ${supabaseEnv.missing.join(", ")}. Using local mock fallback.`;

  const refreshLeads = useCallback(async () => {
    const resetVersion = window.localStorage.getItem(LEADS_RESET_KEY);
    const statusMigrationVersion = window.localStorage.getItem(
      LEADS_STATUS_MIGRATION_KEY,
    );
    const shouldClearStarterLeads =
      resetVersion !== CURRENT_LEADS_RESET_VERSION;
    const shouldMoveAllLeadsToNew =
      statusMigrationVersion !== CURRENT_STATUS_MIGRATION_VERSION;
    const storedLeads = shouldClearStarterLeads
      ? []
      : migrateLeadsToNewLead(readStoredLeads(), shouldMoveAllLeadsToNew);

    if (shouldClearStarterLeads) {
      window.localStorage.setItem(LEADS_RESET_KEY, CURRENT_LEADS_RESET_VERSION);
    }

    if (shouldMoveAllLeadsToNew) {
      window.localStorage.setItem(
        LEADS_STATUS_MIGRATION_KEY,
        CURRENT_STATUS_MIGRATION_VERSION,
      );
    }

    if (!shouldUseSupabase) {
      setLeads(storedLeads);
      window.localStorage.setItem(LEADS_KEY, JSON.stringify(storedLeads));
      setSupabaseError("");
      setSupabaseMode("fallback");
      setLoading(false);
      return;
    }

    try {
      const supabaseLeads = await leadsService.listLeads();
      const missingStoredLeads = storedLeads.filter((storedLead) => {
        return !supabaseLeads.some((supabaseLead) => {
          const emailMatches =
            storedLead.email &&
            supabaseLead.email &&
            storedLead.email.toLowerCase() === supabaseLead.email.toLowerCase();
          const phoneMatches =
            storedLead.phone &&
            supabaseLead.phone &&
            storedLead.phone === supabaseLead.phone;

          return (
            storedLead.id === supabaseLead.id ||
            Boolean(emailMatches) ||
            Boolean(phoneMatches)
          );
        });
      });

      if (missingStoredLeads.length > 0) {
        const importedLeads: Lead[] = [];
        const importErrors: string[] = [];

        for (const storedLead of missingStoredLeads) {
          try {
            importedLeads.push(await importLeadToSupabase(storedLead));
          } catch (error) {
            importErrors.push(
              `${storedLead.name}: ${messageFromError(
                error,
                "Could not import this lead.",
              )}`,
            );
          }
        }

        setLeads([...importedLeads, ...supabaseLeads]);
        setSupabaseError(
          importErrors.length > 0
            ? `Some local leads could not be recovered: ${importErrors.join(" ")}`
            : "",
        );
        setSupabaseMode("connected");
        return;
      }

      setLeads(supabaseLeads);
      setSupabaseError("");
      setSupabaseMode("connected");
    } catch (error) {
      setLeads([]);
      setSupabaseError(
        messageFromError(error, "Could not load Supabase leads."),
      );
      setSupabaseMode("connected");
    } finally {
      setLoading(false);
    }
  }, [shouldUseSupabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshLeads();
    });

    function refreshVisibleApp() {
      if (document.visibilityState === "visible") {
        void refreshLeads();
      }
    }

    window.addEventListener("focus", refreshVisibleApp);
    document.addEventListener("visibilitychange", refreshVisibleApp);
    const intervalId = window.setInterval(refreshVisibleApp, 30000);

    return () => {
      window.removeEventListener("focus", refreshVisibleApp);
      document.removeEventListener("visibilitychange", refreshVisibleApp);
      window.clearInterval(intervalId);
    };
  }, [refreshLeads]);

  const persistLeads = useCallback(
    (nextLeads: Lead[]) => {
      setLeads(nextLeads);

      if (!shouldUseSupabase) {
        window.localStorage.setItem(LEADS_KEY, JSON.stringify(nextLeads));
      }
    },
    [shouldUseSupabase],
  );

  const addLead = useCallback(
    async (input: AddLeadInput) => {
      const id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${slugify(input.name) || "new-lead"}-${Date.now().toString(36)}`;
      const { initialActivity = [], ...leadInput } = input;
      const probabilityByStage = {
        New: 28,
        Qualified: 52,
        Proposal: 72,
        Contract: 88,
      };
      const newLead: Lead = {
        ...leadInput,
        activeProjectStatus:
          leadInput.status === "Quote Approved"
            ? "Initial Payment Received"
            : leadInput.activeProjectStatus,
        id,
        activity: [
          ...initialActivity.map((activity, index) => ({
            ...activity,
            id: `${id}-import-${index}`,
            createdAt: new Date().toISOString(),
          })),
          {
            id: `${id}-created`,
            type: "note",
            label: "Lead created",
            detail: "Manual lead entry added to CRM.",
            createdAt: new Date().toISOString(),
          },
        ],
        lastTouch: "Just now",
        probability: probabilityByStage[leadInput.stage],
        value: leadInput.value,
        isArchived: false,
      };

      if (shouldUseSupabase) {
        try {
          const createdLead = await leadsService.createLead(newLead);

          await Promise.all([
            ...newLead.activity.map((activity) =>
              activitiesService.createActivity(newLead.id, {
                createdAt: activity.createdAt,
                detail: activity.detail,
                label: activity.label,
                type: activity.type,
              }),
            ),
            notesService.createNote(newLead.id, newLead.notes),
            followupsService.createFollowup({
              assigned_rep_id: null,
              completed_at: null,
              due_at: `${newLead.nextFollowUpDate}T12:00:00.000Z`,
              lead_id: newLead.id,
              reason: newLead.nextStep,
              status: "open",
            }),
          ]);
          persistLeads([createdLead, ...leads]);
          setSupabaseError("");

          return createdLead;
        } catch (error: unknown) {
          const message = messageFromError(
            error,
            "Could not create lead in Supabase.",
          );

          setSupabaseError(message);
          throw new Error(message);
        }
      }

      persistLeads([newLead, ...leads]);

      return newLead;
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const addActivity = useCallback(
    async (leadId: string, activity: ActivityInput) => {
      const entry: ActivityEntry = {
        ...activity,
        id: `${leadId}-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };

      persistLeads(
        leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                activity: [entry, ...lead.activity],
                lastTouch: "Just now",
              }
            : lead,
        ),
      );
      if (shouldUseSupabase) {
        const writes: Promise<unknown>[] = [
          activitiesService.createActivity(leadId, entry),
        ];

        if (entry.type === "note") {
          writes.push(notesService.createNote(leadId, entry.detail));
        }

        try {
          await Promise.all(writes);
          setSupabaseError("");
        } catch (error: unknown) {
          setSupabaseError(
            messageFromError(error, "Could not save activity to Supabase."),
          );
        }
      }
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const deleteLead = useCallback(
    (leadId: string) => {
      persistLeads(leads.filter((lead) => lead.id !== leadId));
    },
    [leads, persistLeads],
  );

  const archiveLead = useCallback(
    async (leadId: string) => {
      const entry: ActivityEntry = {
        id: `${leadId}-${Date.now().toString(36)}`,
        type: "note",
        label: "Lead archived",
        detail: "Admin archived this lead from active views.",
        createdAt: new Date().toISOString(),
      };

      persistLeads(
        leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                activity: [entry, ...lead.activity],
                archivedAt: new Date().toISOString(),
                isArchived: true,
                lastTouch: "Just now",
              }
            : lead,
        ),
      );
      if (shouldUseSupabase) {
        try {
          await leadsService.archiveLead(leadId);
          await activitiesService.createActivity(leadId, entry);
          setSupabaseError("");
        } catch (error: unknown) {
          setSupabaseError(
            messageFromError(error, "Could not archive lead in Supabase."),
          );
        }
      }
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const applySuggestedUpdate = useCallback(
    async (leadId: string, suggestion: string, detail: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().slice(0, 10);
      const entry: ActivityEntry = {
        id: `${leadId}-${Date.now().toString(36)}`,
        type: "ai",
        label: "AI suggestion approved",
        detail,
        createdAt: new Date().toISOString(),
      };

      persistLeads(
        leads.map((lead) => {
          if (lead.id !== leadId) {
            return lead;
          }

          const updates = getSuggestedLeadUpdates(suggestion, tomorrowDate);

          return {
            ...lead,
            ...updates,
            activity: [entry, ...lead.activity],
            lastTouch: "Just now",
          };
        }),
      );
      if (shouldUseSupabase) {
        const updatedLead = leads.find((lead) => lead.id === leadId);

        if (updatedLead) {
          const updates = getSuggestedLeadUpdates(suggestion, tomorrowDate);
          const nextLead = {
            ...updatedLead,
            ...Object.fromEntries(
              Object.entries(updates).filter(([, value]) => value !== undefined),
            ),
            activity: [entry, ...updatedLead.activity],
            lastTouch: "Just now",
          } as Lead;

          try {
            await leadsService.updateLead(nextLead);
            await activitiesService.createActivity(leadId, entry);
            setSupabaseError("");
          } catch (error: unknown) {
            setSupabaseError(
              messageFromError(error, "Could not save AI suggestion to Supabase."),
            );
          }
        }
      }
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const updateLead = useCallback(
    async (leadId: string, input: LeadInput) => {
      let updatedLead: Lead | undefined;
      let updateEntry: ActivityEntry | undefined;
      const probabilityByStage = {
        New: 28,
        Qualified: 52,
        Proposal: 72,
        Contract: 88,
      };

      persistLeads(
        leads.map((lead) => {
          if (lead.id !== leadId) {
            return lead;
          }

          const entry: ActivityEntry = {
            id: `${leadId}-${Date.now().toString(36)}`,
            type: "note",
            label: "Lead updated",
            detail: buildUpdateDetail(lead, input),
            createdAt: new Date().toISOString(),
          };
          updateEntry = entry;

          updatedLead = {
            ...lead,
            ...input,
            activeProjectStatus:
              input.status === "Quote Approved"
                ? lead.activeProjectStatus ?? "Initial Payment Received"
                : input.activeProjectStatus,
            activity: [entry, ...lead.activity],
            lastTouch: "Just now",
            stage: stageFromStatus(input.status),
            probability: probabilityByStage[stageFromStatus(input.status)],
            value: input.value,
          };

          return updatedLead;
        }),
      );

      if (updatedLead && shouldUseSupabase) {
        const writes: Promise<unknown>[] = [leadsService.updateLead(updatedLead)];

        if (updateEntry) {
          writes.push(activitiesService.createActivity(updatedLead.id, updateEntry));
        }

        if (updatedLead.notes) {
          writes.push(notesService.createNote(updatedLead.id, updatedLead.notes));
        }

        try {
          await Promise.all(writes);
          setSupabaseError("");
        } catch (error: unknown) {
          const message = messageFromError(
            error,
            "Could not update lead in Supabase.",
          );

          setSupabaseError(message);
          throw new Error(message);
        }
      }

      return updatedLead;
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const updateLeadStatus = useCallback(
    async (leadId: string, status: LeadStatus) => {
      const entry: ActivityEntry = {
        id: `${leadId}-${Date.now().toString(36)}`,
        type: "note",
        label: "Status changed",
        detail: `Lead moved to ${status}.`,
        createdAt: new Date().toISOString(),
      };
      const probabilityByStage = {
        New: 28,
        Qualified: 52,
        Proposal: 72,
        Contract: 88,
      };

      persistLeads(
        leads.map((lead) => {
          if (lead.id !== leadId) {
            return lead;
          }

          const stage = stageFromStatus(status);

          return {
            ...lead,
            activeProjectStatus:
              status === "Quote Approved"
                ? lead.activeProjectStatus ?? "Initial Payment Received"
                : lead.activeProjectStatus,
            activity: [entry, ...lead.activity],
            lastTouch: "Just now",
            probability: probabilityByStage[stage],
            stage,
            status,
          };
        }),
      );
      if (shouldUseSupabase) {
        const currentLead = leads.find((lead) => lead.id === leadId);

        if (currentLead) {
          const stage = stageFromStatus(status);
          const probabilityByStage = {
            New: 28,
            Qualified: 52,
            Proposal: 72,
            Contract: 88,
          };
          const nextLead = {
            ...currentLead,
            activeProjectStatus:
              status === "Quote Approved"
                ? currentLead.activeProjectStatus ?? "Initial Payment Received"
                : currentLead.activeProjectStatus,
            activity: [entry, ...currentLead.activity],
            lastTouch: "Just now",
            probability: probabilityByStage[stage],
            stage,
            status,
          };

          try {
            await leadsService.updateLead(nextLead);
            await activitiesService.createActivity(leadId, entry);
            setSupabaseError("");
          } catch (error: unknown) {
            setSupabaseError(
              messageFromError(error, "Could not update status in Supabase."),
            );
          }
        }
      }
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const updateFollowUp = useCallback(
    async (
      leadId: string,
      nextFollowUpDate: string,
      label: string,
      detail: string,
    ) => {
      const entry: ActivityEntry = {
        id: `${leadId}-${Date.now().toString(36)}`,
        type: "follow-up",
        label,
        detail,
        createdAt: new Date().toISOString(),
      };

      persistLeads(
        leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                activity: [entry, ...lead.activity],
                lastTouch: "Just now",
                nextFollowUpDate,
                nextStep: detail,
              }
            : lead,
        ),
      );
      if (shouldUseSupabase) {
        const currentLead = leads.find((lead) => lead.id === leadId);

        if (currentLead) {
          try {
            await leadsService.updateLead({
              ...currentLead,
              activity: [entry, ...currentLead.activity],
              lastTouch: "Just now",
              nextFollowUpDate,
              nextStep: detail,
            });
            await Promise.all([
              activitiesService.createActivity(leadId, entry),
              followupsService.createFollowup({
                assigned_rep_id: null,
                completed_at: null,
                due_at: `${nextFollowUpDate}T12:00:00.000Z`,
                lead_id: leadId,
                reason: detail,
                status: "open",
              }),
            ]);
            setSupabaseError("");
          } catch (error: unknown) {
            setSupabaseError(
              messageFromError(error, "Could not update follow-up in Supabase."),
            );
          }
        }
      }
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const updateAssignedRep = useCallback(
    async (leadId: string, assignedRep: string) => {
      const entry: ActivityEntry = {
        id: `${leadId}-${Date.now().toString(36)}`,
        type: "note",
        label: "Lead assigned",
        detail: `Lead assigned to ${assignedRep}.`,
        createdAt: new Date().toISOString(),
      };

      persistLeads(
        leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                activity: [entry, ...lead.activity],
                assignedRep,
                lastTouch: "Just now",
              }
            : lead,
        ),
      );
      if (shouldUseSupabase) {
        const currentLead = leads.find((lead) => lead.id === leadId);

        if (currentLead) {
          try {
            await leadsService.updateLead({
              ...currentLead,
              activity: [entry, ...currentLead.activity],
              assignedRep,
              lastTouch: "Just now",
            });
            await activitiesService.createActivity(leadId, entry);
            setSupabaseError("");
          } catch (error: unknown) {
            setSupabaseError(
              messageFromError(error, "Could not update assignment in Supabase."),
            );
          }
        }
      }
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const updateActiveProjectStatus = useCallback(
    async (leadId: string, status: ActiveProjectStatus) => {
      const entry: ActivityEntry = {
        id: `${leadId}-${Date.now().toString(36)}`,
        type: "note",
        label: "Active project status changed",
        detail: `Project status moved to ${status}.`,
        createdAt: new Date().toISOString(),
      };

      persistLeads(
        leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                activeProjectStatus: status,
                activity: [entry, ...lead.activity],
                lastTouch: "Just now",
              }
            : lead,
        ),
      );
      if (shouldUseSupabase) {
        const currentLead = leads.find((lead) => lead.id === leadId);

        if (currentLead) {
          try {
            await leadsService.updateLead({
              ...currentLead,
              activeProjectStatus: status,
              activity: [entry, ...currentLead.activity],
              lastTouch: "Just now",
            });
            await activitiesService.createActivity(leadId, entry);
            setSupabaseError("");
          } catch (error: unknown) {
            setSupabaseError(
              messageFromError(
                error,
                "Could not update project status in Supabase.",
              ),
            );
          }
        }
      }
    },
    [leads, persistLeads, shouldUseSupabase],
  );

  const getLead = useCallback(
    (id: string) => leads.find((lead) => lead.id === id),
    [leads],
  );

  const value = useMemo(
    () => ({
      addActivity,
      addLead,
      archiveLead,
      applySuggestedUpdate,
      deleteLead,
      getLead,
      leads,
      loading,
      refreshLeads,
      supabaseError,
      supabaseMode,
      supabaseWarning,
      updateLead,
      updateAssignedRep,
      updateActiveProjectStatus,
      updateFollowUp,
      updateLeadStatus,
    }),
    [
      addActivity,
      addLead,
      archiveLead,
      applySuggestedUpdate,
      deleteLead,
      getLead,
      leads,
      loading,
      refreshLeads,
      supabaseError,
      supabaseMode,
      supabaseWarning,
      updateLead,
      updateAssignedRep,
      updateActiveProjectStatus,
      updateFollowUp,
      updateLeadStatus,
    ],
  );

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
}

export function useLeads() {
  const context = useContext(LeadContext);

  if (!context) {
    throw new Error("useLeads must be used inside LeadProvider");
  }

  return context;
}
