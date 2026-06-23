import { useState } from "react";
import { Bath, Bed, Heart, Share2, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { components } from "@/types/api.generated";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/utils/cn";

type PropertyCardProps = {
  property: components["schemas"]["PublicPropertyResponseDto"];
  showEnquiry?: boolean;
  variant?: "grid" | "list";
  className?: string;
};

function formatPrice(value: string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  const millions = amount / 1_000_000;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: millions >= 10 ? 0 : 1 }).format(
    amount,
  );
}

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

export function PropertyCard({ property, showEnquiry = false, variant = "grid", className }: PropertyCardProps) {
  const [favorite, setFavorite] = useState(false);
  const image = property.thumbnails?.[0];

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card transition-shadow hover:shadow-card-hover",
        variant === "list" && "flex flex-col md:flex-row",
        className,
      )}
    >
      <Link to={`/properties/${property.id}`} className={cn("block", variant === "list" ? "md:w-[40%]" : "w-full")}>
        <div className="group relative aspect-[4/3] overflow-hidden bg-[var(--color-border)]">
          <img
            src={image?.url ?? "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"}
            alt={typeof image?.altText === "string" ? image.altText : property.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute left-3 top-3">
            <StatusBadge status={property.listingType} />
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              aria-label="Favorite property"
              onClick={(event) => {
                event.preventDefault();
                setFavorite((value) => !value);
              }}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[var(--color-text-primary)] shadow-sm backdrop-blur",
                favorite && "text-[var(--color-danger)]",
              )}
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
            </button>
            <button
              type="button"
              aria-label="Share property"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[var(--color-text-primary)] shadow-sm backdrop-blur"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/properties/${property.id}`} className="line-clamp-2 font-display text-h4 text-[var(--color-text-primary)]">
                {property.title}
              </Link>
              <p className="mt-1 text-caption text-[var(--color-text-secondary)]">
                {property.area}, {property.city}, {property.state}
              </p>
            </div>
            <p className="shrink-0 font-display text-h4 font-bold text-[var(--color-text-primary)]">
              {formatPrice(property.priceKobo)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
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

        {showEnquiry ? (
          <div className="mt-auto flex gap-3">
            <button
              type="button"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              Enquire
            </button>
            <Link
              to={`/properties/${property.id}`}
              className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)]"
            >
              View
            </Link>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
