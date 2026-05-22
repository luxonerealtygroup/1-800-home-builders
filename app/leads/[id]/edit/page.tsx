"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "../../../_components/app-shell";
import { useAuth } from "../../../_components/auth-provider";
import { useLeads } from "../../../_components/lead-provider";
import { PageHeader } from "../../../_components/page-header";
import {
  lostLeadStatuses,
  salesPipelineStatuses,
  type Lead,
  type LeadStage,
} from "../../../_lib/crm-data";

type LeadPriority = Lead["priority"];

function formatBudget(value: number) {
  if (!value) {
    return "$0";
  }

  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }

  return `$${value.toLocaleString()}`;
}

function buildProjectInfo({
  address,
  budget,
  city,
  projectType,
  timeline,
}: {
  address: string;
  budget: string;
  city: string;
  projectType: string;
  timeline: string;
}) {
  const location = [address, city].filter(Boolean).join(", ");
  const scope = `${projectType || "ADU"} project with ${timeline || "open"} timeline`;

  return location
    ? `${budget} ${scope} at ${location}.`
    : `${budget} ${scope}.`;
}

function stageFromStatus(status: Lead["status"]): LeadStage {
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

export default function EditLeadPage() {
  const params = useParams<{ id: string }>();
  const { getLead, loading } = useLeads();
  const lead = getLead(params.id);

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 text-sm text-zinc-400">
          Loading lead...
        </div>
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Edit Lead"
          title="Lead not found"
          description="This lead is not available in the local mock CRM."
        />
      </AppShell>
    );
  }

  return (
    <EditLeadForm key={lead.id} lead={lead} />
  );
}

function EditLeadForm({ lead }: { lead: Lead }) {
  const router = useRouter();
  const { user, users } = useAuth();
  const { supabaseError, updateLead } = useLeads();
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email);
  const [address, setAddress] = useState(lead.address);
  const [city, setCity] = useState(lead.city);
  const [projectType, setProjectType] = useState(lead.projectType);
  const [timeline, setTimeline] = useState(lead.timeline);
  const [value, setValue] = useState(lead.value);
  const [priority, setPriority] = useState<LeadPriority>(lead.priority);
  const [status, setStatus] = useState<Lead["status"]>(lead.status);
  const [assignedRep, setAssignedRep] = useState(lead.assignedRep);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    lead.nextFollowUpDate,
  );
  const [source, setSource] = useState(lead.source);
  const [nextStep, setNextStep] = useState(lead.nextStep);
  const [projectInfo, setProjectInfo] = useState(lead.projectInfo);
  const [appointmentDate, setAppointmentDate] = useState(lead.appointment.date);
  const [appointmentTime, setAppointmentTime] = useState(lead.appointment.time);
  const [appointmentType, setAppointmentType] =
    useState<Lead["appointment"]["type"]>(lead.appointment.type);
  const [appointmentNotes, setAppointmentNotes] = useState(
    lead.appointment.notes,
  );
  const [notes, setNotes] = useState(lead.notes);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);
    const budget = formatBudget(value);

    try {
      const updatedLead = await updateLead(lead.id, {
        name,
        phone,
        email,
        address,
        city,
        budget,
        projectType,
        timeline,
        value,
        stage: stageFromStatus(status),
        status,
        priority,
        assignedRep,
        nextFollowUpDate,
        source,
        nextStep,
        projectInfo:
          projectInfo ||
          buildProjectInfo({
            address,
            budget,
            city,
            projectType,
            timeline,
          }),
        appointment: {
          date: appointmentDate || nextFollowUpDate,
          time: appointmentTime || "Not set",
          type: appointmentType,
          notes: appointmentNotes || "Appointment details not set.",
        },
        notes,
      });

      if (updatedLead) {
        router.push(`/leads/${updatedLead.id}`);
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not update lead.",
      );
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Edit Lead"
        title={`Edit ${lead.name}`}
        description="Update contact, project, appointment, and sales workflow details."
      />

      <form
        className="grid gap-5 rounded-lg border border-white/10 bg-[#0b1018]/74 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-6 xl:grid-cols-[1.1fr_0.9fr]"
        onSubmit={handleSubmit}
      >
        {(formError || supabaseError) && (
          <div className="rounded-lg border border-rose-300/30 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100 xl:col-span-2">
            {formError || supabaseError}
          </div>
        )}
        <section>
          <h2 className="text-lg font-semibold text-white">Contact details</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Full name" value={name} onChange={setName} required />
            <Field label="Phone" value={phone} onChange={setPhone} required />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />
            <Field label="City" value={city} onChange={setCity} required />
            <Field
              label="Property address"
              value={address}
              onChange={setAddress}
              className="md:col-span-2"
            />
            <Field
              label="Project type"
              value={projectType}
              onChange={setProjectType}
              required
            />
            <Field label="Timeline" value={timeline} onChange={setTimeline} />
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-zinc-300">Notes</span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </section>

        <section className="rounded-lg border border-white/10 bg-black/20 p-4">
          <h2 className="text-lg font-semibold text-white">Sales setup</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Estimated project value
              </span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                type="number"
                min="0"
                step="5000"
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Priority"
                value={priority}
                onChange={(value) => setPriority(value as LeadPriority)}
                options={["Hot", "Warm", "Nurture"]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as Lead["status"])}
                options={[...salesPipelineStatuses, ...lostLeadStatuses]}
              />
              {user?.role === "admin" ? (
                <SelectField
                  label="Assigned rep"
                  value={assignedRep}
                  onChange={setAssignedRep}
                  options={[
                    "Unassigned",
                    ...users.map((workspaceUser) => workspaceUser.name),
                  ]}
                />
              ) : (
                <Field
                  label="Assigned rep"
                  value={assignedRep}
                  onChange={setAssignedRep}
                />
              )}
            </div>

            <Field label="Lead source" value={source} onChange={setSource} />
            <Field label="Next step" value={nextStep} onChange={setNextStep} />
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Next follow-up date
              </span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                type="date"
                value={nextFollowUpDate}
                onChange={(event) => setNextFollowUpDate(event.target.value)}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Appointment"
                value={appointmentType}
                onChange={(value) =>
                  setAppointmentType(value as Lead["appointment"]["type"])
                }
                options={[
                  "Phone consult",
                  "Site walk",
                  "Design review",
                  "Proposal review",
                ]}
              />
              <Field
                label="Appointment time"
                value={appointmentTime}
                onChange={setAppointmentTime}
              />
            </div>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Appointment date
              </span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                type="date"
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Appointment notes
              </span>
              <textarea
                className="mt-2 min-h-20 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                value={appointmentNotes}
                onChange={(event) => setAppointmentNotes(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Project info
              </span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                value={projectInfo}
                onChange={(event) => setProjectInfo(event.target.value)}
              />
            </label>
          </div>

          <button
            className="mt-6 h-12 w-full rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </section>
      </form>
    </AppShell>
  );
}

function Field({
  className = "",
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <select
        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition focus:border-sky-300/70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
