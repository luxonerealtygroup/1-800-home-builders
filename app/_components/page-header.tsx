export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300">
          {eyebrow}
        </p>
        <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-white md:text-5xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
