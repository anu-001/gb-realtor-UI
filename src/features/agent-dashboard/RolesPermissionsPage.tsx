import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShieldCheck, Users } from "lucide-react";
import { listRolesPermissions } from "@/services/users.service";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";

export default function RolesPermissionsPage() {
  const rolesQuery = useQuery({
    queryKey: ["roles-permissions"],
    queryFn: () => listRolesPermissions(),
    staleTime: 300_000,
    retry: 1,
  });

  const roles = rolesQuery.data ?? [];

  if (rolesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader height="200px" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} height="180px" />
          ))}
        </div>
      </div>
    );
  }

  if (rolesQuery.isError) {
    return (
      <EmptyState
        heading="Roles unavailable"
        message="We could not load the role catalog right now."
        action={
          <button
            type="button"
            onClick={() => void rolesQuery.refetch()}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Roles & permissions</p>
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Keep access precise and easy to scan.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
              Review the backend role catalog and the permissions attached to each internal role.
            </p>
          </div>
          <Link
            to="/agent/users"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <article key={role.id} className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Role</p>
                <h2 className="font-display text-h4 text-[var(--color-text-primary)]">{role.name}</h2>
              </div>
              <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-caption text-[var(--color-text-secondary)]">
                {role.code}
              </span>
            </div>

            <p className="mt-3 text-caption text-[var(--color-text-secondary)]">
              {typeof (role.description as unknown) === "string" && String(role.description).trim().length > 0
                ? String(role.description)
                : "No description available."}
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-caption font-medium text-[var(--color-text-secondary)]">
                <ShieldCheck className="h-4 w-4" />
                {role.permissions.length} permissions
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 6).map((permission) => (
                  <span
                    key={permission.code}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1 text-small text-[var(--color-text-secondary)]"
                  >
                    {permission.code}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
