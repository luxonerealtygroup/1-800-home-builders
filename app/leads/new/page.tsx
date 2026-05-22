"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../_components/app-shell";
import { useAuth } from "../../_components/auth-provider";
import { useLeads } from "../../_components/lead-provider";
import { PageHeader } from "../../_components/page-header";
import {
  lostLeadStatuses,
  salesPipelineStatuses,
  type LeadStage,
  type Lead,
} from "../../_lib/crm-data";

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

export default function NewLeadPage() {
  const router = useRouter();
  const { user, users } = useAuth();
  const { addLead } = useLeads();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [projectType, setProjectType] = useState("Detached ADU");
  const [timeline, setTimeline] = useState("");
  const [value, setValue] = useState(100000);
  const [priority, setPriority] = useState<LeadPriority>("Warm");
  const [status, setStatus] = useState<Lead["status"]>("New Lead");
  const [assignedRep, setAssignedRep] = useState(
    user?.role === "sales_rep" ? user.name : "Unassigned",
  );
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [source, setSource] = useState("Manual entry");
  const [nextStep, setNextStep] = useState("Call to qualify ADU goals");
  const [projectInfo, setProjectInfo] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentType, setAppointmentType] =
    useState<Lead["appointment"]["type"]>("Phone consult");
  const [notes, setNotes] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const budget = formatBudget(value);
    const lead = addLead({
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
        notes: "Appointment details captured from manual lead entry.",
      },
      notes: notes || "Manually added lead. Add discovery notes after contact.",
    });

    router.push(`/leads/${lead.id}`);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Manual Entry"
        title="Add a new lead"
        description="Capture a homeowner inquiry fast, then move them through the ADU sales pipeline."
      />

      <form
        className="grid gap-5 rounded-lg border border-white/10 bg-[#0b1018]/74 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-6 xl:grid-cols-[1.1fr_0.9fr]"
        onSubmit={handleSubmit}
      >
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

          <div className="mt-5">
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Notes</span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="ADU goals, timeline, financing questions, decision makers..."
              />
            </label>
          </div>
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
              <SelectField
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as Lead["status"])}
                options={[...salesPipelineStatuses, ...lostLeadStatuses]}
              />
            </div>

            <Field label="Lead source" value={source} onChange={setSource} />
            <Field label="Next step" value={nextStep} onChange={setNextStep} />
            {user?.role === "admin" ? (
              <SelectField
                label="Assigned rep"
                value={assignedRep}
                onChange={setAssignedRep}
                options={[
                  "Unassigned",
                  ...users
                    .map((workspaceUser) => workspaceUser.name),
                ]}
              />
            ) : (
              <Field
                label="Assigned rep"
                value={assignedRep}
                onChange={setAssignedRep}
              />
            )}
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
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                  Appointment time
                </span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                  type="text"
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  placeholder="2:30 PM"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Project info
              </span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
                value={projectInfo}
                onChange={(event) => setProjectInfo(event.target.value)}
                placeholder="Detached ADU, garage conversion, rental income goals..."
              />
            </label>
          </div>

          <div className="mt-6 rounded-lg border border-sky-300/15 bg-sky-300/[0.06] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Preview
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatBudget(value)}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {priority} lead entering {status.toLowerCase()} status.
            </p>
          </div>

          <button
            className="mt-6 h-12 w-full rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
            type="submit"
          >
            Save lead
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
