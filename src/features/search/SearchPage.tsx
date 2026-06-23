import { useMemo } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/store";
import { FilterPanel } from "@/components/search/FilterPanel";
import { SortToolbar } from "@/components/search/SortToolbar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { parseSearchParams, usePropertySearch } from "./usePropertySearch";

function SearchResultsSkeleton({ count = 6 }: { count?: number } = {}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card"
        >
          <SkeletonLoader height="220px" />
          <SkeletonLoader className="mt-4" height="20px" width="72%" />
          <SkeletonLoader className="mt-3" height="16px" width="48%" />
        </div>
      ))}
    </div>
  );
}

function SearchResultsIllustration() {
  return (
    <div className="grid h-16 w-16 grid-cols-2 gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-card">
      <div className="rounded-lg bg-[color-mix(in_srgb,var(--color-accent)_18%,var(--color-surface))]" />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
      <div className="col-span-2 rounded-lg bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_28%,var(--color-surface))_0%,var(--color-surface)_100%)]" />
    </div>
  );
}

function SearchResultsPanel() {
  const { filters, data, meta, isLoading, isFetching, updateFilters, clearFilters, setPage, setPageSize } =
    usePropertySearch();
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const isListView = viewMode === "list";

  return (
    <>
      <SortToolbar
        total={meta.total}
        sort={filters.sort}
        onSortChange={(sort) => updateFilters({ sort: sort as typeof filters.sort, resetPage: true })}
        pageSize={filters.pageSize}
        onPageSizeChange={(pageSize) => setPageSize(pageSize)}
      />

      {isLoading ? (
        <SearchResultsSkeleton count={Math.min(filters.pageSize, 12)} />
      ) : data.length === 0 ? (
        <EmptyState
          heading="No properties match your current filters"
          message="Try broadening your search criteria. You can also request a property if you can’t find the right fit."
          illustration={<SearchResultsIllustration />}
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              Clear filters
            </button>
          }
          secondaryAction={
            <a
              href="/request-property"
              className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Request a Property
            </a>
          }
        />
      ) : (
        <div className={isListView ? "space-y-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"} aria-busy={isFetching ? "true" : undefined}>
          {data.map((property) => (
            <PropertyCard key={property.id} property={property} variant={isListView ? "list" : "grid"} showEnquiry />
          ))}
        </div>
      )}

      {meta.total > 0 ? (
        <div className="flex flex-col gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => setPage(meta.page - 1)}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-sm text-[var(--color-text-secondary)]" aria-live="polite">
              Showing {meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1}-
              {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
            </p>
            <p className="text-small text-[var(--color-text-secondary)]">
              Page {meta.page} of {Math.max(1, meta.totalPages)}
            </p>
          </div>
          <button
            type="button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage(meta.page + 1)}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}

function SearchShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  const updateParams = (next: Record<string, unknown>) => {
    const params = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    if (!("page" in next)) {
      params.set("page", "1");
    }

    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <FilterPanel
          value={filters}
          onChange={(next) => updateParams({ ...next, page: 1 })}
          onClear={clearFilters}
        />
      </div>

      <div className="space-y-6">
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              title="We could not load properties right now"
              message="We hit a temporary issue fetching listings. Please retry in a moment."
              onRetry={reset}
            >
              <SearchResultsPanel />
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <SearchShell />;
}
