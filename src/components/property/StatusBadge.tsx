import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

type StatusBadgeProps = ComponentPropsWithoutRef<"span"> & {
  status: string;
};

const styles: Record<string, string> = {
  new: "bg-[color-mix(in_srgb,var(--color-accent)_12%,white)] text-[var(--color-accent)]",
  sale: "bg-[color-mix(in_srgb,var(--color-primary)_15%,white)] text-[var(--color-primary-hover)]",
  rent: "bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]",
  "short let": "bg-[color-mix(in_srgb,var(--color-accent)_12%,white)] text-[var(--color-accent)]",
  "open house": "bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]",
  "price reduced": "bg-[color-mix(in_srgb,var(--color-warning)_15%,white)] text-[var(--color-warning)]",
  sold: "bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-[var(--color-danger)]",
  featured: "bg-[color-mix(in_srgb,var(--color-primary)_15%,white)] text-[var(--color-primary-hover)]",
  published: "bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]",
  "pending review": "bg-[color-mix(in_srgb,var(--color-warning)_15%,white)] text-[var(--color-warning)]",
  draft: "border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]",
  archived: "bg-[var(--color-border)] text-[var(--color-text-secondary)]",
};

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const key = status.trim().toLowerCase();
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-small font-medium", styles[key] ?? styles.draft, className)}
      {...props}
    >
      {status}
    </span>
  );
}
