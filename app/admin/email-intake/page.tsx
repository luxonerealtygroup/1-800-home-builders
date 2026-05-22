"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "../../_components/app-shell";
import { useAuth } from "../../_components/auth-provider";
import { useLeads } from "../../_components/lead-provider";
import { PageHeader } from "../../_components/page-header";
import { findDuplicateLead } from "../../_lib/email-intake/duplicates";
import { mockLeadEmails } from "../../_lib/email-intake/mock-emails";
import { parseLeadEmail } from "../../_lib/email-intake/parser";
import { findLeadForEmailThread } from "../../_lib/email-intake/threading";
import type { EmailImportStatus } from "../../_lib/email-intake/types";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatBudget(value: number) {
  return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`;
}

export default function EmailIntakePage() {
  const { canManageUsers } = useAuth();
  const { addLead, leads, supabaseError } = useLeads();
  const [importedEmailIds, setImportedEmailIds] = useState<string[]>([]);
  const [importError, setImportError] = useState("");

  const parsedEmails = useMemo(
    () =>
      mockLeadEmails.map((email) => {
        const parsedLead = parseLeadEmail(email);
        const duplicates = findDuplicateLead(parsedLead, leads);
        const threadMatch = findLeadForEmailThread(email, leads);
        const status: EmailImportStatus = importedEmailIds.includes(email.id)
          ? "imported"
          : duplicates.length > 0
            ? "duplicate"
            : "ready";

        return {
          duplicates,
          email,
          parsedLead,
          status,
          threadMatch,
        };
      }),
    [importedEmailIds, leads],
  );

  async function importEmail(emailId: string) {
    const intakeRecord = parsedEmails.find(
      (record) => record.email.id === emailId,
    );

    if (!intakeRecord || intakeRecord.status !== "ready") {
      return;
    }

    const { email, parsedLead } = intakeRecord;
    setImportError("");

    try {
      await addLead({
        name: parsedLead.fullName,
        phone: parsedLead.phone,
        email: parsedLead.email,
        address: parsedLead.propertyAddress,
        city: parsedLead.city,
        budget: formatBudget(100000),
        projectType: parsedLead.projectType,
        timeline: parsedLead.timeline,
        value: 100000,
        stage: "New",
        status: "New Lead",
        priority: "Warm",
        assignedRep: "Unassigned",
        nextFollowUpDate: todayIsoDate(),
        source: parsedLead.leadSource,
        nextStep: "Review imported email and call to qualify.",
        notes: parsedLead.messageBody,
        projectInfo: `${parsedLead.projectType}. Timeline: ${parsedLead.timeline}. Email budget parsed as ${formatBudget(parsedLead.budget)}; starting CRM estimate set to $100k.`,
        appointment: {
          date: todayIsoDate(),
          time: "Not set",
          type: "Phone consult",
          notes: "Appointment not set. Imported from email intake.",
        },
        initialActivity: [
          {
            type: "email",
            label: "Original lead email imported",
            detail: `Subject: ${email.subject}\nThread: ${email.threadId}\n\n${email.body}`,
          },
          {
            type: "note",
            label: "AI summary placeholder",
            detail:
              "AI summary will be generated after OpenAI integration. For now, use parsed project type, budget, timeline, and message body.",
          },
        ],
      });

      setImportedEmailIds((currentIds) => [...currentIds, emailId]);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not import lead.",
      );
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Email Intake"
        description="Mock inbox intake for turning lead emails into CRM leads. Gmail, Workspace, Outlook, and IMAP connections are scaffolded but not connected yet."
      />

      {!canManageUsers ? (
        <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Admin access required</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Only admins can configure inbox intake and review imported lead
            emails.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {(importError || supabaseError) && (
            <div className="rounded-lg border border-rose-300/30 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
              {importError || supabaseError}
            </div>
          )}
          <section className="grid gap-3 md:grid-cols-4">
            <StatusCard label="Inbox" value="Mock connected" tone="sky" />
            <StatusCard
              label="Recent emails"
              value={String(parsedEmails.length)}
              tone="emerald"
            />
            <StatusCard
              label="Duplicates"
              value={String(
                parsedEmails.filter((record) => record.status === "duplicate")
                  .length,
              )}
              tone="amber"
            />
            <StatusCard
              label="Imported"
              value={String(importedEmailIds.length)}
              tone="violet"
            />
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Integration-ready connectors
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Placeholder functions exist for Gmail API, Google Workspace,
                  Outlook, and IMAP inboxes. They are intentionally offline for
                  now.
                </p>
              </div>
              <span className="rounded-md border border-sky-300/25 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100">
                Mock mode
              </span>
            </div>
          </section>

          <section className="grid gap-4">
            {parsedEmails.map((record) => (
              <article
                key={record.email.id}
                className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {record.email.subject}
                      </h2>
                      <StatusPill status={record.status} />
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">
                      From {record.email.from} • {record.email.fromEmail}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Thread: {record.email.threadId}
                    </p>
                  </div>
                  <button
                    className="h-11 rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    disabled={record.status !== "ready"}
                    onClick={() => importEmail(record.email.id)}
                  >
                    {record.status === "imported" ? "Imported" : "Import lead"}
                  </button>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <h3 className="font-semibold text-white">Parsed lead data</h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      <InfoRow label="Name" value={record.parsedLead.fullName} />
                      <InfoRow label="Phone" value={record.parsedLead.phone} />
                      <InfoRow label="Email" value={record.parsedLead.email} />
                      <InfoRow
                        label="Address"
                        value={record.parsedLead.propertyAddress || "Not provided"}
                      />
                      <InfoRow label="City" value={record.parsedLead.city} />
                      <InfoRow
                        label="Project"
                        value={record.parsedLead.projectType}
                      />
                      <InfoRow
                        label="Budget"
                        value={formatBudget(record.parsedLead.budget)}
                      />
                      <InfoRow
                        label="Timeline"
                        value={record.parsedLead.timeline}
                      />
                      <InfoRow
                        label="Source"
                        value={record.parsedLead.leadSource}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <h3 className="font-semibold text-white">
                      Duplicate and threading status
                    </h3>
                    {record.duplicates.length === 0 ? (
                      <p className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.07] p-3 text-sm text-emerald-100">
                        No duplicate detected by email, phone, or property
                        address.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {record.duplicates.map((duplicate) => (
                          <Link
                            key={`${duplicate.leadId}-${duplicate.field}`}
                            href={`/leads/${duplicate.leadId}`}
                            className="block rounded-lg border border-amber-300/20 bg-amber-300/[0.08] p-3 text-sm text-amber-100"
                          >
                            Duplicate by {duplicate.field}:{" "}
                            {duplicate.leadName}
                          </Link>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-zinc-400">
                      {record.threadMatch
                        ? `Future replies should attach to lead ${record.threadMatch.leadId} by ${record.threadMatch.reason}.`
                        : "No existing thread match. Future replies can attach by email or thread id."}
                    </p>

                    <div className="mt-3 rounded-lg border border-dashed border-sky-300/25 bg-sky-300/[0.05] p-3 text-sm leading-6 text-zinc-300">
                      AI summary placeholder will summarize project type,
                      budget, timeline, and message body after OpenAI is
                      connected.
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function StatusCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "sky" | "emerald" | "amber" | "violet";
  value: string;
}) {
  const tones = {
    sky: "from-sky-300/18 to-cyan-300/5",
    emerald: "from-emerald-300/18 to-teal-300/5",
    amber: "from-amber-300/18 to-orange-300/5",
    violet: "from-violet-300/18 to-sky-300/5",
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0b1018]/74 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${tones[tone]}`} />
      <div className="relative">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: EmailImportStatus }) {
  const styles = {
    ready: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    duplicate: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    imported: "border-sky-300/30 bg-sky-300/10 text-sky-100",
    needs_review: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  };

  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-2 last:border-b-0">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}
