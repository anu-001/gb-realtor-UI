import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Trash2 } from "lucide-react";
import { listFeaturedProperties, unfeatureProperty } from "@/services/media.service";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { StatCard } from "@/components/data-display/StatCard";

function formatPrice(value?: string | number | null): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!amount || Number.isNaN(amount)) return "Price on request";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount / 100);
}

function getFeaturedImageUrl(item: Record<string, unknown>): string {
  const thumbnails = item.thumbnails;
  if (Array.isArray(thumbnails)) {
    const first = thumbnails[0];
    if (first && typeof first === "object") {
      const url = (first as Record<string, unknown>).url;
      if (typeof url === "string" && url.length > 0) {
        return url;
      }
    }
  }

  return "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";
}

export default function FeaturedPropertiesPage() {
  const queryClient = useQueryClient();
  const featuredQuery = useQuery({
    queryKey: ["featured-properties-page"],
    queryFn: () => listFeaturedProperties(100),
    staleTime: 120_000,
    retry: 1,
  });

  const unfeatureMutation = useMutation({
    mutationFn: (propertyId: string) => unfeatureProperty(propertyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["featured-properties-page"] });
      await queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
      await queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
    },
  });

  const featured = featuredQuery.data ?? [];

  if (featuredQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader height="200px" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLoader key={index} height="240px" />
          ))}
        </div>
      </div>
    );
  }

  if (featuredQuery.isError) {
    return (
      <EmptyState
        heading="Featured properties unavailable"
        message="Please try again in a moment."
        action={
          <button
            type="button"
            onClick={() => void featuredQuery.refetch()}
            className="ui-button-primary"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Featured properties</p>
            <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Featured listings.</h1>
            <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
              Review what is featured and remove it when needed.
            </p>
          </div>
          <Link
            to="/agent/listings"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
          >
            Open properties
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <StatCard label="Featured listings" value={String(featured.length)} icon={Star} description="Properties on the homepage." />

      {featured.length === 0 ? (
          <EmptyState
            icon={Star}
            heading="No featured listings"
            message="Promote a property from Listings."
            action={
              <Link
                to="/agent/listings"
                className="ui-button-primary"
              >
                Go to properties
              </Link>
            }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
              <div className="aspect-[4/3] bg-[var(--color-surface-raised)]">
                <img
                  src={getFeaturedImageUrl(item as unknown as Record<string, unknown>)}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-1">
                  <p className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Featured listing</p>
                    <h2 className="font-display text-h4 text-[var(--color-text-primary)]">{item.title}</h2>
                  <p className="text-caption text-[var(--color-text-secondary)]">
                    {item.area}, {item.city}, {item.state}
                  </p>
                </div>
                <p className="font-display text-h4 text-[var(--color-text-primary)]">{formatPrice(item.priceKobo)}</p>
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to={`/agent/listings/${item.id}/edit`}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => void unfeatureMutation.mutateAsync(item.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-danger)] transition hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,white)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
