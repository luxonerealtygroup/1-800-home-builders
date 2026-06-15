"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { useAuth } from "../_components/auth-provider";
import { useLeads } from "../_components/lead-provider";
import { LeadCard } from "../_components/lead-card";
import { PageHeader } from "../_components/page-header";
import { getVisibleLeads } from "../_lib/access";
import {
  lostLeadStatuses,
  salesPipelineStatuses,
  type Lead,
} from "../_lib/crm-data";

const allStatuses = [...salesPipelineStatuses, ...lostLeadStatuses, "Quote Approved"] as const;
const priorities: Lead["priority"][] = ["Hot", "Warm", "Nurture"];

export default function LeadsPage() {
  const { user, users } = useAuth();
  const { leads } = useLeads();
  const visibleLeads = getVisibleLeads(user, leads);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const reps = useMemo(() => {
    const names = new Set(visibleLeads.map((lead) => lead.assignedRep));
    users.forEach((workspaceUser) => names.add(workspaceUser.name));
    return Array.from(names).filter(Boolean).sort();
  }, [users, visibleLeads]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleLeads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

      if (repFilter !== "all" && lead.assignedRep !== repFilter) {
        return false;
      }

      if (priorityFilter !== "all" && lead.priority !== priorityFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        lead.name,
        lead.address,
        lead.city,
        lead.email,
        lead.phone,
        lead.source,
        lead.projectType,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [priorityFilter, query, repFilter, statusFilter, visibleLeads]);

  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    repFilter !== "all" ||
    priorityFilter !== "all";

  return (
    <AppShell>
      <PageHeader
        eyebrow="Leads"
        title="All leads"
        description="Search and filter every lead in your workspace."
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
        <input
          className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
          placeholder="Search by name, address, email, phone, or source..."
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select
            className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-sky-300/70"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {allStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-sky-300/70"
            value={repFilter}
            onChange={(event) => setRepFilter(event.target.value)}
          >
            <option value="all">All reps</option>
            {reps.map((rep) => (
              <option key={rep} value={rep}>
                {rep}
              </option>
            ))}
          </select>

          <select
            className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-sky-300/70"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="all">All priorities</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>
              {filteredLeads.length} of {visibleLeads.length} leads
            </span>
            <button
              className="font-semibold text-sky-300 transition hover:text-sky-200"
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setRepFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredLeads.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 text-sm leading-6 text-zinc-400 md:col-span-2 xl:col-span-3">
            No leads match your search and filters.
          </div>
        ) : (
          filteredLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </section>
    </AppShell>
  );
}
