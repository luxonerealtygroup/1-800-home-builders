import type { Project } from "../_lib/crm-data";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">{project.name}</h3>
          <p className="mt-1 text-sm text-zinc-400">{project.phase}</p>
        </div>
        <span className="rounded-md border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-xs font-semibold text-sky-100">
          {project.due}
        </span>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{project.owner}</span>
          <span className="font-semibold text-zinc-200">{project.progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}
