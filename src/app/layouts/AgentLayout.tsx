import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { pageTransition } from "@/utils/motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Typography } from "@/components/ui/Typography";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSidebarOpen } from "@/store/slices/uiSlice";
import { resolveWorkspaceRole } from "@/utils/auth-role";

type AgentLayoutProps = {
  children?: ReactNode;
};

export function AgentLayout({ children }: AgentLayoutProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const role = resolveWorkspaceRole(user, accessToken) ?? user?.role ?? user?.roles?.[0]?.code ?? "PropertyManager";
  const title =
    location.pathname === "/agent"
      ? "Overview"
      : location.pathname.includes("/listings")
        ? "Properties"
          : location.pathname.includes("/leads")
            ? "Leads"
            : location.pathname.includes("/analytics")
              ? "Analytics"
              : location.pathname.includes("/featured-properties")
                ? "Featured properties"
                : location.pathname.includes("/property-media")
                  ? "Property media"
                  : location.pathname.includes("/roles-permissions")
                    ? "Roles & permissions"
              : location.pathname.includes("/audit-logs")
                  ? "Audit logs"
          : location.pathname.includes("/users") || location.pathname.includes("/team")
              ? "Users"
              : "Workspace";

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
                    {user?.fullName ?? "Property manager"}
                  </Typography>
                </div>
              </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-caption text-[var(--color-text-secondary)]">
                {role}
              </span>
            </div>
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
