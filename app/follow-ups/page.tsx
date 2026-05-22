"use client";

import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { useAuth } from "../_components/auth-provider";
import { useLeads } from "../_components/lead-provider";
import { PageHeader } from "../_components/page-header";
import { getVisibleLeads } from "../_lib/access";
import type { Lead } from "../_lib/crm-data";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function sortByFollowUp(a: Lead, b: Lead) {
  return getQueueDate(a).localeCompare(getQueueDate(b));
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

export default function FollowUpsPage() {
  const { user } = useAuth();
  const { leads } = useLeads();
  const visibleLeads = getVisibleLeads(user, leads);
  const today = todayIsoDate();
  const overdue = visibleLeads
    .filter((lead) => getQueueDate(lead) < today)
    .sort(sortByFollowUp);
  const dueToday = visibleLeads
    .filter((lead) => getQueueDate(lead) === today)
    .sort(sortByFollowUp);
  const upcoming = visibleLeads
    .filter((lead) => getQueueDate(lead) > today)
    .sort(sortByFollowUp);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Follow-ups"
        title="Today&apos;s sales queue"
        description="The fastest view for reps to clear overdue, due-today, and upcoming ADU lead follow-ups."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <FollowUpColumn
          label="Overdue"
          tone="rose"
          leads={overdue}
          empty="No overdue follow-ups."
        />
        <FollowUpColumn
          label="Due today"
          tone="sky"
          leads={dueToday}
          empty="Nothing due today."
        />
        <FollowUpColumn
          label="Upcoming"
          tone="emerald"
          leads={upcoming}
          empty="No upcoming follow-ups."
        />
      </section>
    </AppShell>
  );
}

function FollowUpColumn({
  empty,
  label,
  leads,
  tone,
}: {
  empty: string;
  label: string;
  leads: Lead[];
  tone: "rose" | "sky" | "emerald";
}) {
  const tones = {
    rose: "border-rose-300/25 bg-rose-400/[0.055] text-rose-100",
    sky: "border-sky-300/25 bg-sky-300/[0.055] text-sky-100",
    emerald: "border-emerald-300/25 bg-emerald-300/[0.055] text-emerald-100",
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-3 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className={`rounded-lg border p-3 ${tones[tone]}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{label}</h2>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-950">
            {leads.length}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {leads.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-zinc-500">
            {empty}
          </p>
        ) : (
          leads.map((lead) => <FollowUpCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

function FollowUpCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-sky-300/40 hover:bg-white/[0.055]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{lead.name}</h3>
          <p className="mt-1 truncate text-sm text-zinc-400">{lead.nextStep}</p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-200">
          {dateLabel(getQueueDate(lead))}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-zinc-500">Rep</p>
          <p className="mt-1 font-semibold text-zinc-200">{lead.assignedRep}</p>
        </div>
        <div>
          <p className="text-zinc-500">Priority</p>
          <p className="mt-1 font-semibold text-zinc-200">{lead.priority}</p>
        </div>
        <div>
          <p className="text-zinc-500">Value</p>
          <p className="mt-1 font-semibold text-zinc-200">{lead.budget}</p>
        </div>
      </div>
    </Link>
  );
}
