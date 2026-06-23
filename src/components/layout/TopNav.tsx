import { Menu, Search, Sparkles } from "lucide-react";
import { Typography } from "@/components/ui/Typography";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/80 bg-[color-mix(in_srgb,var(--color-surface)_90%,transparent)] backdrop-blur-xl">
      <div className="app-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[var(--color-accent)] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <Typography as="p" variant="body" className="font-semibold leading-none">
              GB &amp; Associates
            </Typography>
            <Typography as="p" variant="small" className="text-[var(--color-text-secondary)]">
              Estate Surveyor
            </Typography>
          </div>
        </div>

        <label className="hidden min-w-[320px] max-w-[520px] flex-1 items-center gap-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 md:flex">
          <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <span className="text-sm text-[var(--color-text-secondary)]">Search location or property</span>
        </label>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
