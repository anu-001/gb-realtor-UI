import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { getPublicListings } from "@/services/properties.service";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { slideUp, fadeIn } from "@/utils/motion";

const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu"];

export default function HomePage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [listingType, setListingType] = useState("sale");
  const featured = useQuery({
    queryKey: ["featured-properties"],
    queryFn: () => getPublicListings({ featured: true, pageSize: 3 }),
  });

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    params.set("listingType", listingType);
    return params;
  }, [location, listingType]);

  return (
    <div className="space-y-12">
      <motion.section
        {...fadeIn}
        className="relative overflow-hidden rounded-[var(--radius-modal)] bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55)),url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center p-8 text-white md:p-12"
      >
        <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-center gap-6 py-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-bold leading-[1.05]">
            Find Your Perfect Property in Nigeria
          </h1>
          <p className="max-w-2xl text-body-lg text-white/80">
            Discover verified listings across Lagos, Abuja and beyond
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/search?${searchParams.toString()}`);
            }}
            className="rounded-modal border border-white/10 bg-white p-4 text-[var(--color-text-primary)] shadow-modal md:p-8"
          >
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <label className="space-y-2">
                <span className="text-sm font-medium">Location</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  list="cities"
                  className="h-12 w-full rounded-input border border-[var(--color-border)] px-4"
                  placeholder="Enter city or state"
                />
                <datalist id="cities">
                  {cities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Buy or Rent</span>
                <select
                  value={listingType}
                  onChange={(event) => setListingType(event.target.value)}
                  className="h-12 w-full rounded-input border border-[var(--color-border)] px-4"
                >
                  <option value="sale">Buy</option>
                  <option value="rent">Rent</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-input bg-[var(--color-accent)] px-4 font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              <Search className="h-4 w-4" />
              Search Properties
            </button>
          </form>
        </div>
      </motion.section>

      <motion.section {...slideUp} className="space-y-6">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-h2">Featured Properties</h2>
          <button
            type="button"
            onClick={() => navigate("/search?featured=true")}
            className="text-sm font-medium text-[var(--color-accent)]"
          >
            View all featured
          </button>
        </div>
        {featured.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-card border border-[var(--color-border)] bg-white p-4 shadow-card">
                <SkeletonLoader height="220px" />
                <SkeletonLoader className="mt-4" height="20px" width="70%" />
                <SkeletonLoader className="mt-3" height="16px" width="45%" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(featured.data?.data ?? []).slice(0, 3).map((property) => (
              <PropertyCard key={property.id} property={property} showEnquiry />
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
