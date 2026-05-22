"use client";

import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { useAuth } from "../_components/auth-provider";
import { useLeads } from "../_components/lead-provider";
import { MetricCard } from "../_components/metric-card";
import { PageHeader } from "../_components/page-header";

export default function AdminPage() {
  const { canManageUsers, users } = useAuth();
  const { leads } = useLeads();
  const openActivityCount = leads.reduce(
    (count, lead) => count + lead.activity.length,
    0,
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Workspace control"
        description="Admin access can view every lead, all activity, and assign work across the sales team."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/email-intake"
              className="flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
            >
              Email Intake
            </Link>
            <Link
              href="/admin/users"
              className="flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-zinc-200 transition hover:border-sky-300/40"
            >
              Manage users
            </Link>
          </div>
        }
      />

      {!canManageUsers ? (
        <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Admin access required</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Sales reps can update assigned leads, notes, statuses, and
            follow-ups from their own workspace.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total leads"
              value={String(leads.length)}
              detail="Admin sees every workspace lead"
              tone="sky"
            />
            <MetricCard
              label="Team users"
              value={String(users.length)}
              detail="Admins and sales reps"
              tone="emerald"
            />
            <MetricCard
              label="Activity entries"
              value={String(openActivityCount)}
              detail="Calls, texts, notes, and follow-ups"
              tone="amber"
            />
            <MetricCard
              label="Role model"
              value="2"
              detail="admin and sales_rep"
              tone="violet"
            />
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Assign leads", "Open any lead profile and use Assignment."],
              ["View all activity", "Lead timelines show complete mock activity."],
              ["Manage access", "Create admins and sales reps from Users."],
              ["Import email leads", "Review mock inbox parsing in Email Intake."],
            ].map(([title, detail]) => (
              <article
                key={title}
                className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl"
              >
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{detail}</p>
              </article>
            ))}
          </section>
        </>
      )}
    </AppShell>
  );
}
