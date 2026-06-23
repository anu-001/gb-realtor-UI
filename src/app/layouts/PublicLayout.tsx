import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
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
      <footer className="border-t border-[var(--color-border)] py-6">
        <div className="app-container text-sm text-[var(--color-text-secondary)]">
          GB &amp; Associates Estate Surveyor
        </div>
      </footer>
    </div>
  );
}
