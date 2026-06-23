import { useMemo } from "react";
import { SearchX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getPublicListings } from "@/services/properties.service";
import { useAppSelector } from "@/store";
import { FilterPanel, type SearchFilters } from "@/components/search/FilterPanel";
import { SortToolbar } from "@/components/search/SortToolbar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";

type SearchPageFilters = SearchFilters & {
  type?: "house" | "apartment" | "land" | "commercial" | "villa";
  listingType?: "sale" | "rent";
  sort: "newest" | "oldest" | "price_asc" | "price_desc" | "featured_first";
  page: number;
  pageSize: number;
};

function parseFilters(params: URLSearchParams): SearchPageFilters {
  return {
    location: params.get("location") ?? "",
    type: (params.get("type") ?? "") as SearchPageFilters["type"],
    listingType: (params.get("listingType") ?? "") as SearchPageFilters["listingType"],
    beds: params.get("beds") ? Number(params.get("beds")) : "",
    minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : "",
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : "",
    sort: (params.get("sort") ?? "newest") as SearchPageFilters["sort"],
    page: params.get("page") ? Number(params.get("page")) : 1,
    pageSize: params.get("pageSize") ? Number(params.get("pageSize")) : 12,
  };
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const query = useQuery({
    queryKey: ["public-properties", searchParams.toString()],
    queryFn: () =>
      getPublicListings({
        location: filters.location || undefined,
        type: filters.type as SearchPageFilters["type"],
        listingType: filters.listingType as SearchPageFilters["listingType"],
        beds: typeof filters.beds === "number" ? filters.beds : undefined,
        minPrice: typeof filters.minPrice === "number" ? filters.minPrice : undefined,
        maxPrice: typeof filters.maxPrice === "number" ? filters.maxPrice : undefined,
        sort: filters.sort as never,
        page: filters.page,
        pageSize: filters.pageSize,
      }),
  });

  const updateParams = (next: Partial<SearchFilters> & { sort?: string; page?: number; pageSize?: number }) => {
    const nextParams = new URLSearchParams(searchParams);
    const entries = Object.entries(next);
    for (const [key, value] of entries) {
      if (value === undefined || value === "" || value === null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    }
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  };

  const results = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <FilterPanel
          value={filters}
          onChange={updateParams}
          onClear={() => setSearchParams({}, { replace: true })}
        />
      </div>
      <div className="space-y-6">
        <SortToolbar
          total={total}
          sort={filters.sort}
          onSortChange={(sort) => updateParams({ sort: sort as SearchPageFilters["sort"] })}
        />

        {query.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card">
                <SkeletonLoader height="220px" />
                <SkeletonLoader className="mt-4" height="20px" width="70%" />
                <SkeletonLoader className="mt-3" height="16px" width="45%" />
              </div>
            ))}
          </div>
        ) : query.error ? (
          <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-[var(--color-danger)]">We could not load properties right now.</p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            heading="No properties found"
            message="Try adjusting your filters or search in a different area."
            action={
              <button
                type="button"
                onClick={() => setSearchParams({}, { replace: true })}
                className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className={viewMode === "list" ? "space-y-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
            {results.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                variant={viewMode === "list" ? "list" : "grid"}
                showEnquiry
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => updateParams({ ...filters, page: Math.max(1, filters.page - 1) })}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Showing {Math.min((filters.page - 1) * filters.pageSize + 1, total)}-
            {Math.min(filters.page * filters.pageSize, total)} of {total}
          </p>
          <button
            type="button"
            disabled={filters.page * filters.pageSize >= total}
            onClick={() => updateParams({ ...filters, page: filters.page + 1 })}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
