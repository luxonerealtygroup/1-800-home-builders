"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { AppShell } from "../../_components/app-shell";
import { useAuth } from "../../_components/auth-provider";
import { useLeads } from "../../_components/lead-provider";
import { LeadIcon, MailIcon, PhoneIcon } from "../../_components/icons";
import { PageHeader } from "../../_components/page-header";
import { canViewLead } from "../../_lib/access";
import { leadsService } from "../../../lib/services/leads";
import { messageTemplates, personalizeTemplate } from "../../_lib/communications";
import {
  lostLeadStatuses,
  salesPipelineStatuses,
  type AiLeadSummary,
  type Lead,
} from "../../_lib/crm-data";

function dateLabel(value: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, users } = useAuth();
  const {
    addActivity,
    applySuggestedUpdate,
    archiveLead,
    getLead,
    loading,
    supabaseMode,
    updateLead,
    updateAssignedRep,
    updateFollowUp,
    updateLeadStatus,
  } = useLeads();
  const lead = getLead(params.id);
  const [aiSummary, setAiSummary] = useState<AiLeadSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [editableSuggestion, setEditableSuggestion] = useState("");
  const [suggestionIgnored, setSuggestionIgnored] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [communicationNotice, setCommunicationNotice] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 text-sm text-zinc-400">
          Loading lead...
        </div>
      </AppShell>
    );
  }

  if (!lead || !canViewLead(user, lead)) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Lead Detail"
          title="Lead not available"
          description="Admins can view every lead. Sales reps only see leads assigned to them."
        />
      </AppShell>
    );
  }

  const currentLead = lead;

  const followUpActions = [
    {
      label: "Follow Up Tomorrow",
      date: addDays(1),
      detail: "Follow-up scheduled for tomorrow.",
    },
    {
      label: "Follow Up in 3 Days",
      date: addDays(3),
      detail: "Follow-up scheduled in 3 days.",
    },
    {
      label: "Follow Up Next Week",
      date: addDays(7),
      detail: "Follow-up scheduled for next week.",
    },
    {
      label: "Follow Up in 2 Weeks",
      date: addDays(14),
      detail: "Follow-up scheduled in 2 weeks.",
    },
  ];

  const communicationHistory = currentLead.activity.filter((entry) =>
    ["call", "text", "email"].includes(entry.type),
  );

  async function startCall() {
    await fetch("/api/calls/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId: currentLead.id,
        phone: currentLead.phone,
      }),
    });
    addActivity(currentLead.id, {
      type: "call",
      label: "Call attempted",
      detail: `Call attempted for ${currentLead.name}.`,
    });
    setCommunicationNotice("Mock call started and logged.");
  }

  async function sendText(message = draftMessage) {
    await fetch("/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId: currentLead.id,
        message,
        phone: currentLead.phone,
      }),
    });
    addActivity(currentLead.id, {
      type: "text",
      label: "Text sent",
      detail: message || "Mock text sent from communication panel.",
    });
    setCommunicationNotice("Mock text sent and logged.");
  }

  async function sendEmail(message = draftMessage) {
    await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: currentLead.email,
        leadId: currentLead.id,
        message,
        subject: "ADU project follow-up",
      }),
    });
    addActivity(currentLead.id, {
      type: "email",
      label: "Email sent",
      detail: message || "Mock email sent from communication panel.",
    });
    setCommunicationNotice("Mock email sent and logged.");
  }

  async function markCallStatus(
    label: "Call completed" | "No answer" | "Voicemail left",
    detail: string,
  ) {
    await fetch("/api/calls/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId: currentLead.id,
        status: label,
      }),
    });
    addActivity(currentLead.id, {
      type: "call",
      label,
      detail,
    });
    setCommunicationNotice(`${label} logged.`);
  }

  async function generateSummary() {
    setIsGeneratingSummary(true);
    setSuggestionIgnored(false);

    try {
      const response = await fetch("/api/ai/summarize-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lead: currentLead }),
      });
      const data = (await response.json()) as { summary: AiLeadSummary };

      setAiSummary(data.summary);
      setEditableSuggestion(data.summary.suggestedStatusUpdate);
      addActivity(currentLead.id, {
        type: "ai",
        label: "AI summary generated",
        detail: `Suggested next step: ${data.summary.suggestedNextStep}`,
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  function approveSuggestion() {
    if (!aiSummary || !editableSuggestion) {
      return;
    }

    applySuggestedUpdate(
      currentLead.id,
      editableSuggestion,
      `Approved AI suggestion: ${editableSuggestion}. Suggested next step: ${aiSummary.suggestedNextStep}`,
    );
  }

  function saveNote() {
    const note = noteDraft.trim();

    if (!note) {
      return;
    }

    addActivity(currentLead.id, {
      type: "note",
      label: "Note added",
      detail: note,
    });
    setNoteDraft("");
  }

  async function saveAppointment() {
    const selectedDate =
      appointmentDate || currentLead.appointment.date || currentLead.nextFollowUpDate;
    const selectedTime = appointmentTime || currentLead.appointment.time;
    const appointmentType =
      currentLead.status === "In-Person Appointment Set"
        ? "Site walk"
        : "Phone consult";

    const updatedLead = await updateLead(currentLead.id, {
      ...currentLead,
      appointment: {
        date: selectedDate,
        notes: `${appointmentType} scheduled from lead workflow.`,
        time: selectedTime || "Not set",
        type: appointmentType,
      },
      nextFollowUpDate: selectedDate,
      nextStep: `${appointmentType} scheduled for ${selectedDate} at ${
        selectedTime || "time TBD"
      }.`,
      value: currentLead.value,
    });

    if (updatedLead && supabaseMode === "connected") {
      await leadsService.upsertAppointment(updatedLead);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Lead Detail"
        title={lead.name}
        description={`${lead.address}, ${lead.city}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/leads/${lead.id}/edit`}
              className="flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
            >
              Edit
            </Link>
            <span className="rounded-lg border border-sky-300/40 bg-sky-300/10 px-3 py-2 text-sm font-semibold text-sky-100 shadow-lg shadow-sky-950/20">
              {lead.status}
            </span>
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-sky-300 to-emerald-300 text-slate-950 shadow-lg shadow-sky-950/30">
                <LeadIcon className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-zinc-400">Estimated budget</p>
                <p className="text-2xl font-semibold text-white">
                  {lead.budget}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DetailStat label="Priority" value={lead.priority} />
              <DetailStat label="Stage" value={lead.stage} />
              <DetailStat label="Assigned rep" value={lead.assignedRep} />
              <DetailStat
                label="Next follow-up"
                value={dateLabel(lead.nextFollowUpDate)}
              />
            </div>

            <div className="mt-5 rounded-lg border border-sky-300/15 bg-sky-300/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                Next step
              </p>
              <p className="mt-2 text-base font-medium text-white">
                {lead.nextStep}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Communication
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Mock-ready for Twilio Voice, Twilio SMS, and email sending.
                </p>
              </div>
              {communicationNotice && (
                <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-100">
                  {communicationNotice}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <a
                href={`tel:${lead.phone}`}
                className="flex h-16 items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-sky-300 to-cyan-200 text-base font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
                onClick={startCall}
              >
                <PhoneIcon className="h-5 w-5" />
                Call
              </a>
              <button
                className="flex h-16 items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:border-sky-300/40"
                type="button"
                onClick={() => sendText()}
              >
                Text
              </button>
              <button
                className="flex h-16 items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:border-sky-300/40"
                type="button"
                onClick={() => sendEmail()}
              >
                <MailIcon className="h-5 w-5" />
                Email
              </button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Message templates
                </p>
                <div className="mt-3 grid gap-2">
                  {messageTemplates.map((template) => (
                    <button
                      key={template.id}
                      className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left text-sm font-semibold text-zinc-200 transition hover:border-sky-300/40"
                      type="button"
                      onClick={() =>
                        setDraftMessage(
                          personalizeTemplate(template.body, currentLead),
                        )
                      }
                    >
                      {template.label}
                      <span className="ml-2 text-xs font-medium capitalize text-zinc-500">
                        {template.channel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Quick reply
                </p>
                <textarea
                  className="mt-3 min-h-32 w-full rounded-lg border border-white/10 bg-black/35 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                  placeholder="Pick a template or write a quick message..."
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.06] text-sm font-semibold text-zinc-200"
                    type="button"
                    onClick={() => sendText()}
                  >
                    Send text
                  </button>
                  <button
                    className="h-11 rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950"
                    type="button"
                    onClick={() => sendEmail()}
                  >
                    Send email
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Communication history
              </p>
              <div className="mt-3 space-y-3">
                {communicationHistory.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    No calls, texts, or emails logged yet.
                  </p>
                ) : (
                  communicationHistory.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm font-semibold text-white">
                        {entry.label}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-zinc-400">
                        {entry.detail}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {timeLabel(entry.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Quick actions</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Texted", "Text message sent"],
                ["Emailed", "Email sent"],
              ].map(([label, detail]) => (
                <button
                  key={label}
                  className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-zinc-200 transition hover:border-sky-300/40 hover:bg-white/[0.08]"
                  type="button"
                  onClick={() =>
                    addActivity(lead.id, {
                      type: label === "Texted" ? "text" : "email",
                      label: label === "Texted" ? "Text sent" : "Email sent",
                      detail,
                    })
                  }
                >
                  {label}
                </button>
              ))}
              <button
                className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-zinc-200 transition hover:border-sky-300/40 hover:bg-white/[0.08]"
                type="button"
                onClick={() =>
                  markCallStatus("Call completed", "Call completed with lead.")
                }
              >
                Called
              </button>
              <button
                className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-zinc-200 transition hover:border-sky-300/40 hover:bg-white/[0.08]"
                type="button"
                onClick={() => markCallStatus("No answer", "No answer from lead.")}
              >
                No Answer
              </button>
              <button
                className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-zinc-200 transition hover:border-sky-300/40 hover:bg-white/[0.08]"
                type="button"
                onClick={() =>
                  markCallStatus("Voicemail left", "Voicemail left for lead.")
                }
              >
                Left Voicemail
              </button>
              {followUpActions.map((action) => (
                <button
                  key={action.label}
                  className="h-12 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] px-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/50"
                  type="button"
                  onClick={() =>
                    updateFollowUp(
                      lead.id,
                      action.date,
                      action.label,
                      action.detail,
                    )
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Notes</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Add call notes, customer objections, project details, or next-step
              context.
            </p>
            <textarea
              className="mt-4 min-h-28 w-full rounded-lg border border-white/10 bg-black/35 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
              placeholder="Type a note for this lead..."
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
            />
            <button
              className="mt-3 h-11 w-full rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={!noteDraft.trim()}
              onClick={saveNote}
            >
              Save note
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Activity timeline</h2>
            <div className="mt-5 space-y-4">
              {lead.activity.map((entry) => (
                <article key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-sky-300 shadow-lg shadow-sky-300/40" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {entry.label}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-zinc-400">
                      {entry.detail}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {timeLabel(entry.createdAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <InfoPanel title="Contact info">
            <InfoRow label="Phone" value={lead.phone} />
            <InfoRow label="Email" value={lead.email} />
            <InfoRow label="Source" value={lead.source} />
          </InfoPanel>

          <InfoPanel title="Lead workflow">
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Status</span>
              <select
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition focus:border-sky-300/70"
                value={lead.status}
                onChange={(event) =>
                  updateLeadStatus(lead.id, event.target.value as Lead["status"])
                }
              >
                {[...salesPipelineStatuses, ...lostLeadStatuses].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            {lead.status === "Quote Approved" && (
              <p className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] p-3 text-sm leading-5 text-emerald-100">
                This lead is now available in Active Projects with initial
                payment status.
              </p>
            )}
            {["Phone Appointment Set", "In-Person Appointment Set"].includes(
              lead.status,
            ) && (
              <div className="mt-4 rounded-lg border border-sky-300/20 bg-sky-300/[0.06] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Appointment date and time
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">
                      Date
                    </span>
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-sky-300/70"
                      type="date"
                      value={appointmentDate || lead.appointment.date}
                      onChange={(event) => setAppointmentDate(event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">
                      Time
                    </span>
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-sky-300/70"
                      placeholder="2:30 PM"
                      type="text"
                      value={appointmentTime || lead.appointment.time}
                      onChange={(event) => setAppointmentTime(event.target.value)}
                    />
                  </label>
                </div>
                <button
                  className="mt-3 h-10 w-full rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950"
                  type="button"
                  onClick={saveAppointment}
                >
                  Save appointment
                </button>
              </div>
            )}
          </InfoPanel>

          {user?.role === "admin" && (
            <InfoPanel title="Assignment">
              <label className="block">
                <span className="text-sm font-medium text-zinc-300">
                  Assigned rep
                </span>
                <select
                  className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition focus:border-sky-300/70"
                  value={lead.assignedRep}
                  onChange={(event) =>
                    updateAssignedRep(lead.id, event.target.value)
                  }
                >
                  <option value="Unassigned">Unassigned</option>
                  {users.map((workspaceUser) => (
                    <option key={workspaceUser.id} value={workspaceUser.name}>
                      {workspaceUser.name}
                    </option>
                  ))}
                </select>
              </label>
            </InfoPanel>
          )}

          <InfoPanel title="Project info">
            <p className="text-sm leading-6 text-zinc-300">{lead.projectInfo}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DetailStat label="Value" value={lead.budget} />
              <DetailStat label="Close odds" value={`${lead.probability}%`} />
            </div>
          </InfoPanel>

          <InfoPanel title="Appointment">
            <InfoRow label="Type" value={lead.appointment.type} />
            <InfoRow label="Date" value={dateLabel(lead.appointment.date)} />
            <InfoRow label="Time" value={lead.appointment.time} />
            <p className="mt-3 rounded-lg bg-black/20 p-3 text-sm leading-5 text-zinc-400">
              {lead.appointment.notes}
            </p>
          </InfoPanel>

          <InfoPanel title="AI summary">
            <div className="rounded-lg border border-dashed border-sky-300/25 bg-sky-300/[0.05] p-4">
              {!aiSummary ? (
                <div>
                  <p className="text-sm leading-6 text-zinc-300">
                    Generate a mock AI summary from this lead&apos;s calls,
                    texts, emails, notes, and follow-up activity. Nothing is
                    changed without rep approval.
                  </p>
                  <button
                    className="mt-4 h-11 w-full rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                    type="button"
                    disabled={isGeneratingSummary}
                    onClick={generateSummary}
                  >
                    {isGeneratingSummary ? "Generating..." : "Generate summary"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AiSummaryRow
                    label="Current situation"
                    value={aiSummary.currentSituation}
                  />
                  <AiSummaryRow
                    label="Lead temperature"
                    value={aiSummary.leadTemperature}
                  />
                  <AiSummaryRow
                    label="Last conversation"
                    value={aiSummary.lastConversationSummary}
                  />
                  <AiSummaryRow
                    label="Suggested next step"
                    value={aiSummary.suggestedNextStep}
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Missing information
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {aiSummary.missingInformation.length === 0 ? (
                        <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-100">
                          No obvious gaps
                        </span>
                      ) : (
                        aiSummary.missingInformation.map((item) => (
                          <span
                            key={item}
                            className="rounded-md bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-100"
                          >
                            {item}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                      Suggested update
                    </p>
                    <select
                      className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm font-semibold text-white outline-none transition focus:border-sky-300/70"
                      value={editableSuggestion}
                      onChange={(event) =>
                        setEditableSuggestion(event.target.value)
                      }
                    >
                      {aiSummary.suggestedUpdateOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {suggestionIgnored && (
                      <p className="mt-3 text-xs text-zinc-500">
                        Suggestion ignored. You can still approve a different
                        update.
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        className="h-10 rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-xs font-semibold text-slate-950"
                        type="button"
                        onClick={approveSuggestion}
                      >
                        Approve
                      </button>
                      <button
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.055] text-xs font-semibold text-zinc-200"
                        type="button"
                        onClick={() =>
                          addActivity(lead.id, {
                            type: "ai",
                            label: "AI suggestion edited",
                            detail: `Rep selected: ${editableSuggestion}`,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.035] text-xs font-semibold text-zinc-400"
                        type="button"
                        onClick={() => {
                          setSuggestionIgnored(true);
                          addActivity(lead.id, {
                            type: "ai",
                            label: "AI suggestion ignored",
                            detail: aiSummary.suggestedStatusUpdate,
                          });
                        }}
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </InfoPanel>

          <InfoPanel title="Notes">
            <p className="text-sm leading-6 text-zinc-400">{lead.notes}</p>
          </InfoPanel>

          {user?.role === "admin" && (
            <section className="rounded-lg border border-rose-300/20 bg-rose-400/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
              <h2 className="font-semibold text-rose-100">Archive lead</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Hide this lead from active dashboard, pipeline, and follow-up
                views while preserving the local activity history.
              </p>
              <button
                className="mt-4 h-11 w-full rounded-lg border border-rose-300/40 bg-rose-400/15 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/25"
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    `Archive ${lead.name} from active CRM views?`,
                  );

                  if (!confirmed) {
                    return;
                  }

                  archiveLead(lead.id);
                  router.push("/");
                }}
              >
                Archive lead
              </button>
            </section>
          )}
        </aside>
      </section>
    </AppShell>
  );
}

function AiSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoPanel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <h2 className="font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}
