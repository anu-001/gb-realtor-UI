import { useState } from "react";
import { ArrowRight, Bath, Bed, Heart, Maximize2, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import type { components } from "@/types/api.generated";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/utils/cn";
import { formatCompactNaira } from "@/utils/formatters";
import { getPublicPropertyById } from "@/services/properties.service";

type PropertyCardProps = {
  property: components["schemas"]["PublicPropertyResponseDto"];
  variant?: "grid" | "list";
  className?: string;
};

function abbreviateArea(value?: unknown): string {
  if (value === undefined || value === null) return "N/A";
  if (typeof value === "string" || typeof value === "number") {
    return `${value} sqm`;
  }
  return "N/A";
}

function toLabel(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "—";
}

export function PropertyCard({ property, variant = "grid", className }: PropertyCardProps) {
  const queryClient = useQueryClient();
  const [favorite, setFavorite] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share property");
  const image = property.thumbnails?.[0];
  const propertyUrl = `/properties/${property.id}`;

  const prefetchDetails = () => {
    void queryClient.prefetchQuery({
      queryKey: ["public-property", property.id],
      queryFn: () => getPublicPropertyById(property.id),
      staleTime: 120_000,
    });
  };

  const shareProperty = async () => {
    const url = new URL(propertyUrl, window.location.origin).toString();

    if (typeof window.navigator.share === "function") {
      await window.navigator.share({
        title: property.title,
        text: property.title,
        url,
      });
      return;
    }

    if (window.navigator.clipboard?.writeText) {
      await window.navigator.clipboard.writeText(url);
      setShareLabel("Link copied");
      window.setTimeout(() => setShareLabel("Share property"), 2000);
    }
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative isolate cursor-pointer overflow-hidden rounded-card border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_97%,white)_0%,var(--color-surface)_100%)] shadow-card transition-transform duration-200 ease-out hover:shadow-card-hover",
        variant === "list" && "flex flex-col md:flex-row",
        className,
      )}
    >
      <Link
        to={propertyUrl}
        aria-label={`View details for ${property.title}`}
        onMouseEnter={prefetchDetails}
        onFocus={prefetchDetails}
        className="absolute inset-0 z-0 rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
      >
        <span className="sr-only">{property.title}</span>
      </Link>

      <div className={cn("block pointer-events-none", variant === "list" ? "md:w-[40%]" : "w-full")}>
        <div className="group relative z-10 aspect-[4/3] overflow-hidden bg-[var(--color-border)]">
          <img
            src={image?.url ?? "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"}
            alt={typeof image?.altText === "string" ? image.altText : property.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute left-3 top-3 z-10">
            <StatusBadge status={property.listingType} />
          </div>
          <div className="absolute right-3 top-3 z-20 flex gap-2">
            <button
              type="button"
              aria-label="Favorite property"
              aria-pressed={favorite}
              onClick={(event) => {
                event.preventDefault();
                setFavorite((value) => !value);
              }}
              className={cn(
                "pointer-events-auto",
                "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/92 text-[var(--color-text-primary)] shadow-sm backdrop-blur transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
                favorite && "text-[var(--color-danger)]",
              )}
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
            </button>
            <button
              type="button"
              aria-label={shareLabel}
              onClick={(event) => {
                event.preventDefault();
                void shareProperty();
              }}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/92 text-[var(--color-text-primary)] shadow-sm backdrop-blur transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3 className="line-clamp-2 h-14 font-display text-h4 font-semibold leading-tight text-[var(--color-text-primary)]">
            {property.title}
          </h3>
          <p className="font-display text-[1.15rem] font-medium text-slate-700">
            {formatCompactNaira(property.priceKobo)}
          </p>
          <p className="text-caption text-slate-700">
            {property.area}, {property.city}, {property.state}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {toLabel(property.bedrooms)} Beds
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {toLabel(property.bathrooms)} Baths
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="h-4 w-4" />
            {abbreviateArea(property.sizeSqm)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-text-primary)] transition group-hover:translate-x-1">
            View Details
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
