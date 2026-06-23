import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Compass,
  FolderOpen,
  ImagePlus,
  LayoutDashboard,
  Plus,
  ScrollText,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { getAnalyticsDashboard, getAnalyticsSummary } from "@/services/analytics.service";
import { listAuditLogs } from "@/services/users.service";
import { StatCard } from "@/components/data-display/StatCard";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAppSelector } from "@/store";
import { canCreateListing, canManageTeam, canViewAnalytics, canViewDashboard, canViewLeads, resolveAgentRole } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getActionRows(value: unknown): Array<{ label: string; count: number }> {
  const record = asRecord(value);
  const byAction = record.byAction;

  if (Array.isArray(byAction)) {
    return byAction
      .flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const action = (entry as Record<string, unknown>).action;
        const count = asNumber((entry as Record<string, unknown>).count);
        if (typeof action !== "string" || count === null) return [];
        return [{ label: action.replace(/\./g, " · "), count }];
      })
      .slice(0, 5);
  }

  const total = asNumber(record.total);
  return total === null ? [] : [{ label: "Total events", count: total }];
}

function getPerformanceRows(value: unknown): Array<{ label: string; value: string }> {
  const record = asRecord(value);
  const rows = [
    { key: "activeFeaturedProperties", label: "Active featured" },
    { key: "views", label: "Views" },
    { key: "clicks", label: "Clicks" },
    { key: "clickThroughRate", label: "Click-through rate" },
  ] as const;

  return rows.flatMap(({ key, label }) => {
    const raw = record[key];
    if (raw === undefined || raw === null) return [];
    if (typeof raw === "number") {
      return [{ label, value: key === "clickThroughRate" ? `${raw.toFixed(1)}%` : raw.toLocaleString("en-NG") }];
    }
    return [{ label, value: String(raw) }];
  });
}

function getAuditAction(entry: unknown): string {
  const record = asRecord(entry);
  return (
    (typeof record.action === "string" && record.action) ||
    (typeof record.event === "string" && record.event) ||
    "Activity"
  );
}

function getAuditTimestamp(entry: unknown): string {
  const record = asRecord(entry);
  const value =
    (typeof record.createdAt === "string" && record.createdAt) ||
    (typeof record.timestamp === "string" && record.timestamp) ||
    null;
  return value ? new Date(value).toLocaleString() : "Recent";
}

function getAuditActor(entry: unknown): string {
  const record = asRecord(entry);
  const actor = asRecord(record.actor ?? record.user ?? record.owner);
  return (
    (typeof actor.fullName === "string" && actor.fullName) ||
    (typeof actor.name === "string" && actor.name) ||
    "System"
  );
}

function getAuditTarget(entry: unknown): string | null {
  const record = asRecord(entry);
  const target = asRecord(record.target);
  const candidate = typeof target.name === "string" ? target.name : typeof target.title === "string" ? target.title : null;
  return candidate;
}

