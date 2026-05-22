"use client";

import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { useAuth } from "../_components/auth-provider";
import { LeadCard } from "../_components/lead-card";
import { useLeads } from "../_components/lead-provider";
import { PageHeader } from "../_components/page-header";
import { getVisibleLeads } from "../_lib/access";
import { salesPipelineStatuses } from "../_lib/crm-data";

export default function PipelinePage() {
  const { user } = useAuth();
  const { leads } = useLeads();
  const visibleLeads = getVisibleLeads(user, leads);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Sales Pipeline"
        title="Kanban pipeline"
        description="Stage every ADU opportunity by the next clear action, from first inquiry to signed scope."
        action={
          <Link
            href="/leads/new"
            className="flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
          >
            Add lead
          </Link>
        }
      />

      <section className="grid auto-cols-[minmax(286px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3">
        {salesPipelineStatuses.map((status) => {
          const stageLeads = visibleLeads.filter((lead) => lead.status === status);
          const totalValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

          return (
            <div
              key={status}
              className="flex max-h-[620px] min-h-[420px] flex-col rounded-lg border border-white/10 bg-[#0b1018]/72 p-3 shadow-2xl shadow-black/25 backdrop-blur-xl"
            >
              <div className="mb-4 rounded-lg border border-white/8 bg-black/18 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white">{status}</h2>
                    <p className="text-xs text-zinc-500">
                      ${(totalValue / 1000).toFixed(0)}k potential
                    </p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-950">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300"
                    style={{ width: `${Math.min(stageLeads.length * 42, 100)}%` }}
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {stageLeads.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-zinc-500">
                    No leads in {status} yet.
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} compact />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
