import React from 'react';

type PageLoadErrorProps = {
  title?: string;
  message?: string;
  onRetry: () => void;
};

export function PageRouteSkeleton() {
  return (
    <div className="route-content-fallback flex flex-col gap-6 pb-16" aria-busy="true" aria-label="Loading page">
      <div className="h-8 w-64 max-w-full rounded-xl bg-[color:var(--sx-control)] animate-pulse" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-40 rounded-2xl bg-[color:var(--sx-control)] animate-pulse lg:col-span-8" />
        <div className="h-40 rounded-2xl bg-[color:var(--sx-control)] animate-pulse lg:col-span-4" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 rounded-xl bg-[color:var(--sx-control)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function PageLoadError({
  title = 'Could not load this view',
  message = 'The request did not complete. Try again.',
  onRetry,
}: PageLoadErrorProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center pb-16">
      <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-[color:var(--sx-canvas-elevated)] px-6 py-8 text-center shadow-[inset_0_0_0_1px_var(--sx-line)]">
        <h2 className="text-headline-sm font-semibold text-[color:var(--sx-text)]">{title}</h2>
        <p className="text-body-md text-[color:var(--sx-text-subtle)]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="liquid-button mt-2 !justify-center !bg-[color:var(--sx-accent)] !border-transparent !text-[color:var(--sx-accent-contrast)]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