export default function AgentOverviewPage() {
  const auth = useAppSelector((state) => state.auth);
  const role = resolveWorkspaceRole(auth.user, auth.accessToken) ?? resolveAgentRole(auth.user?.role ?? auth.user?.roles?.[0]?.code ?? "PropertyManager") ?? "PropertyManager";
  const canViewOverview = canViewDashboard(role);
  const dashboardQuery = useQuery({
    queryKey: ["analytics-dashboard", role],
    queryFn: () => (role === "Analyst" || role === "SuperAdmin" ? getAnalyticsDashboard() : getAnalyticsSummary()),
    staleTime: 300_000,
    retry: 1,
    enabled: canViewOverview,
  });

  const auditQuery = useQuery({
    queryKey: ["agent-audit-logs"],
    queryFn: () => listAuditLogs({ limit: 5 }),
    staleTime: 120_000,
    retry: 1,
  });

  const summary = dashboardQuery.data;
  const activityEntries = getActionRows(summary?.internalActivityLogs);
  const featuredEntries = getPerformanceRows(summary?.featuredPropertyPerformance);
  const auditEntries = auditQuery.data?.data ?? [];
  const canCreate = canCreateListing(role);
  const canViewLeadQueue = canViewLeads(role);
  const canSeeAnalytics = canViewAnalytics(role);
  const canSeeTeam = canManageTeam(role);

  const resources = [
    {
      label: "Listings workspace",
      description: "Create drafts, review assets, and manage publication status.",
      to: "/agent/listings",
      icon: FolderOpen,
      visible: true,
    },
    {
      label: "Lead inbox",
      description: "Triage enquiries, assign owners, and follow up faster.",
      to: "/agent/leads",
      icon: Compass,
      visible: canViewLeadQueue,
    },
    {
      label: "Performance view",
      description: "Track activity, conversion, and featured listing performance.",
      to: "/agent/analytics",
      icon: LayoutDashboard,
      visible: canSeeAnalytics,
    },
    {
      label: "Team access",
      description: "Invite collaborators and manage roles for the workspace.",
      to: "/agent/users",
      icon: Users,
      visible: canSeeTeam,
    },
    {
      label: "Roles & permissions",
      description: "Inspect the access catalog that powers the workspace.",
      to: "/agent/roles-permissions",
      icon: ShieldCheck,
      visible: canSeeTeam,
    },
    {
      label: "Audit logs",
      description: "Review key administrative changes and user actions.",
      to: "/agent/audit-logs",
      icon: ScrollText,
      visible: canSeeTeam,
    },
    {
      label: "Featured properties",
      description: "Manage the listings currently highlighted on the site.",
      to: "/agent/featured-properties",
      icon: Star,
      visible: canSeeAnalytics || canSeeTeam,
    },
    {
      label: "Property media",
      description: "Upload and organise listing photos with a dedicated view.",
      to: "/agent/property-media",
      icon: ImagePlus,
      visible: canSeeAnalytics || canSeeTeam,
    },
    {
      label: "Public search",
      description: "See the visitor-facing catalog exactly as prospects do.",
      to: "/search",
      icon: BookOpen,
      visible: true,
    },
  ].filter((resource) => resource.visible);

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} height="148px" />
          ))}
        </div>
        <SkeletonLoader height="240px" />
      </div>
    );
  }

  if (!canViewOverview) {
    return (
      <EmptyState
        heading="Access denied"
        message="Your role does not include dashboard access."
        action={
          <Link
            to={canViewLeadQueue ? "/agent/leads" : "/agent/listings"}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Go to your workspace
          </Link>
        }
      />
    );
  }

  if (dashboardQuery.isError || !summary) {
    return (
      <EmptyState
        heading="Overview unavailable"
        message="Retry in a moment."
        action={
          <button
            type="button"
            onClick={() => void dashboardQuery.refetch()}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Retry
          </button>
        }
      />
    );
  }

  const statCards = [
    { label: "Active listings", value: String(summary.activeListings ?? summary.properties ?? 0), icon: Building2, description: "Properties actively in circulation." },
    { label: "Published", value: String(summary.publishedProperties ?? 0), icon: Building2, description: "Listings already visible on live surfaces." },
    { label: "Active leads", value: String(summary.leads ?? 0), icon: Bell, description: "Captured requests waiting on a follow-up." },
    { label: "Lead conversion", value: `${Number(summary.leadConversionRate ?? 0).toFixed(1)}%`, icon: Users, description: "Lead-to-opportunity performance." },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-surface)_96%,white)_0%,var(--color-surface)_100%)] p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Property manager dashboard</p>
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Control, without clutter.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
              Track inventory, leads, and featured listings in one view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canCreate ? (
              <Link
                to="/agent/listings/new"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                <Plus className="h-4 w-4" />
                New listing
              </Link>
            ) : null}
            {canViewLeadQueue ? (
              <Link
                to="/agent/leads"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
              >
                View leads
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-6 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-small text-[var(--color-text-secondary)]">Role: {role}</div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Shortcuts</h2>
              <p className="text-caption text-[var(--color-text-secondary)]">Quick links to the core workspace.</p>
            </div>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-caption text-[var(--color-text-secondary)]">
              Workspace links
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <Link
                  key={resource.to}
                  to={resource.to}
                  className="group flex min-h-28 flex-col justify-between rounded-[20px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_96%,white)] p-4 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-border))] hover:bg-[var(--color-surface-raised)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] transition group-hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,white)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--color-text-secondary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="font-medium text-[var(--color-text-primary)]">{resource.label}</p>
                    <p className="text-caption text-[var(--color-text-secondary)]">{resource.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card" aria-busy={dashboardQuery.isFetching}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Recent activity</h2>
              <p className="text-caption text-[var(--color-text-secondary)]">Latest system actions.</p>
            </div>
          </div>
          {activityEntries.length === 0 ? (
            <EmptyState heading="Nothing yet" message="Recent activity will appear here." />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {activityEntries.slice(0, 6).map((item) => (
                <li key={item.label} className="rounded-[18px] border border-[var(--color-border)] p-4">
                  <p className="text-caption text-[var(--color-text-secondary)]">{item.label}</p>
                  <p className="mt-2 font-display text-h4 text-[var(--color-text-primary)]">{item.count}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card" aria-busy={dashboardQuery.isFetching}>
          <div>
            <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Featured performance</h2>
            <p className="text-caption text-[var(--color-text-secondary)]">Featured reach and engagement.</p>
          </div>
          {featuredEntries.length === 0 ? (
            <EmptyState heading="No featured data" message="Metrics appear once listings are featured." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {featuredEntries.slice(0, 4).map((item) => (
                <div key={item.label} className="rounded-[16px] border border-[var(--color-border)] px-4 py-3">
                  <p className="text-caption text-[var(--color-text-secondary)]">{item.label}</p>
                  <p className="mt-2 font-display text-h4 text-[var(--color-text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Audit trail</h2>
              <p className="text-caption text-[var(--color-text-secondary)]">Recent admin actions.</p>
            </div>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-caption text-[var(--color-text-secondary)]">
              Live feed
            </span>
          </div>
          {auditQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonLoader key={index} height="64px" />
              ))}
            </div>
          ) : auditEntries.length === 0 ? (
            <EmptyState heading="Nothing yet" message="Audit entries will appear here." />
          ) : (
            <div className="space-y-3">
              {auditEntries.map((entry, index) => (
                <div key={typeof (entry as { id?: string }).id === "string" ? (entry as { id?: string }).id : `${getAuditAction(entry)}-${index}`} className="rounded-[18px] border border-[var(--color-border)] px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-[var(--color-text-primary)]">{getAuditAction(entry)}</p>
                    <span className="text-caption text-[var(--color-text-secondary)]">{getAuditTimestamp(entry)}</span>
                  </div>
                  <p className="mt-1 text-caption text-[var(--color-text-secondary)]">
                    {getAuditActor(entry)}
                    {getAuditTarget(entry) ? ` • ${getAuditTarget(entry)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
