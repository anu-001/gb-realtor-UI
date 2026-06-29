import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Filter, MapPin, Search, SlidersHorizontal } from "lucide-react";
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
  type: "" | "house" | "apartment" | "land" | "commercial" | "villa";
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
  type: "",
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
      <span className="text-small font-medium uppercase tracking-[0.16em] text-white/70">
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const debouncedFilters = useDebouncedValue(filters, 300);

  const updateFilters = (next: Partial<HeroFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const listingsQuery = useQuery({
    queryKey: [
      "home-public-listings",
      debouncedFilters.keyword,
      debouncedFilters.location,
      debouncedFilters.listingType,
      debouncedFilters.type,
      debouncedFilters.minPrice,
      debouncedFilters.maxPrice,
      debouncedFilters.beds,
      page,
    ],
    queryFn: () =>
      getPublicListings({
        q: debouncedFilters.keyword.trim() || undefined,
        location: debouncedFilters.location.trim() || undefined,
        listingType: debouncedFilters.listingType || undefined,
        type: debouncedFilters.type || undefined,
        minPrice: sanitizeAmount(debouncedFilters.minPrice),
        maxPrice: sanitizeAmount(debouncedFilters.maxPrice),
        beds: debouncedFilters.beds ? Number(debouncedFilters.beds) : undefined,
        page,
        pageSize,
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
        className="relative min-h-[82vh] overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(rgba(2,6,23,0.66),rgba(2,6,23,0.58)),url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=86')] bg-cover bg-center text-white shadow-[0_28px_90px_rgba(2,6,23,0.32)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.2)_0%,rgba(2,6,23,0.62)_72%,rgba(2,6,23,0.78)_100%)]" />
        <div className="relative app-container flex min-h-[82vh] flex-col justify-center py-12">
          <div className="max-w-5xl space-y-10">
            <div className="max-w-3xl space-y-6">
              <div className="space-y-4">
                <h1 className="font-display text-[clamp(2.75rem,7vw,5.25rem)] font-bold leading-[0.98]">
                  Find the right property, faster.
                </h1>
                <p className="max-w-xl text-body-lg text-white/72">
                  Search verified homes across Nigeria and move straight to enquiry when something fits.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-white shadow-[0_24px_80px_rgba(2,6,23,0.34)] backdrop-blur-md md:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Search city, title, or feature</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 transition focus-within:border-white/60">
                    <Search className="h-5 w-5 text-white/76" />
                    <input
                      value={filters.keyword}
                      onChange={(event) => updateFilters({ keyword: event.target.value })}
                      placeholder="Search city, title, or feature"
                      className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/62"
                    />
                  </div>
                </label>

                <div className="grid h-14 grid-cols-2 overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-sm font-medium">
                  {[
                    { label: "Buy", value: "sale" },
                    { label: "Rent", value: "rent" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => updateFilters({ listingType: item.value as HeroFilters["listingType"] })}
                      className={cn(
                        "min-w-24 px-5 transition",
                        filters.listingType === item.value
                          ? "bg-white text-slate-950"
                          : "text-white/82 hover:bg-white/12 hover:text-white",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAdvancedOpen((current) => !current)}
                  aria-expanded={advancedOpen}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-medium text-white/88 transition hover:bg-white/14 hover:text-white"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Advanced Filters
                  <ChevronDown className={cn("h-4 w-4 transition", advancedOpen && "rotate-180")} />
                </button>
              </div>

              {advancedOpen ? (
                <div className="mt-4 grid gap-3 border-t border-white/14 pt-4 sm:grid-cols-2 lg:grid-cols-5">
                  <FilterField label="Location">
                    <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-4">
                      <MapPin className="h-4 w-4 text-white/68" />
                      <input
                        value={filters.location}
                        onChange={(event) => updateFilters({ location: event.target.value })}
                        list="homepage-cities"
                        placeholder="Any city"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/58"
                      />
                      <datalist id="homepage-cities">
                        {citySuggestions.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </div>
                  </FilterField>

                  <FilterField label="Property type">
                    <select
                      value={filters.type}
                      onChange={(event) => updateFilters({ type: event.target.value as HeroFilters["type"] })}
                      className="h-12 w-full rounded-2xl border border-white/18 bg-white/10 px-4 text-sm text-white outline-none transition focus:border-white/60 [&>option]:text-slate-950"
                    >
                      <option value="">Any</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                      <option value="villa">Villa</option>
                    </select>
                  </FilterField>

                  <FilterField label="Bedrooms">
                    <select
                      value={filters.beds}
                      onChange={(event) => updateFilters({ beds: event.target.value as HeroFilters["beds"] })}
                      className="h-12 w-full rounded-2xl border border-white/18 bg-white/10 px-4 text-sm text-white outline-none transition focus:border-white/60 [&>option]:text-slate-950"
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
                    <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-4">
                      <span className="text-sm font-medium text-white/68">₦</span>
                      <input
                        value={filters.minPrice}
                        onChange={(event) => updateFilters({ minPrice: event.target.value.replace(/[^\d]/g, "") })}
                        inputMode="numeric"
                        placeholder="Any"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/58"
                      />
                    </div>
                  </FilterField>

                  <FilterField label="Max price">
                    <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-4">
                      <span className="text-sm font-medium text-white/68">₦</span>
                      <input
                        value={filters.maxPrice}
                        onChange={(event) => updateFilters({ maxPrice: event.target.value.replace(/[^\d]/g, "") })}
                        inputMode="numeric"
                        placeholder="Any"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/58"
                      />
                    </div>
                  </FilterField>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/14 pt-4">
                <p className="text-small text-white/76" aria-live="polite">
                  {listingsQuery.isLoading ? "Loading listings..." : `${totalListings} properties available`}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-small font-medium text-white/72 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo("listings")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/24 bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-white/90"
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
              Available now
            </p>
            <h2 className="mt-2 font-display text-h2 text-[var(--color-text-primary)]">Latest homes</h2>
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
            heading="Couldn’t load listings"
            message="Please try again or open search."
            action={
              <button
                type="button"
                onClick={() => void listingsQuery.refetch()}
                className="ui-button-primary"
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
            heading="No matches yet"
            message="Broaden the filters or request a property."
            action={
              <button
                type="button"
                onClick={resetFilters}
                className="ui-button-primary"
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
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} showEnquiry />
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--color-text-secondary)]" aria-live="polite">
                Showing {totalListings === 0 ? 0 : (page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, totalListings)} of {totalListings}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="min-w-20 text-center text-sm font-medium text-[var(--color-text-primary)]">
                  Page {page} of {Math.max(1, listingsQuery.data?.meta.totalPages ?? 1)}
                </span>
                <button
                  type="button"
                  disabled={page >= (listingsQuery.data?.meta.totalPages ?? 1)}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </motion.section>

    </div>
  );
}
