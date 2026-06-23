import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { UserRole } from "@/constants/api-enums";
import { EmptyState } from "@/components/feedback/EmptyState";
import { resolveAgentRole } from "@/utils/agent-access";

type ProtectedRouteProps = {
  children?: ReactNode;
  requiredRole?: string;
  allowedRoles?: UserRole[];
};

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        aria-label="Loading"
        className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"
      />
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);
  const resolvedRole = resolveAgentRole(auth.user?.role ?? auth.user?.roles?.[0]?.code ?? null);

  if (auth.isInitializing) {
    return <LoadingState />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && resolvedRole !== requiredRole) {
    return (
      <div className="app-container py-10">
        <EmptyState
          heading="Access denied"
          message="You do not have permission to view this page."
          action={
            <Link
              to="/agent"
              replace
              className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
            >
              Go to workspace
            </Link>
          }
        />
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && (!resolvedRole || !allowedRoles.includes(resolvedRole as UserRole))) {
    return (
      <div className="app-container py-10">
        <EmptyState
          heading="Access denied"
          message="You do not have permission to view this page."
          action={
            <Link
              to="/agent"
              replace
              className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
            >
              Go to workspace
            </Link>
          }
        />
      </div>
    );
  }

  return children ?? <Outlet />;
}
