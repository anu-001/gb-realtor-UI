import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutUser } from "@/store/authSlice";
import { closeModal, setSidebarOpen } from "@/store/slices/uiSlice";
import { UserRole } from "@/constants/api-enums";
import { cn } from "@/utils/cn";
import { BrandMark } from "@/components/layout/BrandMark";
import { resolveAgentRole } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
  exact?: boolean;
};

const navigation: NavItem[] = [
  { label: "Dashboard", to: "/agent", icon: LayoutDashboard, exact: true, roles: [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.Analyst] },
  { label: "Properties", to: "/agent/listings", icon: Building2, roles: [UserRole.SupportAgent, UserRole.PropertyManager, UserRole.ContentEditor, UserRole.Analyst, UserRole.SuperAdmin] },
  { label: "Leads", to: "/agent/leads", icon: Bell, roles: [UserRole.SupportAgent, UserRole.PropertyManager, UserRole.Analyst, UserRole.SuperAdmin] },
  { label: "Analytics", to: "/agent/analytics", icon: BarChart3, roles: [UserRole.Analyst, UserRole.SuperAdmin] },
  { label: "Featured Properties", to: "/agent/featured-properties", icon: Building2, roles: [UserRole.PropertyManager, UserRole.ContentEditor, UserRole.SuperAdmin] },
  { label: "Property Media", to: "/agent/property-media", icon: ImagePlus, roles: [UserRole.PropertyManager, UserRole.ContentEditor, UserRole.SuperAdmin] },
  { label: "Users", to: "/agent/users", icon: Users, roles: [UserRole.SuperAdmin] },
  { label: "Roles & Permissions", to: "/agent/roles-permissions", icon: ScrollText, roles: [UserRole.SuperAdmin] },
  { label: "Audit Logs", to: "/agent/audit-logs", icon: ScrollText, roles: [UserRole.SuperAdmin] },
];

function getInitials(name?: string | null): string {
  if (!name) return "GA";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const role =
    resolveWorkspaceRole(user, accessToken) ??
    resolveAgentRole(user?.role ?? user?.roles?.[0]?.code ?? UserRole.PropertyManager) ??
    UserRole.PropertyManager;
  const items = useMemo(
    () => navigation.filter((item) => !item.roles || item.roles.includes(role as UserRole)),
    [role],
  );

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(closeModal());
    dispatch(setSidebarOpen(false));
    navigate("/login", { replace: true });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <BrandMark compact />
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-label="Close navigation"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-accent)_12%,white)] text-sm font-semibold text-[var(--color-accent)]">
            {getInitials(user?.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{user?.fullName ?? "Workspace User"}</p>
            <p className="truncate text-caption text-[var(--color-text-secondary)]">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => dispatch(setSidebarOpen(false))}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium transition",
                  isActive
                    ? "border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))] text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[14px] border border-[var(--color-border)] px-3 py-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
              onClick={() => dispatch(setSidebarOpen(false))}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-0 top-0 z-50 h-full w-[min(88vw,20rem)] border-r border-[var(--color-border)] bg-[var(--color-bg)] shadow-modal lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}
