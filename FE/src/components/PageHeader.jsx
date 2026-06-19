function joinClasses(...values) {
  return values.filter(Boolean).join(' ');
}

export function PageHeader({ icon, title, description, extra, eyebrow }) {
  return (
    <header className="flex w-full min-w-0 flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-card border border-d4u-cyan/20 bg-d4u-soft text-[22px] text-d4u-cyan shadow-sm sm:inline-flex">
            {icon}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-1.5">
          {eyebrow ? (
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-d4u-text-3">
              {eyebrow}
            </span>
          ) : null}
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-d4u-cyan/20 bg-d4u-soft text-[20px] text-d4u-cyan shadow-sm sm:hidden">
                {icon}
              </div>
            ) : null}
            <div className="grid min-w-0 gap-1.5">
              <h1 className="max-w-[760px] text-[25px] font-semibold leading-tight tracking-tight text-d4u-teal-deep sm:text-[29px]">
                {title}
              </h1>
              {description ? (
                <p className="max-w-[760px] text-sm leading-6 text-d4u-text-2 sm:text-[15px]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {extra ? (
        <div className={joinClasses('flex w-full flex-wrap items-center gap-2 sm:justify-end lg:w-auto lg:shrink-0')}>
          {extra}
        </div>
      ) : null}
    </header>
  );
}
