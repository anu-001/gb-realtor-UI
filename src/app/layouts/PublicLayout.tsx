import type { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { pageTransition } from "@/utils/motion";
import { TopNav } from "@/components/layout/TopNav";
import { BrandMark } from "@/components/layout/BrandMark";

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
      <footer className="border-t border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_90%,var(--color-bg))_0%,var(--color-bg)_100%)] py-8">
        <div className="app-container space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <BrandMark compact />
              <p className="max-w-lg text-body text-[var(--color-text-secondary)]">
                Over 20 years of steady, trusted property guidance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
              <Link to="/search" className="ui-chip">
                Listings
              </Link>
              <Link to="/request-property" className="ui-chip">
                Request property
              </Link>
              <a href="mailto:hello@gbrealty.com" className="ui-chip">
                Contact
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-5 text-small text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
            <p>All rights reserved.</p>
            <p>Premium property discovery, direct enquiry, and clear follow-up.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
