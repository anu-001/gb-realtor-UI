import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { pageTransition } from "@/utils/motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Typography } from "@/components/ui/Typography";

type DashboardLayoutProps = {
  children?: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-6 py-4 backdrop-blur-xl">
            <Typography as="p" variant="body" className="font-semibold">
              Dashboard
            </Typography>
          </header>
          <motion.main id="main-content" {...pageTransition} className="app-container flex-1 py-8">
            {children ?? <Outlet />}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
