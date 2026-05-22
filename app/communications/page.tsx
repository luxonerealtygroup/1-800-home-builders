"use client";

import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { MailIcon, PhoneIcon } from "../_components/icons";
import { useLeads } from "../_components/lead-provider";
import { PageHeader } from "../_components/page-header";
import {
  activityToCommunication,
  type CommunicationChannel,
  type CommunicationRecord,
} from "../_lib/communications";

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function channelLabel(channel: CommunicationChannel) {
  if (channel === "text") {
    return "Text";
  }

  return channel[0].toUpperCase() + channel.slice(1);
}

export default function CommunicationsPage() {
  const { leads, loading } = useLeads();
  const communications = leads
    .flatMap((lead) =>
      lead.activity
        .map((activity) => activityToCommunication(lead, activity))
        .filter((record): record is CommunicationRecord => Boolean(record)),
    )
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );

  const recentCalls = communications.filter((item) => item.channel === "call");
  const recentTexts = communications.filter((item) => item.channel === "text");
  const recentEmails = communications.filter((item) => item.channel === "email");
  const failedMessages = communications.filter((item) => item.status === "failed");
  const deliveryStatuses = communications.filter((item) =>
    ["sent", "delivered", "failed"].includes(item.status),
  );
  const callStatuses = communications.filter((item) => item.channel === "call");

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 text-sm text-zinc-400">
          Loading communication history...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Communication Center"
        title="Calls, texts, and emails"
        description="Mock communication command center ready for Twilio Voice, Twilio SMS, and Resend or SendGrid."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Recent calls" value={recentCalls.length.toString()} />
        <MetricCard label="Texts sent" value={recentTexts.length.toString()} />
        <MetricCard label="Emails sent" value={recentEmails.length.toString()} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <CommunicationList
            records={communications}
            title="Communication history by lead"
          />
          <LeadHistory leads={leads} />
        </div>

        <aside className="space-y-5">
          <CommunicationList records={recentCalls.slice(0, 5)} title="Recent calls" />
          <CommunicationList records={recentTexts.slice(0, 5)} title="Recent texts" />
          <CommunicationList records={recentEmails.slice(0, 5)} title="Recent emails" />
          <StatusPanel
            callStatuses={callStatuses}
            deliveryStatuses={deliveryStatuses}
            failedMessages={failedMessages}
          />
        </aside>
      </section>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function CommunicationList({
  records,
  title,
}: {
  records: CommunicationRecord[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <h2 className="font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {records.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-zinc-400">
            No communication activity yet. Call, text, or email from a lead page
            to populate this center.
          </p>
        ) : (
          records.map((record) => (
            <Link
              key={record.id}
              href={`/leads/${record.leadId}`}
              className="block rounded-lg border border-white/10 bg-white/[0.045] p-4 transition hover:border-sky-300/40 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {record.channel === "call" ? (
                      <PhoneIcon className="h-4 w-4 text-sky-200" />
                    ) : (
                      <MailIcon className="h-4 w-4 text-emerald-200" />
                    )}
                    <p className="truncate text-sm font-semibold text-white">
                      {record.leadName}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-zinc-400">
                    {record.detail}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {timeLabel(record.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-md bg-sky-300/10 px-2 py-1 text-xs font-semibold text-sky-100">
                    {channelLabel(record.channel)}
                  </span>
                  <p className="mt-2 text-xs capitalize text-zinc-500">
                    {record.status.replace("_", " ")}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function LeadHistory({ leads }: { leads: ReturnType<typeof useLeads>["leads"] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <h2 className="font-semibold text-white">Lead-level history</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {leads.length === 0 ? (
          <p className="text-sm text-zinc-400">No leads have been added yet.</p>
        ) : (
          leads.map((lead) => {
            const count = lead.activity.filter((activity) =>
              ["call", "text", "email"].includes(activity.type),
            ).length;

            return (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="rounded-lg border border-white/10 bg-white/[0.045] p-4 transition hover:border-sky-300/40"
              >
                <p className="truncate font-semibold text-white">{lead.name}</p>
                <p className="mt-1 text-sm text-zinc-400">{lead.email}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  {count} communication events
                </p>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatusPanel({
  callStatuses,
  deliveryStatuses,
  failedMessages,
}: {
  callStatuses: CommunicationRecord[];
  deliveryStatuses: CommunicationRecord[];
  failedMessages: CommunicationRecord[];
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <h2 className="font-semibold text-white">Statuses</h2>
      <div className="mt-4 grid gap-3">
        <StatusRow label="Call status events" value={callStatuses.length} />
        <StatusRow label="Delivery status events" value={deliveryStatuses.length} />
        <StatusRow label="Failed messages" value={failedMessages.length} tone="danger" />
      </div>
    </section>
  );
}

function StatusRow({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "danger";
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={`text-sm font-semibold ${
          tone === "danger" ? "text-rose-100" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
