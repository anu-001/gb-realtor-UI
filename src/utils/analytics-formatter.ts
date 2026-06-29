export const ANALYTICS_LABEL_MAP: Record<string, string> = {
  activeFeaturedProperties: "Active featured",
  clickThroughRate: "CTR (%)",
  clicks: "Clicks",
  inquiries: "Inquiries",
  shares: "Shares",
  total: "Total",
  totalEvents: "Total events",
  views: "Views",
};

export function formatAnalyticsLabel(value: string): string {
  return ANALYTICS_LABEL_MAP[value] ?? value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._-]+/g, " ");
}

export function formatSystemAction(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) return "—";
  return value
    .split(".")
    .map((part) => part.replace(/[_-]+/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export function numericEntries(value: unknown): Array<{ name: string; label: string; value: number }> {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([name, entry]) => {
    if (typeof entry !== "number" || !Number.isFinite(entry)) return [];
    return [{ name, label: formatAnalyticsLabel(name), value: entry }];
  });
}

export function activitySeries(value: unknown): Array<{ date: string; total: number }> {
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const byAction = record.byAction;

  if (Array.isArray(byAction)) {
    return byAction.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const row = entry as Record<string, unknown>;
      const action = typeof row.action === "string" ? row.action : "Activity";
      const count = typeof row.count === "number" && Number.isFinite(row.count) ? row.count : null;
      return count === null ? [] : [{ date: formatSystemAction(action), total: count }];
    });
  }

  const total = typeof record.total === "number" && Number.isFinite(record.total) ? record.total : null;
  return total === null ? [] : [{ date: "Total activity", total }];
}
