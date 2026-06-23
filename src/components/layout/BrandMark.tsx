import { cn } from "@/utils/cn";

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
};

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <img src="/niesv_seal.png" alt="NIESV seal" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
          GB &amp; Associates
        </span>
        {compact ? (
          <span className="text-small text-[var(--color-text-secondary)]">NIESV recognized</span>
        ) : (
          <span className="text-small text-[var(--color-text-secondary)]">NIESV recognized</span>
        )}
      </div>
    </div>
  );
}
