import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PropertyCreateForm } from "@/features/agent-dashboard/components/PropertyCreateForm";
import { RequestPropertyForm } from "@/components/leads/RequestPropertyForm";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { getPublicListings } from "@/services/properties.service";
import { pageTransition } from "@/utils/motion";
import { useAppSelector } from "@/store";
import { canCreateListing } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";

export default function RequestPropertyPage() {
  const auth = useAppSelector((state) => state.auth);
  const role = resolveWorkspaceRole(auth.user, auth.accessToken) ?? auth.user?.role ?? auth.user?.roles?.[0]?.code ?? null;
  const managerMode = canCreateListing(role);

  const propertiesQuery = useQuery({
    queryKey: ["public-request-property-options"],
    queryFn: () => getPublicListings({ page: 1, pageSize: 12, sort: "newest" }),
    enabled: !managerMode,
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const propertyOptions = useMemo(() => propertiesQuery.data?.data ?? [], [propertiesQuery.data?.data]);
  const effectivePropertyId = selectedPropertyId || propertyOptions[0]?.id || "";

  const selectedProperty = useMemo(() => {
    return propertyOptions.find((property) => property.id === effectivePropertyId) ?? null;
  }, [effectivePropertyId, propertyOptions]);

  useEffect(() => {
    if (selectedPropertyId || !propertyOptions.length) {
      return;
    }

    setSelectedPropertyId(propertyOptions[0].id);
  }, [propertyOptions, selectedPropertyId]);

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-5xl space-y-8 py-4 md:space-y-10 md:py-8">
      <div className="max-w-2xl space-y-3">
        <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          {managerMode ? "Property manager" : "Request a Property"}
        </p>
        <h1 className="font-display text-h1 text-[var(--color-text-primary)]">
          {managerMode ? "Create a property." : "Tell us what you’re after."}
        </h1>
        <p className="max-w-xl text-body-lg text-[var(--color-text-secondary)]">
          {managerMode
            ? "Build the listing, format the description, and attach images in one polished flow."
            : "Share the brief. We’ll handle the search."}
        </p>
      </div>

      {managerMode ? (
        <PropertyCreateForm />
      ) : (
        <>
          <section className="rounded-modal border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card md:p-8">
            <div className="space-y-2">
              <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                Choose a property
              </p>
              <p className="text-caption text-[var(--color-text-secondary)]">
                The backend requires a published property before a request can be submitted.
              </p>
            </div>

            {propertiesQuery.isLoading ? (
              <div className="mt-5 space-y-3">
                <SkeletonLoader height="48px" />
                <SkeletonLoader height="48px" />
              </div>
            ) : propertiesQuery.data?.data?.length ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
                <label className="space-y-2">
                  <span className="block text-sm font-medium text-[var(--color-text-primary)]">Published property</span>
                  <select
                    value={effectivePropertyId}
                    onChange={(event) => setSelectedPropertyId(event.target.value)}
                    className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                  >
                    {propertyOptions.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} · {property.city}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedProperty ? (
                  <div className="rounded-card border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_96%,white)_0%,var(--color-surface)_100%)] p-4">
                    <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                      Selected property
                    </p>
                    <h2 className="mt-2 font-display text-h4 text-[var(--color-text-primary)]">{selectedProperty.title}</h2>
                    <p className="mt-2 text-caption text-[var(--color-text-secondary)]">
                      {selectedProperty.area}, {selectedProperty.city}, {selectedProperty.state}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-card border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-body text-[var(--color-text-secondary)]">
                No published properties are available right now. Please check back soon or browse listings.
                <div className="mt-4">
                  <Link
                    to="/search"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                  >
                    Browse listings
                  </Link>
                </div>
              </div>
            )}
          </section>

          {selectedProperty ? (
            <RequestPropertyForm
              compact
              propertyId={selectedProperty.id}
              propertyTitle={selectedProperty.title}
              preferredLocation={`${selectedProperty.area}, ${selectedProperty.city}`}
              headline="Request a Property"
              subheading="A clear brief gets a sharper match."
              submitLabel="Send Request"
            />
          ) : null}
        </>
      )}
    </motion.div>
  );
}
