import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, createSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Sparkles,
  BedDouble,
  Filter,
} from "lucide-react";
import { getFeaturedProperties, getPublicListings } from "@/services/properties.service";
import { PropertyCard } from "@/components/property/PropertyCard";
import { InquiryModal } from "@/components/property/InquiryModal";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { cn } from "@/utils/cn";
import { fadeIn, slideUp } from "@/utils/motion";

type HeroFilters = {
  keyword: string;
  location: string;
  listingType: "" | "sale" | "rent";
  minPrice: string;
  maxPrice: string;
  beds: "" | "1" | "2" | "3" | "4" | "5";
  featured: boolean;
};

const citySuggestions = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Enugu",
  "Benin City",
  "Owerri",
  "Kaduna",
  "Ilorin",
  "Abeokuta",
  "Uyo",
  "Warri",
  "Asaba",
  "Calabar",
];

const initialFilters: HeroFilters = {
  keyword: "",
  location: "",
  listingType: "",
  minPrice: "",
  maxPrice: "",
  beds: "",
  featured: false,
};

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handle);
  }, [delay, value]);

  return debouncedValue;
}

function parseAmount(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return undefined;
  }

  const amount = Number(digits);
  return Number.isFinite(amount) ? amount : undefined;
}

function formatCurrency(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactCurrency(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) {
    return String(value);
  }

  const abs = Math.abs(amount);
  const units = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];

  for (const unit of units) {
    if (abs >= unit.value) {
      const compact = amount / unit.value;
      return `₦${compact.toFixed(compact >= 10 ? 0 : 1)}${unit.suffix}`;
    }
  }

  return formatCurrency(amount);
}

function displayValue(value: string | number | null | Record<string, never> | undefined): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "—";
}

