const shellWidthBySize = {
  narrow: 'max-w-[980px]',
  standard: 'max-w-[1120px]',
  wide: 'max-w-content'
};

const shellGapByDensity = {
  compact: 'gap-4 sm:gap-5',
  standard: 'gap-5 sm:gap-6',
  relaxed: 'gap-6 sm:gap-7'
};

function joinClasses(...values) {
  return values.filter(Boolean).join(' ');
}

export function PageShell({ children, size = 'standard', density = 'standard', className = '' }) {
  return (
    <div
      className={joinClasses(
        'mx-auto grid w-full',
        shellWidthBySize[size] || shellWidthBySize.standard,
        shellGapByDensity[density] || shellGapByDensity.standard,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DataPanel({
  title,
  description,
  extra,
  header,
  children,
  className = '',
  contentClassName = '',
  headerClassName = '',
  flush = false
}) {
  return (
    <section
      className={joinClasses(
        'overflow-hidden rounded-panel border border-d4u-border/80 bg-white/92 shadow-soft backdrop-blur',
        className
      )}
    >
      {(header || title || description || extra) ? (
        <div
          className={joinClasses(
            'flex flex-col gap-3 border-b border-d4u-border/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6',
            headerClassName
          )}
        >
          {header || (
            <>
              <div className="grid min-w-0 gap-1">
                {title ? <strong className="text-base font-semibold leading-tight text-d4u-text-1">{title}</strong> : null}
                {description ? <p className="max-w-[720px] text-sm leading-6 text-d4u-text-2">{description}</p> : null}
              </div>
              {extra ? <div className="flex shrink-0 flex-wrap items-center gap-2">{extra}</div> : null}
            </>
          )}
        </div>
      ) : null}

      <div className={joinClasses(flush ? 'p-0' : 'p-5 sm:p-6', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
