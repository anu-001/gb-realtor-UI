import type { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { pageTransition } from "@/utils/motion";
import { TopNav } from "@/components/layout/TopNav";

type PublicLayoutProps = {
  children?: ReactNode;
};

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <TopNav />
      <motion.main id="main-content" {...pageTransition} className="app-container py-8">
        {children ?? <Outlet />}
      </motion.main>
      <footer className="border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,var(--color-bg))] py-8">
        <div className="app-container space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <img src="/niesv_seal.png" alt="NIESV registered seal" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-display text-h4 text-[var(--color-text-primary)]">GB &amp; Associates</p>
                  <p className="text-small font-medium uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                    NIESV registered
                  </p>
                </div>
              </div>
              <p className="max-w-xl text-body text-[var(--color-text-secondary)]">
                Over 20 years of trusted property guidance.
              </p>
              <a
                href="mailto:hello@gbrealty.com"
                className="inline-flex text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              >
                hello@gbrealty.com
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium md:justify-end">
              <Link to="/search" className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
                Listings
              </Link>
              <Link to="/request-property" className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
                Request property
              </Link>
              <a href="mailto:hello@gbrealty.com" className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
                Contact
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 text-small text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
            <p>All rights reserved.</p>
            <p>Built for clean discovery, direct enquiries, and a premium visitor experience.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
