import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Building2, Plus, Users } from "lucide-react";
import { getAnalyticsDashboard } from "@/services/analytics.service";
import { StatCard } from "@/components/data-display/StatCard";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAppSelector } from "@/store";

function getNumericEntries(value: unknown): Array<[string, number]> {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, number] => typeof entry[1] === "number");
}

export default function AgentOverviewPage() {
  const role = useAppSelector((state) => state.auth.user?.role ?? state.auth.user?.roles?.[0]?.code ?? "PropertyManager");
  const dashboardQuery = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => getAnalyticsDashboard(),
    staleTime: 300_000,
    retry: 1,
  });

  const summary = dashboardQuery.data;
  const activityEntries = getNumericEntries(summary?.internalActivityLogs);
  const featuredEntries = getNumericEntries(summary?.featuredPropertyPerformance);

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

  if (!summary) {
    return (
      <EmptyState
        heading="Overview unavailable"
        message="We could not load the dashboard summary right now."
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
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Quiet, premium control for your inventory.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
              Monitor listings, respond to leads, and keep the pipeline moving without the clutter of a generic admin view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/agent/listings/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              <Plus className="h-4 w-4" />
              Create property
            </Link>
            <Link
              to="/agent/leads"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
            >
              View leads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="mt-6 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-small text-[var(--color-text-secondary)]">
          Role: {role}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Recent activity</h2>
              <p className="text-caption text-[var(--color-text-secondary)]">The latest system actions from the backend summary.</p>
            </div>
          </div>
          {activityEntries.length === 0 ? (
            <EmptyState heading="No activity yet" message="Recent system events will show up here as they happen." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {activityEntries.slice(0, 6).map(([label, count]) => (
                <div key={label} className="rounded-[18px] border border-[var(--color-border)] p-4">
                  <p className="text-caption text-[var(--color-text-secondary)]">{label}</p>
                  <p className="mt-2 font-display text-h4 text-[var(--color-text-primary)]">{count}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div>
            <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Featured performance</h2>
            <p className="text-caption text-[var(--color-text-secondary)]">Featured surfaces and engagement totals.</p>
          </div>
          {featuredEntries.length === 0 ? (
            <EmptyState heading="No featured insights" message="Feature metrics will appear when there are active featured listings." />
          ) : (
            <div className="space-y-3">
              {featuredEntries.slice(0, 5).map(([label, count]) => (
                <div key={label} className="flex items-center justify-between rounded-[16px] border border-[var(--color-border)] px-4 py-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
