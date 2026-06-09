export function PageShell({ children, className = '' }) {
  return (
    <div className={`w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${className}`.trim()}>
      <div className="mx-auto w-full max-w-content min-w-0">
        {children}
      </div>
    </div>
  );
}
