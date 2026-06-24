import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: LucideIcon | null;
  heading: string;
  message: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  illustration?: ReactNode;
};

export function EmptyState({ icon: Icon, heading, message, action, secondaryAction, illustration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-modal border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_97%,white)_0%,var(--color-surface)_100%)] px-6 py-12 text-center shadow-card md:px-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))] shadow-[0_8px_24px_rgba(37,99,235,0.08)]">
        {illustration ?? (
          Icon && <Icon className="h-8 w-8 text-[var(--color-accent)]" aria-hidden="true" />
        )}
      </div>
      <h2 className="mt-5 font-display text-h4 text-[var(--color-text-primary)]">{heading}</h2>
      <p className="mt-3 max-w-lg text-body text-[var(--color-text-secondary)]">{message}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {action}
        {secondaryAction}
      </div>
    </div>
  );
}
