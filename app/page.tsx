"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "./_components/app-shell";
import { useAuth } from "./_components/auth-provider";
import { useLeads } from "./_components/lead-provider";
import { LeadCard } from "./_components/lead-card";
import { MetricCard } from "./_components/metric-card";
import { PageHeader } from "./_components/page-header";
import { getVisibleLeads } from "./_lib/access";
import { projects, type ActivityEntry, type Lead } from "./_lib/crm-data";

type DateFilter = "today" | "week" | "month" | "all";

const dateFilters: { label: string; value: DateFilter }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

const sourceBuckets = [
  "Google Ads",
  "Facebook Ads",
  "Website",
  "Manual Entry",
  "Email Intake",
] as const;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = nextDate.getDate() - day + (day === 0 ? -6 : 1);
  nextDate.setDate(diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function isWithinFilter(dateValue: string, filter: DateFilter) {
  if (filter === "all") {
    return true;
  }

  const date = new Date(dateValue);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (filter === "today") {
    return date.toISOString().slice(0, 10) === todayIsoDate();
  }

  if (filter === "week") {
    return date >= startOfWeek(now);
  }

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function getLeadCreatedAt(lead: Lead) {
  const createdActivity = lead.activity.find((activity) =>
    ["Lead created", "Original lead email imported"].includes(activity.label),
  );

  return createdActivity?.createdAt ?? lead.activity.at(-1)?.createdAt ?? "";
}

function getFilteredActivities(leads: Lead[], filter: DateFilter) {
  return leads.flatMap((lead) =>
    lead.activity
      .filter((activity) => isWithinFilter(activity.createdAt, filter))
      .map((activity) => ({
        ...activity,
        assignedRep: lead.assignedRep || "Unassigned",
      })),
  );
}

function hasReachedStatus(lead: Lead, status: Lead["status"]) {
  const order: Lead["status"][] = [
    "New Lead",
    "Contact Attempted",
    "Contacted",
    "Appointment Set",
    "Phone Appointment Set",
    "In-Person Appointment Set",
    "Appointment Completed",
    "Quote Needed",
    "Quote Sent",
    "Quote Approved",
  ];
  const leadIndex = order.indexOf(lead.status);
  const targetIndex = order.indexOf(status);

  return leadIndex >= targetIndex && targetIndex !== -1;
}

function sourceBucket(source: string) {
  const normalized = source.toLowerCase();

  if (normalized.includes("google")) {
    return "Google Ads";
  }

  if (normalized.includes("facebook") || normalized.includes("instagram")) {
    return "Facebook Ads";
  }

  if (normalized.includes("email")) {
    return "Email Intake";
  }

  if (normalized.includes("website") || normalized.includes("web")) {
    return "Website";
  }

  return "Manual Entry";
}

function isAppointmentSetStatus(status: Lead["status"]) {
  return [
    "Appointment Set",
    "Phone Appointment Set",
    "In-Person Appointment Set",
    "Appointment Completed",
  ].includes(status);
}

function getQueueDate(lead: Lead) {
  if (
    [
      "Appointment Set",
      "Phone Appointment Set",
      "In-Person Appointment Set",
    ].includes(lead.status) &&
    lead.appointment.date
  ) {
    return lead.appointment.date;
  }

  return lead.nextFollowUpDate;
}

export default function Home() {
  const { user } = useAuth();
  const { leads } = useLeads();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const visibleLeads = getVisibleLeads(user, leads);
  const filteredLeads = visibleLeads.filter((lead) =>
    isWithinFilter(getLeadCreatedAt(lead), dateFilter),
  );
  const filteredActivities = getFilteredActivities(visibleLeads, dateFilter);
  const today = todayIsoDate();
  const activeProjectLeads = visibleLeads.filter(
    (lead) => lead.status === "Quote Approved",
  );
  const completedProjectLeads = activeProjectLeads.filter(
    (lead) => lead.activeProjectStatus === "Completed",
  );
  const metrics = [
    {
      label: "Total leads",
      value: String(filteredLeads.length),
      detail: "Leads created in selected range",
      tone: "sky" as const,
    },
    {
      label: "New leads today",
      value: String(
        visibleLeads.filter((lead) => getLeadCreatedAt(lead).startsWith(today))
          .length,
      ),
      detail: "Created today",
      tone: "emerald" as const,
    },
    {
      label: "Follow-ups due today",
      value: String(
        visibleLeads.filter((lead) => getQueueDate(lead) === today).length,
      ),
      detail: "Needs action today",
      tone: "amber" as const,
    },
    {
      label: "Overdue follow-ups",
      value: String(
        visibleLeads.filter((lead) => getQueueDate(lead) < today).length,
      ),
      detail: "Past due",
      tone: "violet" as const,
    },
    {
      label: "Hot leads",
      value: String(filteredLeads.filter((lead) => lead.priority === "Hot").length),
      detail: "High-priority opportunities",
      tone: "amber" as const,
    },
    {
      label: "Appointments set",
      value: String(
        filteredLeads.filter((lead) => isAppointmentSetStatus(lead.status))
          .length,
      ),
      detail: "Booked consults",
      tone: "emerald" as const,
    },
    {
      label: "Quotes sent",
      value: String(filteredLeads.filter((lead) => lead.status === "Quote Sent").length),
      detail: "Quote stage",
      tone: "sky" as const,
    },
    {
      label: "Quotes approved",
      value: String(
        filteredLeads.filter((lead) => lead.status === "Quote Approved").length,
      ),
      detail: "Converted to project",
      tone: "emerald" as const,
    },
    {
      label: "Active projects",
      value: String(activeProjectLeads.length + projects.length),
      detail: "Converted plus mock projects",
      tone: "violet" as const,
    },
    {
      label: "Completed projects",
      value: String(
        completedProjectLeads.length +
          projects.filter((project) => project.progress === 100).length,
      ),
      detail: "Finished work",
      tone: "emerald" as const,
    },
    {
      label: "Lost leads",
      value: String(
        filteredLeads.filter((lead) => lead.status === "Lost / Not Interested")
          .length,
      ),
      detail: "Marked not interested",
      tone: "amber" as const,
    },
  ];
  const conversions = [
    ["New Lead to Contacted", "Contacted"],
    ["Contacted to Appointment Set", "Phone Appointment Set"],
    ["Appointment Set to Quote Sent", "Quote Sent"],
    ["Quote Sent to Quote Approved", "Quote Approved"],
  ] as const;
  const repRows = buildRepActivity(filteredActivities);
  const maxSourceCount = Math.max(
    1,
    ...sourceBuckets.map(
      (source) =>
        filteredLeads.filter((lead) => sourceBucket(lead.source) === source)
          .length,
    ),
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title="ADU sales performance"
        description={
          user?.role === "admin"
            ? "Admin reporting across pipeline, reps, sources, and project conversion."
            : "Your assigned leads, follow-ups, activity, and conversion progress."
        }
        action={
          <Link
            href="/leads/new"
            className="flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
          >
            New lead
          </Link>
        }
      />

      <section className="mb-5 rounded-lg border border-white/10 bg-[#0b1018]/74 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-2">
          {dateFilters.map((filter) => (
            <button
              key={filter.value}
              className={`h-10 rounded-lg text-xs font-semibold transition sm:text-sm ${
                dateFilter === filter.value
                  ? "bg-white text-slate-950"
                  : "bg-white/[0.055] text-zinc-400 hover:text-white"
              }`}
              type="button"
              onClick={() => setDateFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <ReportPanel title="Conversion overview">
          <div className="space-y-3">
            {conversions.map(([label, target]) => (
              <ConversionRow
                key={label}
                count={filteredLeads.filter((lead) => hasReachedStatus(lead, target)).length}
                label={label}
                total={Math.max(filteredLeads.length, 1)}
              />
            ))}
            <ConversionRow
              count={completedProjectLeads.length}
              label="Quote Approved to Completed"
              total={Math.max(activeProjectLeads.length, 1)}
            />
          </div>
        </ReportPanel>

        <ReportPanel title="Lead source tracking">
          <div className="space-y-3">
            {sourceBuckets.map((source) => {
              const count = filteredLeads.filter(
                (lead) => sourceBucket(lead.source) === source,
              ).length;

              return (
                <div key={source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-300">{source}</span>
                    <span className="text-zinc-500">{count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300"
                      style={{ width: `${(count / maxSourceCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ReportPanel>
      </section>

      {user?.role === "admin" && (
        <section className="mt-6">
          <ReportPanel title="Rep activity">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  <tr>
                    {[
                      "Rep",
                      "Calls",
                      "Texts",
                      "Emails",
                      "Notes",
                      "Follow-ups",
                      "Appointments",
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-3 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {repRows.map((row) => (
                    <tr key={row.rep}>
                      <td className="px-3 py-3 font-semibold text-white">
                        {row.rep}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">{row.calls}</td>
                      <td className="px-3 py-3 text-zinc-300">{row.texts}</td>
                      <td className="px-3 py-3 text-zinc-300">{row.emails}</td>
                      <td className="px-3 py-3 text-zinc-300">{row.notes}</td>
                      <td className="px-3 py-3 text-zinc-300">
                        {row.followUps}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">
                        {row.appointments}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportPanel>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Priority leads</h2>
          <p className="text-sm text-zinc-500">Tap a card for details</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleLeads.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 text-sm leading-6 text-zinc-400 md:col-span-2">
              No leads yet. Add your first manual lead to begin reporting.
            </div>
          ) : (
            visibleLeads
              .filter((lead) => lead.priority === "Hot")
              .concat(visibleLeads.filter((lead) => lead.priority !== "Hot"))
              .slice(0, 4)
              .map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </div>
      </section>
    </AppShell>
  );
}

function buildRepActivity(
  activities: Array<ActivityEntry & { assignedRep: string }>,
) {
  const rows = new Map<
    string,
    {
      appointments: number;
      calls: number;
      emails: number;
      followUps: number;
      notes: number;
      rep: string;
      texts: number;
    }
  >();

  activities.forEach((activity) => {
    const current = rows.get(activity.assignedRep) ?? {
      appointments: 0,
      calls: 0,
      emails: 0,
      followUps: 0,
      notes: 0,
      rep: activity.assignedRep,
      texts: 0,
    };

    if (activity.type === "call") {
      current.calls += 1;
    }

    if (activity.type === "text") {
      current.texts += 1;
    }

    if (activity.type === "email") {
      current.emails += 1;
    }

    if (activity.type === "note") {
      current.notes += 1;
    }

    if (activity.type === "follow-up") {
      current.followUps += 1;
    }

    if (activity.type === "appointment") {
      current.appointments += 1;
    }

    rows.set(activity.assignedRep, current);
  });

  return Array.from(rows.values()).sort((first, second) =>
    first.rep.localeCompare(second.rep),
  );
}

function ConversionRow({
  count,
  label,
  total,
}: {
  count: number;
  label: string;
  total: number;
}) {
  const percent = Math.round((count / total) * 100);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        <p className="text-sm font-semibold text-white">
          {count} / {total}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{percent}% conversion</p>
    </div>
  );
}

function ReportPanel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
