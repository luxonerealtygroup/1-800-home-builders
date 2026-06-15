"use client";

import Link from "next/link";
import { useLeads } from "./lead-provider";
import {
  lostLeadStatuses,
  salesPipelineStatuses,
  type Lead,
} from "../_lib/crm-data";

const priorityStyles = {
  Hot: "border-rose-300/40 bg-rose-400/12 text-rose-100",
  Warm: "border-amber-300/40 bg-amber-300/12 text-amber-100",
  Nurture: "border-zinc-500/40 bg-zinc-500/12 text-zinc-300",
};

const quickStatusOptions = [...salesPipelineStatuses, ...lostLeadStatuses];

export function LeadCard({
  lead,
  compact = false,
  quickActions = false,
}: {
  lead: Lead;
  compact?: boolean;
  quickActions?: boolean;
}) {
  const { updateLeadStatus } = useLeads();

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="group block rounded-lg border border-white/10 bg-[#0b1018]/76 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky-300/50 hover:bg-[#101826]/88"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white group-hover:text-sky-100">
            {lead.name}
          </h3>
          <p className="mt-1 truncate text-sm text-zinc-400">{lead.address}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{lead.city}</p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold ${priorityStyles[lead.priority]}`}
        >
          {lead.priority}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-white/8 bg-black/18 p-3">
        <div>
          <p className="text-[11px] text-zinc-500">Budget</p>
          <p className="text-sm font-semibold text-white">{lead.budget}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Status</p>
          <p className="truncate text-sm font-medium text-zinc-300">
            {lead.status}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Close</p>
          <p className="text-sm font-semibold text-sky-200">
            {lead.probability}%
          </p>
        </div>
      </div>

      {quickActions && (
        <div
          className="mt-3"
          onClick={(event) => event.preventDefault()}
        >
          <select
            className="h-10 w-full rounded-lg border border-white/10 bg-black/35 px-2 text-xs font-semibold text-zinc-200 outline-none transition focus:border-sky-300/70"
            value={lead.status}
            onChange={(event) =>
              updateLeadStatus(lead.id, event.target.value as Lead["status"])
            }
          >
            {quickStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      {!compact && (
        <>
          <p className="mt-4 rounded-lg bg-sky-300/[0.06] p-3 text-sm leading-5 text-zinc-300">
            {lead.nextStep}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>{lead.source}</span>
            <span>{lead.lastTouch}</span>
          </div>
        </>
      )}
    </Link>
  );
}
