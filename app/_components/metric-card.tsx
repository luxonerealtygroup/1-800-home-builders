export function MetricCard({
  label,
  value,
  detail,
  tone = "sky",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "sky" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    sky: "from-sky-300/18 to-cyan-300/5 text-sky-200",
    emerald: "from-emerald-300/18 to-teal-300/5 text-emerald-200",
    amber: "from-amber-300/18 to-orange-300/5 text-amber-100",
    violet: "from-violet-300/18 to-sky-300/5 text-violet-100",
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0b1018]/72 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-5">
      <div
        className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${tones[tone]}`}
      />
      <div className="relative">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-white md:text-3xl">
          {value}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p>
      </div>
    </div>
  );
}
