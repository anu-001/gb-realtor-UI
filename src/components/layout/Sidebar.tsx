import { Typography } from "@/components/ui/Typography";

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:block">
      <Typography as="p" variant="caption" className="uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
        Navigation
      </Typography>
      <div className="mt-4 space-y-2">
        <div className="rounded-[12px] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-4 py-3 text-sm font-medium text-[var(--color-accent)]">
          Dashboard
        </div>
        <div className="rounded-[12px] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Listings
        </div>
        <div className="rounded-[12px] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Leads
        </div>
      </div>
    </aside>
  );
}
