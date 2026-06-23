import { useState } from "react";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, assignUserRoles, deactivateUser, listRolesPermissions, listUsers } from "@/services/users.service";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { StatCard } from "@/components/data-display/StatCard";
import { Users, UserPlus } from "lucide-react";

export default function TeamManagementPage() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRoleCode, setInviteRoleCode] = useState("");

  const usersQuery = useQuery({
    queryKey: ["team-users"],
    queryFn: () => listUsers({ limit: 100 }),
    staleTime: 120_000,
    retry: 1,
  });

  const rolesQuery = useQuery({
    queryKey: ["roles-permissions"],
    queryFn: () => listRolesPermissions(),
    staleTime: 300_000,
  });

  useEffect(() => {
    if (!inviteRoleCode && rolesQuery.data?.[0]?.code) {
      setInviteRoleCode(rolesQuery.data[0].code);
    }
  }, [inviteRoleCode, rolesQuery.data]);

  const createMutation = useMutation({
    mutationFn: () =>
      createUser({
        email: inviteEmail,
        fullName: inviteName,
        password: "TempPass123!",
        roleCodes: inviteRoleCode ? [inviteRoleCode] : [],
      }),
    onSuccess: async () => {
      setInviteEmail("");
      setInviteName("");
      await queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, roleCodes }: { id: string; roleCodes: string[] }) => assignUserRoles(id, roleCodes),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
  });

  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.meta?.total ?? users.length;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="space-y-2">
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Users</p>
          <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Manage people and access with care.</h1>
          <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
            Invite employees, adjust roles, and deactivate accounts without losing the clarity of the interface.
          </p>
        </div>
      </section>

      <StatCard label="Team members" value={String(total)} icon={Users} description="Active user records in the system." />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
          <div className="border-b border-[var(--color-border)] px-4 py-4">
          <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Users</h2>
          </div>
          {usersQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonLoader key={index} height="72px" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState heading="No team members" message="Invite a teammate to start building the workspace." />
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {users.map((user) => (
                <div key={user.id} className="grid gap-4 px-4 py-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{user.fullName}</p>
                    <p className="text-caption text-[var(--color-text-secondary)]">{user.email}</p>
                  </div>
                  <label className="space-y-2">
                    <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Role</span>
                    <select
                      defaultValue={user.roles?.[0]?.code ?? rolesQuery.data?.[0]?.code ?? ""}
                      onChange={(event) => {
                        void roleMutation.mutateAsync({ id: user.id, roleCodes: [event.target.value] });
                      }}
                      className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
                    >
                      {(rolesQuery.data ?? []).map((role) => (
                        <option key={role.code} value={role.code}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {user.isActive ? "Active" : "Inactive"}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Deactivate this account?")) {
                        void deactivateMutation.mutateAsync(user.id);
                      }
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                  >
                    Deactivate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
          <div>
            <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Invite employee</h2>
            <p className="text-caption text-[var(--color-text-secondary)]">Create a new account and assign the starting role.</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Name</span>
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              className="h-11 w-full rounded-input border border-[var(--color-border)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="Jane Doe"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Email</span>
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="h-11 w-full rounded-input border border-[var(--color-border)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="jane@example.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Role</span>
            <select
              value={inviteRoleCode}
              onChange={(event) => setInviteRoleCode(event.target.value)}
              className="h-11 w-full rounded-input border border-[var(--color-border)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
            >
              {(rolesQuery.data ?? []).map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void createMutation.mutateAsync()}
            disabled={!inviteEmail || !inviteName || !inviteRoleCode || createMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            <UserPlus className="h-4 w-4" />
            {createMutation.isPending ? "Inviting..." : "Invite employee"}
          </button>
        </section>
      </section>
    </div>
  );
}
