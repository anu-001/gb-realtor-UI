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
      <TopNav />
      <motion.main id="main-content" {...pageTransition} className="app-container py-8">
        {children ?? <Outlet />}
      </motion.main>
      <footer className="border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_85%,var(--color-bg))] py-8">
        <div className="app-container flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-display text-h4 text-[var(--color-text-primary)]">Need help finding the right property?</p>
            <p className="max-w-xl text-body text-[var(--color-text-secondary)]">
              Browse listings, or send a concise request and we’ll follow up with something relevant.
            </p>
            <a
              href="mailto:hello@gbrealty.com"
              className="inline-flex text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
            >
              hello@gbrealty.com
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link to="/search" className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
              Listings
            </Link>
            <Link to="/request-property" className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
              Request property
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
