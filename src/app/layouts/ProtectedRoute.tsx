import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

type ProtectedRouteProps = {
  children?: ReactNode;
  roles?: readonly string[];
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

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);

  if (auth.isLoading) {
    return <LoadingState />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
