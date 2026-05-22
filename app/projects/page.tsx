"use client";

import { AppShell } from "../_components/app-shell";
import { useLeads } from "../_components/lead-provider";
import { PageHeader } from "../_components/page-header";
import { ProjectCard } from "../_components/project-card";
import { activeProjectStatuses, projects } from "../_lib/crm-data";

export default function ProjectsPage() {
  const { leads, updateActiveProjectStatus } = useLeads();
  const convertedProjects = leads
    .filter((lead) => lead.status === "Quote Approved" && !lead.isArchived)
    .map((lead) => ({
      id: `lead-project-${lead.id}`,
      name: lead.name,
      phase: lead.activeProjectStatus ?? "Initial Payment Received",
      due: lead.nextFollowUpDate || "Next step",
      owner: lead.assignedRep,
      progress: projectProgress(lead.activeProjectStatus),
    }));
  return (
    <AppShell>
      <PageHeader
        eyebrow="Active Projects"
        title="Handoffs after the close"
        description="Keep sales reps aware of design, permit, and pre-construction movement after a deal converts."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {convertedProjects.map((project) => {
          const leadId = project.id.replace("lead-project-", "");

          return (
            <article
              key={project.id}
              className="space-y-3"
            >
              <ProjectCard project={project} />
              <label className="block rounded-lg border border-emerald-300/20 bg-emerald-300/[0.055] p-3">
                <span className="text-sm font-medium text-zinc-300">
                  Active project status
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-sky-300/70"
                  value={project.phase}
                  onChange={(event) =>
                    updateActiveProjectStatus(
                      leadId,
                      event.target.value as (typeof activeProjectStatuses)[number],
                    )
                  }
                >
                  {activeProjectStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          );
        })}
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Sales to build
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              Upcoming handoffs
            </h2>
          </div>
          <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-300">
            {convertedProjects.length} converted
          </span>
        </div>
        <div className="mt-4 divide-y divide-white/10">
          {(convertedProjects.length > 0
            ? convertedProjects.map(
                (project) => `Confirm project handoff for ${project.name}`,
              )
            : [
                "Approve a quote to automatically create an active project.",
                "Converted leads will appear here with payment status.",
                "Sales can keep visibility after handoff.",
              ]
          ).map((task) => (
            <div key={task} className="flex items-center gap-3 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
              <p className="text-sm text-zinc-300">{task}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function projectProgress(status: string | undefined) {
  if (status === "Completed") {
    return 100;
  }

  if (status === "Final Payment Received") {
    return 92;
  }

  if (status === "Second Payment Received") {
    return 66;
  }

  if (status === "In Progress") {
    return 42;
  }

  return 18;
}