const featuredFallbackImages = [
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildSearchHref(filters: HeroFilters): string {
  const params = createSearchParams();
  if (filters.keyword.trim()) params.set("q", filters.keyword.trim());
  if (filters.location.trim()) params.set("location", filters.location.trim());
  if (filters.listingType) params.set("listingType", filters.listingType);
  const minPrice = parseAmount(filters.minPrice);
  const maxPrice = parseAmount(filters.maxPrice);
  if (minPrice !== undefined) params.set("minPrice", String(minPrice));
  if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
  if (filters.beds) params.set("beds", filters.beds);
  if (filters.featured) params.set("featured", "true");
  return `/search?${params.toString()}`;
}

function FeaturedRailItem({
  property,
}: {
  property: Awaited<ReturnType<typeof getFeaturedProperties>>[number];
}) {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const imageSrc = featuredFallbackImages[hashString(property.id) % featuredFallbackImages.length];

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative min-w-[min(88vw,34rem)] snap-start overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-border)]">
        <img
          src={imageSrc}
          alt={property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.54)_100%)]" />
        <div className="absolute left-5 top-5">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-small font-medium uppercase tracking-[0.18em] text-white/90 backdrop-blur">
            Featured
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="font-display text-h3 font-semibold">{formatCompactCurrency(property.priceKobo)}</p>
              <h3 className="mt-2 font-display text-h4 text-white">{property.title}</h3>
              <p className="mt-2 text-body text-white/72">
                {property.area}, {property.city}, {property.state}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/properties/${property.id}`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/18 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-white/16"
              >
                View details
              </Link>
              <button
                type="button"
                onClick={() => setInquiryOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                Enquire
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,white)] p-5 text-sm">
        <div>
          <p className="text-[var(--color-text-secondary)]">Location</p>
          <p className="mt-1 font-medium text-[var(--color-text-primary)]">{property.city}</p>
        </div>
        <div>
          <p className="text-[var(--color-text-secondary)]">Bedrooms</p>
          <p className="mt-1 font-medium text-[var(--color-text-primary)]">{displayValue(property.bedrooms)}</p>
        </div>
        <div>
          <p className="text-[var(--color-text-secondary)]">Bathrooms</p>
          <p className="mt-1 font-medium text-[var(--color-text-primary)]">{displayValue(property.bathrooms)}</p>
        </div>
      </div>

      <InquiryModal
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        propertyId={property.id}
        propertyTitle={property.title}
        preferredLocation={`${property.area}, ${property.city}`}
      />
    </motion.article>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 font-display text-h2 text-[var(--color-text-primary)]">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-body-lg text-[var(--color-text-secondary)]">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-small font-medium uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

export default function HomePage() {
  const [filters, setFilters] = useState<HeroFilters>(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 280);
  const featuredRailRef = useRef<HTMLDivElement | null>(null);

  const featuredQuery = useQuery({
    queryKey: ["home-featured-listings"],
    queryFn: () => getFeaturedProperties(),
    staleTime: 60_000,
  });

  const listingsQuery = useQuery({
    queryKey: ["home-public-listings", JSON.stringify(debouncedFilters)],
    queryFn: () =>
      getPublicListings({
        q: debouncedFilters.keyword.trim() || undefined,
        location: debouncedFilters.location.trim() || undefined,
        listingType: debouncedFilters.listingType || undefined,
        minPrice: parseAmount(debouncedFilters.minPrice),
        maxPrice: parseAmount(debouncedFilters.maxPrice),
        beds: debouncedFilters.beds ? Number(debouncedFilters.beds) : undefined,
        featured: debouncedFilters.featured || undefined,
        pageSize: 9,
      }),
    staleTime: 60_000,
  });

  const searchHref = useMemo(() => buildSearchHref(filters), [filters]);
  const featuredListings = featuredQuery.data ?? [];
  const listingResults = listingsQuery.data?.data ?? [];
  const totalListings = listingsQuery.data?.meta.total ?? 0;

  const scrollTo = (elementId: string) => {
    document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollRail = (direction: "prev" | "next") => {
    const rail = featuredRailRef.current;
    if (!rail) return;
    const delta = Math.max(rail.clientWidth * 0.82, 360);
    rail.scrollBy({ left: direction === "next" ? delta : -delta, behavior: "smooth" });
  };

  return (
    <div className="space-y-16 pb-16">
      <motion.section
        {...fadeIn}
        className="relative overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.84)_45%,rgba(37,99,235,0.4)),url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center text-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.2),transparent_30%)]" />
        <div className="relative app-container py-8 md:py-10">
          <div className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-small font-medium text-white/82 backdrop-blur">
                <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                Premium listings, live search, direct enquiry
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="font-display text-[clamp(3rem,7vw,5.3rem)] font-bold leading-[0.96] tracking-[-0.04em]">
                  Find the right property, faster.
                </h1>
                <p className="max-w-2xl text-body-lg text-white/74">
                  Discover verified homes, compare featured listings, and open a lead conversation in one polished flow.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-small text-white/68">
                {["Verified inventory", "One-click enquiries", "Nigeria-wide coverage"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/92 p-4 text-[var(--color-text-primary)] shadow-modal backdrop-blur-xl md:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                <div>
                  <p className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Search live</p>
                  <p className="mt-1 text-body text-[var(--color-text-secondary)]">Refine the homepage results without leaving the page.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFilters(initialFilters)}
                  className="rounded-full border border-[var(--color-border)] px-3 py-2 text-small font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
                >
                  Clear all
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <FilterField label="Keyword">
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                      <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <input
                        value={filters.keyword}
                        onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                        placeholder="Search by title, area, or feature"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                      />
                    </div>
                  </FilterField>
                </div>

                <div className="xl:col-span-2">
                  <FilterField label="Location">
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                      <MapPin className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <input
                        value={filters.location}
                        onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                        list="homepage-cities"
                        placeholder="City or state"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                      />
                      <datalist id="homepage-cities">
                        {citySuggestions.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </div>
                  </FilterField>
                </div>

                <div>
                  <FilterField label="Type">
                    <div className="grid h-12 grid-cols-3 overflow-hidden rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] text-sm">
                      {[
                        { label: "Any", value: "" },
                        { label: "Buy", value: "sale" },
                        { label: "Rent", value: "rent" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setFilters((current) => ({ ...current, listingType: item.value as HeroFilters["listingType"] }))}
                          className={cn(
                            "transition",
                            filters.listingType === item.value
                              ? "bg-[var(--color-accent)] text-white"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]",
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </FilterField>
                </div>

                <div>
                  <FilterField label="Bedrooms">
                    <select
                      value={filters.beds}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, beds: event.target.value as HeroFilters["beds"] }))
                      }
                      className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none"
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5].map((count) => (
                        <option key={count} value={String(count)}>
                          {count}+
                        </option>
                      ))}
                    </select>
                  </FilterField>
                </div>

                <div>
                  <FilterField label="Min price">
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">₦</span>
                      <input
                        value={filters.minPrice}
                        onChange={(event) =>
                          setFilters((current) => ({ ...current, minPrice: event.target.value.replace(/[^\d]/g, "") }))
                        }
                        inputMode="numeric"
                        placeholder="0"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                      />
                    </div>
                  </FilterField>
                </div>

                <div>
                  <FilterField label="Max price">
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">₦</span>
                      <input
                        value={filters.maxPrice}
                        onChange={(event) =>
                          setFilters((current) => ({ ...current, maxPrice: event.target.value.replace(/[^\d]/g, "") }))
                        }
                        inputMode="numeric"
                        placeholder="Any"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                      />
                    </div>
                  </FilterField>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(event) => setFilters((current) => ({ ...current, featured: event.target.checked }))}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
                  />
                  Featured only
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollTo("listings")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
                  >
                    Search listings
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    to={searchHref}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                  >
                    Open full search
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...slideUp} className="space-y-5" id="featured">
        <SectionTitle
          eyebrow="Featured"
          title="Featured listings"
          description="A concise, editorial rail of homes that feel worth opening first."
          action={
            <button
              type="button"
              onClick={() => scrollRail("prev")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
              aria-label="Scroll featured listings left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          }
        />

        <div className="relative">
          <div
            ref={featuredRailRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {featuredQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="min-w-[min(88vw,34rem)] overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card"
                >
                  <SkeletonLoader height="320px" />
                  <div className="space-y-3 p-5">
                    <SkeletonLoader height="20px" width="42%" />
                    <SkeletonLoader height="18px" width="82%" />
                    <SkeletonLoader height="18px" width="58%" />
                  </div>
                </div>
              ))
            ) : (
              featuredListings.map((property) => <FeaturedRailItem key={property.id} property={property} />)
            )}
          </div>

          <button
            type="button"
            onClick={() => scrollRail("next")}
            className="absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-card transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] lg:inline-flex"
            aria-label="Scroll featured listings right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.section>

      <motion.section {...slideUp} className="space-y-5" id="listings">
        <SectionTitle
          eyebrow="Browse"
          title="Live listing results"
          description="The homepage updates instantly as you refine filters, giving visitors a fast path to the right homes."
          action={
            <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] shadow-card">
              <span aria-live="polite">{totalListings} properties found</span>
            </div>
          }
        />

        {listingsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card">
                <SkeletonLoader height="220px" />
                <SkeletonLoader className="mt-4" height="20px" width="60%" />
                <SkeletonLoader className="mt-3" height="16px" width="45%" />
              </div>
            ))}
          </div>
        ) : listingsQuery.error ? (
          <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
            <p className="text-body text-[var(--color-danger)]">We could not load properties right now.</p>
          </div>
        ) : listingResults.length === 0 ? (
          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-card">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-h4 text-[var(--color-text-primary)]">No listings match these filters</h3>
                <p className="mt-2 text-body text-[var(--color-text-secondary)]">
                  Try a different location, widen the price range, or toggle featured-only off.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {listingResults.map((property) => (
              <PropertyCard key={property.id} property={property} showEnquiry />
            ))}
          </div>
        )}
      </motion.section>

      <motion.section
        {...slideUp}
        id="lead-cta"
        className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(15,23,42,0.97),rgba(15,23,42,0.86)_60%,rgba(37,99,235,0.42))] text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
      >
        <div className="app-container grid gap-10 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-white/72">Request a property</p>
            <h2 className="font-display text-h2 leading-[1.02] tracking-[-0.03em]">
              Tell us what you need, and we’ll help turn it into a lead.
            </h2>
            <p className="max-w-2xl text-body-lg text-white/72">
              Use the search above to narrow the field, then open a listing to enquire directly. It’s a faster, cleaner path than starting from a generic contact page.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur">
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                  <BedDouble className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Need a short list?</p>
                  <p className="text-sm text-white/70">Refine the search controls and browse featured homes first.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollTo("featured")}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-white/90"
                >
                  Browse featured
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("main-content")}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/18 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14"
                >
                  Back to search
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...slideUp} id="contact">
        <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Contact</p>
            <p className="mt-2 font-display text-h4 text-[var(--color-text-primary)]">Questions? Need help with a specific brief?</p>
            <p className="mt-2 max-w-2xl text-body text-[var(--color-text-secondary)]">
              Open any listing to enquire, or use the search panel to narrow your request before reaching out.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            Open listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
