export function PageHeader({ icon, title, description, extra, eyebrow }) {
  return (
    <div className="mb-6 flex w-full min-w-0 flex-col gap-4 rounded-block border border-d4u-border/80 bg-white/90 p-5 shadow-sm sm:p-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-card border border-d4u-cyan/20 bg-d4u-soft text-lg text-d4u-cyan-hover">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-d4u-text-3">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-d4u-text-1 sm:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-d4u-text-2 sm:text-[15px]">
              {description}
            </p>
          )}
        </div>
      </div>
      {extra && <div className="w-full shrink-0 lg:w-auto">{extra}</div>}
    </div>
  );
}
