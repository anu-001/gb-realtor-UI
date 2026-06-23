import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Filter, MapPin, Search } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { getPublicListings } from "@/services/properties.service";
import { cn } from "@/utils/cn";
import { fadeIn, slideUp } from "@/utils/motion";

type HeroFilters = {
  keyword: string;
  location: string;
  listingType: "" | "sale" | "rent";
  minPrice: string;
  maxPrice: string;
  beds: "" | "1" | "2" | "3" | "4" | "5";
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
};

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

function sanitizeAmount(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const amount = Number(digits);
  return Number.isFinite(amount) ? amount : undefined;
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-small font-medium uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ListingSkeleton() {
  return (
    <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card">
      <SkeletonLoader height="220px" />
      <SkeletonLoader className="mt-4" height="18px" width="66%" />
      <SkeletonLoader className="mt-3" height="14px" width="42%" />
    </div>
  );
}

export default function HomePage() {
  const [filters, setFilters] = useState<HeroFilters>(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 300);

  const listingsQuery = useQuery({
    queryKey: [
      "home-public-listings",
      debouncedFilters.keyword,
      debouncedFilters.location,
      debouncedFilters.listingType,
      debouncedFilters.minPrice,
      debouncedFilters.maxPrice,
      debouncedFilters.beds,
    ],
    queryFn: () =>
      getPublicListings({
        q: debouncedFilters.keyword.trim() || undefined,
        location: debouncedFilters.location.trim() || undefined,
        listingType: debouncedFilters.listingType || undefined,
        minPrice: sanitizeAmount(debouncedFilters.minPrice),
        maxPrice: sanitizeAmount(debouncedFilters.maxPrice),
        beds: debouncedFilters.beds ? Number(debouncedFilters.beds) : undefined,
        pageSize: 8,
      }),
    staleTime: 60_000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 8_000),
    refetchOnWindowFocus: false,
  });

  const properties = listingsQuery.data?.data ?? [];
  const totalListings = listingsQuery.data?.meta.total ?? 0;

  const scrollTo = (elementId: string) => {
    document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-20 pb-20">
      <motion.section
        {...fadeIn}
        className="relative overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.86)_50%,rgba(37,99,235,0.36)),url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.18),transparent_30%)]" />
        <div className="relative app-container py-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div className="max-w-2xl space-y-6">
              <div className="space-y-4">
                <h1 className="font-display text-[clamp(2.8rem,7vw,5rem)] font-bold leading-[0.96] tracking-[-0.04em]">
                  Find a refined home without the clutter.
                </h1>
                <p className="max-w-xl text-body-lg text-white/72">
                  Search verified properties across Nigeria, browse live listings instantly, and open a lead when you are ready to enquire.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollTo("listings")}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-white/92"
                >
                  Browse listings
                </button>
                <Link
                  to="/request-property"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 text-sm font-medium text-white transition hover:bg-white/14"
                >
                  Request a property
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/92 p-4 text-[var(--color-text-primary)] shadow-modal backdrop-blur-xl md:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                <div>
                  <p className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                    Search live
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFilters(initialFilters)}
                  className="rounded-full border border-[var(--color-border)] px-3 py-2 text-small font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
                >
                  Clear
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FilterField label="Keyword">
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                      <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <input
                        value={filters.keyword}
                        onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                        placeholder="Search city, title, or feature"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                      />
                    </div>
                  </FilterField>
                </div>

                <FilterField label="Location">
                  <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                    <MapPin className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <input
                      value={filters.location}
                      onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                      list="homepage-cities"
                      placeholder="Any city"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                    />
                    <datalist id="homepage-cities">
                      {citySuggestions.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                </FilterField>

                <FilterField label="Listing type">
                  <div className="grid h-12 grid-cols-3 overflow-hidden rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] text-sm">
                    {[
                      { label: "Any", value: "" },
                      { label: "Buy", value: "sale" },
                      { label: "Rent", value: "rent" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          setFilters((current) => ({ ...current, listingType: item.value as HeroFilters["listingType"] }))
                        }
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

                <FilterField label="Min price">
                  <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">₦</span>
                    <input
                      value={filters.minPrice}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, minPrice: event.target.value.replace(/[^\d]/g, "") }))
                      }
                      inputMode="numeric"
                      placeholder="Any"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                    />
                  </div>
                </FilterField>

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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                <p className="text-small text-[var(--color-text-secondary)]" aria-live="polite">
                  {listingsQuery.isLoading ? "Loading listings..." : `${totalListings} properties available`}
                </p>
                <button
                  type="button"
                  onClick={() => scrollTo("listings")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
                >
                  View results
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...slideUp} className="space-y-5" id="listings">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
              Live listings
            </p>
            <h2 className="mt-2 font-display text-h2 text-[var(--color-text-primary)]">Browse what is available now</h2>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] shadow-card">
            <span aria-live="polite">{totalListings} properties found</span>
          </div>
        </div>

        {listingsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ListingSkeleton key={index} />
            ))}
          </div>
        ) : listingsQuery.error ? (
          <EmptyState
            icon={Filter}
            heading="We could not load properties right now"
            message="The live feed is temporarily unavailable. Retry in a moment or open the full search page."
            action={
              <button
                type="button"
                onClick={() => void listingsQuery.refetch()}
                className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                Retry
              </button>
            }
            secondaryAction={
              <Link
                to="/search"
                className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Open search
              </Link>
            }
          />
        ) : properties.length === 0 ? (
          <EmptyState
            heading="No properties match this search"
            message="Try broadening your search criteria, or request a property if you need something specific."
            action={
              <button
                type="button"
                onClick={() => setFilters(initialFilters)}
                className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                Clear filters
              </button>
            }
            secondaryAction={
              <Link
                to="/request-property"
                className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Request a property
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} showEnquiry />
            ))}
          </div>
        )}
      </motion.section>

    </div>
  );
}
