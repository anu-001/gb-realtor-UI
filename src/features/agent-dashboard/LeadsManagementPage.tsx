import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Search, Phone } from "lucide-react";
import { assignLead, listLeads } from "@/services/leads.service";
import { listUsers } from "@/services/users.service";
import { LeadDetailDrawer } from "./components/LeadDetailDrawer";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { StatusBadge } from "@/components/property/StatusBadge";
import { Select } from "@/components/ui/Select";
import { useAppSelector } from "@/store";
import { canManageLeadActions, canViewLeads, resolveAgentRole } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";

type LeadFilters = {
  status: string;
  search: string;
  assignee: string;
};

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export default function LeadsManagementPage() {
  const queryClient = useQueryClient();
  const auth = useAppSelector((state) => state.auth);
  const role = resolveWorkspaceRole(auth.user, auth.accessToken) ?? resolveAgentRole(auth.user?.role ?? auth.user?.roles?.[0]?.code ?? null);
  const canView = canViewLeads(role);
  const canManage = canManageLeadActions(role);
  const [filters, setFilters] = useState<LeadFilters>({ status: "", search: "", assignee: "" });
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const leadsQuery = useQuery({
    queryKey: ["agent-leads", filters.status, debouncedSearch, filters.assignee],
    queryFn: () =>
      listLeads({
        status: filters.status || undefined,
        search: debouncedSearch || undefined,
        assigneeId: filters.assignee || undefined,
      }),
    retry: 1,
    enabled: canView,
    placeholderData: (previous) => previous,
  });

  const agentsQuery = useQuery({
    queryKey: ["lead-assignees"],
    queryFn: () => listUsers({ active: true, limit: 100 }),
    staleTime: 120_000,
    enabled: canView && canManage,
  });

  const assignMutation = useMutation({
    mutationFn: ({ leadId, assigneeId }: { leadId: string; assigneeId: string }) =>
      assignLead(leadId, { assigneeId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agent-leads"] });
    },
  });

  const leads = leadsQuery.data?.data ?? [];
  const leadsMeta = leadsQuery.data?.meta as { total?: number } | undefined;
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const agents = agentsQuery.data?.data ?? [];

  if (!canView) {
    return (
      <EmptyState
        heading="Access denied"
        message="Your role does not allow viewing the leads inbox."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="space-y-2">
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Lead inbox</p>
          <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Track enquiries, cleanly.</h1>
          <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
            Assign owners and keep follow-ups moving.
          </p>
        </div>
      </section>

      <section className="grid gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card md:grid-cols-3">
        <label className="space-y-2 md:col-span-2">
          <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Search</span>
          <div className="flex h-11 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
            <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search lead name, email, phone"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Status</span>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
          >
            <option value="">Any</option>
            {["new", "contacted", "qualified", "converted", "closed", "spam"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
        <div className="border-b border-[var(--color-border)] px-4 py-4">
          <p className="text-caption text-[var(--color-text-secondary)]">
            {leadsQuery.isLoading ? "Loading leads..." : `${leadsMeta?.total ?? leads.length} leads found`}
          </p>
        </div>

        {leadsQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} height="72px" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Mail}
            heading="No leads found"
            message="There are no leads matching the current filters."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[920px] divide-y divide-[var(--color-border)]">
              <thead className="bg-[color-mix(in_srgb,var(--color-surface)_96%,white)]">
                <tr className="text-left text-small uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                  <th scope="col" className="px-6 py-4">Lead</th>
                  <th scope="col" className="px-6 py-4">Interest</th>
                  <th scope="col" className="px-6 py-4">Assignee</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="align-top transition-colors duration-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => setSelectedLeadId(lead.id)} className="block max-w-sm text-left">
                        <span className="block font-medium text-[var(--color-text-primary)]">{lead.fullName}</span>
                        <span className="mt-1 flex flex-wrap gap-3 text-caption text-[var(--color-text-secondary)]">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.phoneNumber || "No phone"}
                          </span>
                          {lead.email ? (
                            <span className="inline-flex min-w-0 max-w-[14rem] items-center gap-1 truncate">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </td>
                    <td className="max-w-xs px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                      <span className="line-clamp-2">{lead.propertyInterest ?? "No property interest"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {canManage ? (
                        <Select
                          value={lead.assignee?.id ?? ""}
                          disabled={assignMutation.isPending || agentsQuery.isLoading}
                          onChange={(event) => {
                            if (event.target.value) {
                              void assignMutation.mutateAsync({ leadId: lead.id, assigneeId: event.target.value });
                            }
                          }}
                          aria-label={`Assign ${lead.fullName}`}
                          className="max-w-56"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.fullName}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-sm text-[var(--color-text-secondary)]">{lead.assignee?.fullName ?? "Unassigned"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={lead.status} />
                        <span className="text-caption text-[var(--color-text-secondary)]">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <LeadDetailDrawer
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLeadId(null)}
        readOnly={!canManage}
      />
    </div>
  );
}
