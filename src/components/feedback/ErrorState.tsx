import { AlertTriangle, RotateCcw } from "lucide-react";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-modal border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_96%,white)_0%,var(--color-surface)_100%)] px-6 py-12 text-center shadow-card">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))] text-[var(--color-danger)]">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-h4 text-[var(--color-text-primary)]">Something went wrong</h2>
      <p className="mt-2 max-w-md text-body text-[var(--color-text-secondary)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 ui-button-primary"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
