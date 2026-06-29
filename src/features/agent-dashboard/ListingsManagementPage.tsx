import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, ArrowRight, Edit3, Eye, Filter, MapPin, MoreHorizontal, Plus, Send, Star } from "lucide-react";
import { listProperties, archiveProperty, approveProperty, publishProperty, submitPropertyForReview } from "@/services/properties.service";
import { listFeaturedProperties, featureProperty, unfeatureProperty } from "@/services/media.service";
import { StatusBadge } from "@/components/property/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { StatCard } from "@/components/data-display/StatCard";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { PropertyStatus } from "@/constants/api-enums";
import { useAppSelector } from "@/store";
import { cn } from "@/utils/cn";
import { canArchiveListing, canCreateListing, canEditListing, canManageFeaturedListing, canPublishListing, canViewProperties, resolveAgentRole } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";
import { formatKoboAsCompactNaira } from "@/utils/formatters";

type Filters = {
  search: string;
  status: string;
  purpose: string;
  state: string;
  city: string;
  page: number;
  limit: number;
};

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

const initialFilters: Filters = {
  search: "",
  status: "",
  purpose: "",
  state: "",
  city: "",
  page: 1,
  limit: 10,
};

function parseFilters(searchParams: URLSearchParams): Filters {
  const page = Number(searchParams.get("page") ?? initialFilters.page);
  const limit = Number(searchParams.get("limit") ?? initialFilters.limit);

  return {
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    purpose: searchParams.get("purpose") ?? "",
    state: searchParams.get("state") ?? "",
    city: searchParams.get("city") ?? "",
    page: Number.isFinite(page) && page > 0 ? page : initialFilters.page,
    limit: Number.isFinite(limit) && limit > 0 ? limit : initialFilters.limit,
  };
}

function filtersEqual(left: Filters, right: Filters): boolean {
  return (
    left.search === right.search &&
    left.status === right.status &&
    left.purpose === right.purpose &&
    left.state === right.state &&
    left.city === right.city &&
    left.page === right.page &&
    left.limit === right.limit
  );
}

function filtersToSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.purpose) params.set("purpose", filters.purpose);
  if (filters.state) params.set("state", filters.state);
  if (filters.city) params.set("city", filters.city);
  if (filters.page !== initialFilters.page) params.set("page", String(filters.page));
  if (filters.limit !== initialFilters.limit) params.set("limit", String(filters.limit));

  return params;
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export default function ListingsManagementPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounced = useDebouncedValue(filters.search, 300);
  const auth = useAppSelector((state) => state.auth);
  const role = resolveWorkspaceRole(auth.user, auth.accessToken) ?? resolveAgentRole(auth.user?.role ?? auth.user?.roles?.[0]?.code ?? null) ?? null;
  const canView = canViewProperties(role);

  const propertiesQuery = useQuery({
    queryKey: ["agent-properties", { ...filters, search: debounced }],
    queryFn: () =>
      listProperties({
        search: debounced || undefined,
        status: filters.status || undefined,
        purpose: filters.purpose || undefined,
        state: filters.state || undefined,
        city: filters.city || undefined,
        page: filters.page,
        limit: filters.limit,
      }),
    placeholderData: (previous) => previous,
    retry: 1,
    enabled: canView,
  });

  const featuredQuery = useQuery({
    queryKey: ["featured-properties"],
    queryFn: () => listFeaturedProperties(5),
    staleTime: 120_000,
  });

  const properties = propertiesQuery.data?.data ?? [];
  const meta = propertiesQuery.data?.meta;
  const featuredIds = useMemo(() => new Set((featuredQuery.data ?? []).map((item) => item.id)), [featuredQuery.data]);
  const canCreate = canCreateListing(role);
  const canEdit = canEditListing(role);
  const canPublish = canPublishListing(role);
  const canArchive = canArchiveListing(role);
  const canFeature = canManageFeaturedListing(role);

  useEffect(() => {
    const nextFilters = parseFilters(searchParams);
    setFilters((current) => (filtersEqual(current, nextFilters) ? current : nextFilters));
  }, [searchParams]);

  useEffect(() => {
    const nextParams = filtersToSearchParams(filters);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  const updateFilters = (patch: Partial<Filters>, resetPage = true) => {
    setFilters((current) => ({
      ...current,
      ...patch,
      page: resetPage ? 1 : patch.page ?? current.page,
    }));
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
    await queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
  };

  const submitForReviewMutation = useMutation({
    mutationFn: (id: string) => submitPropertyForReview(id, {}),
    onSuccess: refresh,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveProperty(id),
    onSuccess: refresh,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishProperty(id, {}),
    onSuccess: refresh,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveProperty(id, {}),
    onSuccess: refresh,
  });

  const featureMutation = useMutation({
    mutationFn: (propertyId: string) => featureProperty(propertyId),
    onSuccess: refresh,
  });

  const unfeatureMutation = useMutation({
    mutationFn: (propertyId: string) => unfeatureProperty(propertyId),
    onSuccess: refresh,
  });

  const statCards = [
    { label: "Total properties", value: String(meta?.total ?? 0), icon: Filter, description: "Filtered inventory in the current view." },
    { label: "Published", value: String(properties.filter((item) => item.status?.toLowerCase() === PropertyStatus.Published.toLowerCase()).length), icon: Eye, description: "Visible on the public surfaces." },
    { label: "Featured", value: String(featuredQuery.data?.length ?? 0), icon: Plus, description: "Curated premium placements." },
    { label: "Draft / review", value: String(properties.filter((item) => ["draft", "pendingreview", "pending_review"].includes(item.status.replace(/\s+/g, "").toLowerCase())).length), icon: Send, description: "Needs review before publication." },
  ];

  const handleAction = async (action: string, id: string) => {
    if (action === "archive") {
      if (!window.confirm("Archive this property?")) return;
      await archiveMutation.mutateAsync(id);
    }
  };

  const totalPages = meta?.totalPages ?? 1;
  const filterPanel = (
    <div
      className={cn(
        "grid gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card md:grid-cols-2 xl:grid-cols-5",
        filtersOpen ? "grid" : "hidden lg:grid",
      )}
    >
      <label className="space-y-2 xl:col-span-2">
        <span className="text-small font-semibold uppercase tracking-[0.18em] text-gray-600">Search</span>
        <input
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          placeholder="Search title, city, or area"
          className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
        />
      </label>

      <label className="space-y-2">
        <span className="text-small font-semibold uppercase tracking-[0.18em] text-gray-600">Status</span>
        <select
          value={filters.status}
          onChange={(event) => updateFilters({ status: event.target.value })}
          className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
        >
          <option value="">Any</option>
          {["draft", "pending_review", "published", "archived"].map((item) => (
            <option key={item} value={item}>
              {item.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-small font-semibold uppercase tracking-[0.18em] text-gray-600">Purpose</span>
        <select
          value={filters.purpose}
          onChange={(event) => updateFilters({ purpose: event.target.value })}
          className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
        >
          <option value="">Any</option>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
          <option value="short_let">Short let</option>
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-small font-semibold uppercase tracking-[0.18em] text-gray-600">State</span>
        <input
          value={filters.state}
          onChange={(event) => updateFilters({ state: event.target.value })}
          placeholder="Lagos"
          className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
        />
      </label>

      <label className="space-y-2">
        <span className="text-small font-semibold uppercase tracking-[0.18em] text-gray-600">City</span>
        <input
          value={filters.city}
          onChange={(event) => updateFilters({ city: event.target.value })}
          placeholder="Ikeja"
          className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
        />
      </label>
    </div>
  );

  if (!canView) {
    return (
      <EmptyState
        heading="Access denied"
        message="Your role does not allow viewing properties."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Property inventory</p>
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Manage listings with less noise.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
              Filter the inventory, inspect status, and move properties through the workflow in a calm, focused interface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canCreate ? (
              <Link
                to="/agent/listings/new"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                <Plus className="h-4 w-4" />
                Create property
              </Link>
            ) : null}
            <Link
              to="/agent/leads"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
            >
              View leads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="flex justify-end lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
              aria-expanded={filtersOpen}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {filterPanel}

          <div className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
              <div>
                <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Listings</h2>
                <p className="text-caption text-[var(--color-text-secondary)]">
                  {propertiesQuery.isLoading ? "Loading properties..." : `${meta?.total ?? 0} properties found`}
                </p>
              </div>
              <p className="text-caption text-[var(--color-text-secondary)]">
                Page {meta?.page ?? 1} of {totalPages}
              </p>
            </div>

            {propertiesQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonLoader key={index} height="72px" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <EmptyState
                icon={Filter}
                heading="No properties found"
                message="Try changing filters or create a new listing draft."
                action={
                  <button
                    type="button"
                    onClick={() => setFilters(initialFilters)}
                    className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[920px] divide-y divide-[var(--color-border)]">
                  <thead className="bg-[color-mix(in_srgb,var(--color-surface)_96%,white)]">
                    <tr className="text-left text-small uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                      <th scope="col" className="sticky left-0 z-10 bg-[color-mix(in_srgb,var(--color-surface)_96%,white)] px-4 py-3">Property</th>
                      <th scope="col" className="px-4 py-3">Location</th>
                      <th scope="col" className="px-4 py-3">Price</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {properties.map((property) => (
                      <tr key={property.id} className="group align-top transition-colors duration-200 hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-[var(--color-surface)] px-4 py-4 transition-colors duration-200 group-hover:bg-gray-50">
                          {(() => {
                            const thumbnail = property.thumbnails?.[0];
                            const thumbnailAlt = toText(thumbnail?.altText);
                            return (
                              <div className="flex items-start gap-3">
                                <img
                                  src={thumbnail?.publicUrl ?? "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80"}
                                  alt={thumbnailAlt && thumbnailAlt.length > 0 ? thumbnailAlt : property.title}
                                  className="h-16 w-16 rounded-[14px] object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-[var(--color-text-primary)]">{property.title}</p>
                                  <p className="text-caption text-[var(--color-text-secondary)]">
                                    {property.bedrooms ?? "—"} bd • {property.bathrooms ?? "—"} ba
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {property.area}, {property.city}, {property.state}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-[var(--color-text-primary)]">
                          {formatKoboAsCompactNaira(property.priceKobo)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge status={property.status} />
                            <StatusBadge status={property.purpose} />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {canEdit ? (
                              <Link
                                to={`/agent/listings/${property.id}/edit`}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </Link>
                            ) : null}
                            <Dropdown
                              trigger={
                                <button
                                  type="button"
                                  aria-label="Property actions"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              }
                            >
                              <DropdownItem asChild>
                                <Link to={`/properties/${property.id}`}>
                                  <Eye className="h-4 w-4" />
                                  View
                                </Link>
                              </DropdownItem>
                              {canEdit && property.status.toLowerCase() === PropertyStatus.Draft.toLowerCase() ? (
                                <DropdownItem onSelect={() => void submitForReviewMutation.mutateAsync(property.id)}>
                                  <Send className="h-4 w-4" />
                                  Submit for review
                                </DropdownItem>
                              ) : null}
                              {canPublish && property.status.toLowerCase() === PropertyStatus.PendingReview.toLowerCase() ? (
                                <>
                                  <DropdownItem onSelect={() => void approveMutation.mutateAsync(property.id)}>
                                    <Eye className="h-4 w-4" />
                                    Approve
                                  </DropdownItem>
                                  <DropdownItem onSelect={() => void publishMutation.mutateAsync(property.id)}>
                                    <Send className="h-4 w-4" />
                                    Publish
                                  </DropdownItem>
                                </>
                              ) : null}
                              {canFeature ? (
                                <DropdownItem
                                  onSelect={() => {
                                    if (featuredIds.has(property.id)) {
                                      void unfeatureMutation.mutateAsync(property.id);
                                    } else {
                                      void featureMutation.mutateAsync(property.id);
                                    }
                                  }}
                                >
                                  <Star className="h-4 w-4" />
                                  {featuredIds.has(property.id) ? "Unfeature" : "Feature"}
                                </DropdownItem>
                              ) : null}
                              {canArchive ? (
                                <DropdownItem onSelect={() => void handleAction("archive", property.id)} destructive>
                                  <Archive className="h-4 w-4" />
                                  Archive
                                </DropdownItem>
                              ) : null}
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Showing {((meta?.page ?? 1) - 1) * (meta?.limit ?? 10) + 1} - {Math.min((meta?.page ?? 1) * (meta?.limit ?? 10), meta?.total ?? properties.length)} of {meta?.total ?? 0}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={(meta?.page ?? 1) <= 1}
                  onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) }, false)}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={(meta?.page ?? 1) >= totalPages}
                  onClick={() => updateFilters({ page: filters.page + 1 }, false)}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
            <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Featured</h2>
            <p className="mt-1 text-caption text-[var(--color-text-secondary)]">Current featured items and quick controls.</p>
            <div className="mt-4 space-y-3">
              {featuredQuery.isLoading ? (
                <SkeletonLoader height="200px" />
              ) : (featuredQuery.data ?? []).length === 0 ? (
                <EmptyState heading="No featured listings" message="Feature a property to surface it on the homepage." />
              ) : (
                (featuredQuery.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[var(--color-border)] p-4">
                    <p className="line-clamp-2 font-medium text-[var(--color-text-primary)]">{item.title}</p>
                    <p className="mt-1 text-caption text-[var(--color-text-secondary)]">
                      {item.area}, {item.city}
                    </p>
                    <button
                      type="button"
                      onClick={() => void unfeatureMutation.mutateAsync(item.id)}
                      className="mt-3 inline-flex h-9 items-center rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
