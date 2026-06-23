import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Archive, ArrowRight, Edit3, Eye, Filter, MapPin, Plus, Send } from "lucide-react";
import { listProperties, archiveProperty, approveProperty, publishProperty, submitPropertyForReview } from "@/services/properties.service";
import { listFeaturedProperties, featureProperty, unfeatureProperty } from "@/services/media.service";
import { StatusBadge } from "@/components/property/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { StatCard } from "@/components/data-display/StatCard";
import { PropertyStatus } from "@/constants/api-enums";
import { useAppSelector } from "@/store";
import { cn } from "@/utils/cn";
import { canArchiveListing, canCreateListing, canEditListing, canManageFeaturedListing, canPublishListing, canViewProperties, resolveAgentRole } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";

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
  const [filters, setFilters] = useState<Filters>(initialFilters);
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
          <div className="grid gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2 xl:col-span-2">
              <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Search</span>
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
                placeholder="Search title, city, or area"
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
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
              <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Purpose</span>
              <select
                value={filters.purpose}
                onChange={(event) => setFilters((current) => ({ ...current, purpose: event.target.value, page: 1 }))}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              >
                <option value="">Any</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
                <option value="short_let">Short let</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">State</span>
              <input
                value={filters.state}
                onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value, page: 1 }))}
                placeholder="Lagos"
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">City</span>
              <input
                value={filters.city}
                onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value, page: 1 }))}
                placeholder="Ikeja"
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              />
            </label>
          </div>

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
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                  <thead className="bg-[color-mix(in_srgb,var(--color-surface)_96%,white)]">
                    <tr className="text-left text-small uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {properties.map((property) => (
                      <tr key={property.id} className="align-top">
                        <td className="px-4 py-4">
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
                          {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(property.priceKobo))}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge status={property.status} />
                            <StatusBadge status={property.purpose} />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/properties/${property.id}`}
                              className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                            >
                              View
                            </Link>
                            {canEdit ? (
                              <Link
                                to={`/agent/listings/${property.id}/edit`}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </Link>
                            ) : null}
                            {canEdit && property.status.toLowerCase() === PropertyStatus.Draft.toLowerCase() ? (
                              <button
                                type="button"
                                onClick={() => void submitForReviewMutation.mutateAsync(property.id)}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                              >
                                Submit
                              </button>
                            ) : null}
                            {canPublish && property.status.toLowerCase() === PropertyStatus.PendingReview.toLowerCase() ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void approveMutation.mutateAsync(property.id)}
                                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void publishMutation.mutateAsync(property.id)}
                                  className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--color-accent)] px-3 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
                                >
                                  Publish
                                </button>
                              </>
                            ) : null}
                            {canArchive ? (
                              <button
                                type="button"
                                onClick={() => void handleAction("archive", property.id)}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                              >
                                <Archive className="h-4 w-4" />
                                Archive
                              </button>
                            ) : null}
                            {canFeature ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (featuredIds.has(property.id)) {
                                    await unfeatureMutation.mutateAsync(property.id);
                                  } else {
                                    await featureMutation.mutateAsync(property.id);
                                  }
                                }}
                                className={cn(
                                  "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition",
                                  featuredIds.has(property.id)
                                    ? "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]"
                                    : "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]",
                                )}
                              >
                                {featuredIds.has(property.id) ? "Unfeature" : "Feature"}
                              </button>
                            ) : null}
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
                  onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={(meta?.page ?? 1) >= totalPages}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
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
                <EmptyState heading="No featured properties" message="Feature a listing to highlight it on the homepage." />
              ) : (
                (featuredQuery.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[var(--color-border)] p-4">
                    <p className="font-medium text-[var(--color-text-primary)]">{item.title}</p>
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
