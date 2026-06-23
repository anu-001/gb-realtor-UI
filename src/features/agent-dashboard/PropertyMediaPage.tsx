import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ImagePlus, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PropertyMediaManager } from "@/features/agent-dashboard/components/PropertyMediaManager";

export default function PropertyMediaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [propertyId, setPropertyId] = useState(searchParams.get("propertyId") ?? "");

  const activePropertyId = useMemo(() => searchParams.get("propertyId")?.trim() ?? "", [searchParams]);

  if (activePropertyId) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Property media</p>
              <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Manage listing images with precision.</h1>
              <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
                Upload, reorder, and confirm images for the selected property.
              </p>
            </div>
            <Link
              to="/agent/listings"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
            >
              <ArrowRight className="h-4 w-4" />
              Back to properties
            </Link>
          </div>
        </section>

        <PropertyMediaManager propertyId={activePropertyId} />
      </div>
    );
  }

  return (
    <EmptyState
      icon={ImagePlus}
      heading="Open a property to manage its media"
      message="Paste a property ID to load the gallery tools, or jump back to the properties workspace."
      action={
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="property-media-id">
            Property ID
          </label>
          <input
            id="property-media-id"
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            placeholder="Enter property ID"
            className="h-11 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() => {
              const next = propertyId.trim();
              if (!next) return;
              setSearchParams({ propertyId: next });
            }}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Open media manager
          </button>
        </div>
      }
    />
  );
}
