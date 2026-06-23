import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { pageTransition } from "@/utils/motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Typography } from "@/components/ui/Typography";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSidebarOpen } from "@/store/slices/uiSlice";

type DashboardLayoutProps = {
  children?: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const title = location.pathname === "/dashboard" ? "Dashboard" : "Dashboard";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setSidebarOpen(true))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)] lg:hidden"
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <Typography as="p" variant="body" className="font-semibold">
                    {title}
                  </Typography>
                  <Typography as="p" variant="caption" className="text-[var(--color-text-secondary)]">
                    {user?.fullName ?? "Signed in user"}
                  </Typography>
                </div>
              </div>
              <Typography as="p" variant="caption" className="hidden rounded-full border border-[var(--color-border)] px-3 py-1 text-[var(--color-text-secondary)] md:block">
                User dashboard
              </Typography>
            </div>
          </header>
          <motion.main id="main-content" {...pageTransition} className="app-container flex-1 py-8">
            {children ?? <Outlet />}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
