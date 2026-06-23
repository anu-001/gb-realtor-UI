import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listAuditLogs } from "@/services/users.service";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function formatTimestamp(value: unknown): string {
  if (typeof value !== "string" || !value) return "Recent";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["audit-logs", search, page],
    queryFn: () =>
      listAuditLogs({
        search: search || undefined,
        page,
        limit: 20,
      }),
    staleTime: 60_000,
    retry: 1,
  });

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta as { page?: number; limit?: number; total?: number; totalPages?: number } | undefined;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="space-y-2">
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Audit logs</p>
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Track key changes.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
            Review admin actions with filters and pagination.
          </p>
        </div>
      </section>

      <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card">
        <label className="block space-y-2">
          <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Search</span>
          <div className="flex h-11 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
            <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search action, actor, or resource"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </div>
        </label>
      </section>

      <section className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
        <div className="border-b border-[var(--color-border)] px-4 py-4">
          <p className="text-caption text-[var(--color-text-secondary)]">
            {query.isLoading ? "Loading audit logs..." : `${meta?.total ?? rows.length} events found`}
          </p>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} height="72px" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState heading="Nothing yet" message="Audit entries will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[color-mix(in_srgb,var(--color-surface)_96%,white)]">
                <tr className="text-left text-small uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((row, index) => {
                  const record = asRecord(row);
                  const key = text(record.id, `${text(record.action, "event")}-${index}`);
                  const actor = asRecord(record.actor ?? record.user ?? record.owner);
                  const target = asRecord(record.target);

                  return (
                    <tr key={key} className="align-top">
                      <td className="px-4 py-4 font-medium text-[var(--color-text-primary)]">{text(record.action ?? record.event)}</td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">{text(actor.fullName ?? actor.name)}</td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">{text(target.name ?? target.title)}</td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                        {formatTimestamp(record.createdAt ?? record.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
