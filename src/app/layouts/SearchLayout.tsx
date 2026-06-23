import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { pageTransition } from "@/utils/motion";
import { TopNav } from "@/components/layout/TopNav";

type SearchLayoutProps = {
  children?: ReactNode;
};

export function SearchLayout({ children }: SearchLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <TopNav />
      <motion.main
        id="main-content"
        {...pageTransition}
        className="app-container flex min-h-[calc(100vh-4rem)] flex-col py-8"
      >
        {children ?? <Outlet />}
      </motion.main>
    </div>
  );
}
