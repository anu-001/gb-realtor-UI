import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  heading: string;
  message: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, heading, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
      <Icon className="h-10 w-10 text-[var(--color-text-secondary)]" aria-hidden="true" />
      <h2 className="mt-4 font-display text-h4 text-[var(--color-text-primary)]">{heading}</h2>
      <p className="mt-2 max-w-md text-body text-[var(--color-text-secondary)]">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
