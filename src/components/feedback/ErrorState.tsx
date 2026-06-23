import { AlertTriangle, RotateCcw } from "lucide-react";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-[var(--color-danger)]" aria-hidden="true" />
      <h2 className="mt-4 font-display text-h4 text-[var(--color-text-primary)]">Something went wrong</h2>
      <p className="mt-2 max-w-md text-body text-[var(--color-text-secondary)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
