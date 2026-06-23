import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
};

export function StatCard({ label, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">{label}</p>
          <p className="font-display text-h3 text-[var(--color-text-primary)]">{value}</p>
          {description ? <p className="text-caption text-[var(--color-text-secondary)]">{description}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-accent)_10%,white)] text-[var(--color-accent)]">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      {trend ? <p className="mt-4 text-caption text-[var(--color-text-secondary)]">{trend}</p> : null}
    </div>
  );
}
