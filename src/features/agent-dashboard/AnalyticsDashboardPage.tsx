import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, Building2, TrendingUp } from "lucide-react";
import { getAnalyticsDashboard } from "@/services/analytics.service";
import { StatCard } from "@/components/data-display/StatCard";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAppSelector } from "@/store";
import { UserRole } from "@/constants/api-enums";
import { resolveAgentRole } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";

const colors = ["#2563EB", "#6CABDD", "#16A34A", "#F59E0B", "#DC2626"];

function toNumericData(value: unknown) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => typeof entry === "number")
    .map(([name, value]) => ({ name, value: value as number }));
}

export default function AnalyticsDashboardPage() {
  const auth = useAppSelector((state) => state.auth);
  const role = resolveWorkspaceRole(auth.user, auth.accessToken) ?? resolveAgentRole(auth.user?.role ?? auth.user?.roles?.[0]?.code ?? "PropertyManager") ?? "PropertyManager";
  const canViewAnalytics = role === UserRole.Analyst || role === UserRole.SuperAdmin || role === "PropertyManager";
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const query = useQuery({
    queryKey: ["agent-analytics", range],
    queryFn: () => getAnalyticsDashboard(),
    staleTime: 300_000,
    retry: 1,
    enabled: auth.isAuthenticated && !auth.isInitializing && canViewAnalytics,
  });

  const summary = query.data;
  const activityData = useMemo(() => toNumericData(summary?.internalActivityLogs), [summary?.internalActivityLogs]);
  const featuredData = useMemo(() => toNumericData(summary?.featuredPropertyPerformance), [summary?.featuredPropertyPerformance]);
  const engagementData = useMemo(() => toNumericData(summary?.listingEngagement), [summary?.listingEngagement]);

  if (auth.isInitializing) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} height="148px" />
          ))}
        </div>
        <SkeletonLoader height="320px" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <EmptyState
        heading="Session required"
        message="Please sign in to view analytics."
        action={
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Go to login
          </Link>
        }
      />
    );
  }

  if (!canViewAnalytics) {
    return (
      <EmptyState
        heading="Access denied"
        message="You do not have permission to view this page."
      />
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} height="148px" />
          ))}
        </div>
        <SkeletonLoader height="320px" />
      </div>
    );
  }

  if (!summary) {
    return <EmptyState heading="Analytics unavailable" message="The dashboard analytics could not be loaded right now." action={<button type="button" onClick={() => void query.refetch()} className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white">Retry</button>} />;
  }

  const stats = [
    { label: "Users", value: String(summary.users ?? 0), icon: Users, description: "Internal users on the platform." },
    { label: "Properties", value: String(summary.properties ?? 0), icon: Building2, description: "All properties in the system." },
    { label: "Published", value: String(summary.publishedProperties ?? 0), icon: Building2, description: "Live listings visible to visitors." },
    { label: "Lead conversion", value: `${Number(summary.leadConversionRate ?? 0).toFixed(1)}%`, icon: TrendingUp, description: "Captured lead performance." },
  ];

  const lineData = activityData.length
    ? activityData.map((item, index) => ({ name: item.name, value: item.value, date: index + 1 }))
    : [{ name: "No data", value: 0, date: 0 }];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Analytics</p>
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Performance, at a glance.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
              Scan growth, performance, and activity in one place.
            </p>
          </div>
          <label className="space-y-2">
            <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Range</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as typeof range)}
              className="h-11 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
          <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Activity trend</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                <YAxis stroke="var(--color-text-secondary)" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
          <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Featured performance</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={featuredData.length ? featuredData : [{ name: "No data", value: 1 }]} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {(featuredData.length ? featuredData : [{ name: "No data", value: 1 }]).map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData.length ? engagementData : [{ name: "No data", value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                  <YAxis stroke="var(--color-text-secondary)" />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
