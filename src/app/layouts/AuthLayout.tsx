import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10 font-body text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1440px] items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ring-1 ring-[var(--color-border)]">
              <span className="font-display text-xl font-semibold text-[var(--color-accent)]">GB</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
