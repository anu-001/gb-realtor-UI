import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { archiveProperty, getPropertyById, publishProperty, submitPropertyForReview, updateProperty, approveProperty } from "@/services/properties.service";
import { PropertyForm } from "./components/PropertyForm";
import { PropertyMediaManager } from "./components/PropertyMediaManager";
import { RichTextContent } from "@/components/data-display/RichTextContent";
import { StatusBadge } from "@/components/property/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { PropertyStatus } from "@/constants/api-enums";
import { useAppSelector } from "@/store";
import { canArchiveListing, canEditListing, canPublishListing } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";
import type { UpdatePropertyPayload } from "@/types/property";
import { Building2, CircleCheckBig, Send, Archive } from "lucide-react";

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAppSelector((state) => state.auth);
  const role = resolveWorkspaceRole(auth.user, auth.accessToken) ?? auth.user?.role ?? auth.user?.roles?.[0]?.code ?? null;
  const allowed = canEditListing(role);

  const propertyQuery = useQuery({
    queryKey: ["agent-property", id],
    queryFn: () => getPropertyById(id ?? ""),
    enabled: Boolean(id),
  });

  const property = propertyQuery.data;

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdatePropertyPayload) => {
      if (!id) throw new Error("Missing property id");
      return updateProperty(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agent-property", id] });
      await queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
    },
  });

  const workflowActions = useMemo(() => {
    if (!property || !allowed) return [];
    const actions = [];
    actions.push({
      label: "Submit for review",
      icon: Send,
      handler: async () => {
        if (!id) return;
        await submitPropertyForReview(id, {});
        await queryClient.invalidateQueries({ queryKey: ["agent-property", id] });
      },
    });
    if (property.status === PropertyStatus.PendingReview && canPublishListing(role)) {
      actions.push({
        label: "Approve",
        icon: CircleCheckBig,
        handler: async () => {
          if (!id) return;
          await approveProperty(id);
          await queryClient.invalidateQueries({ queryKey: ["agent-property", id] });
        },
      });
      actions.push({
        label: "Publish",
        icon: Building2,
        handler: async () => {
          if (!id) return;
          await publishProperty(id, {});
          await queryClient.invalidateQueries({ queryKey: ["agent-property", id] });
        },
      });
    }
    if (canArchiveListing(role)) {
      actions.push({
        label: "Archive",
        icon: Archive,
        handler: async () => {
          if (!id) return;
          if (!window.confirm("Archive this listing?")) return;
          await archiveProperty(id, {});
          await queryClient.invalidateQueries({ queryKey: ["agent-property", id] });
          await queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
          navigate("/agent/listings", { replace: true });
        },
      });
    }
    return actions;
  }, [allowed, id, navigate, property, queryClient, role]);

  if (propertyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader height="240px" />
        <SkeletonLoader height="420px" />
        <SkeletonLoader height="320px" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <EmptyState
        heading="Access denied"
        message="Your role does not allow editing listings."
        action={
          <button
            type="button"
            onClick={() => navigate("/agent/listings", { replace: true })}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Back to listings
          </button>
        }
      />
    );
  }

  if (!property) {
    return (
      <EmptyState
        heading="Listing not found"
        message="The property may have been removed or you may not have access to it."
        action={
          <button
            type="button"
            onClick={() => navigate("/agent/listings")}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Back to listings
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Edit listing</p>
          <h1 className="font-display text-h2 text-[var(--color-text-primary)]">{property.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={property.status} />
            <StatusBadge status={property.purpose} />
            <span className="text-caption text-[var(--color-text-secondary)]">
              {property.area}, {property.city}, {property.state}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workflowActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => void action.handler()}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      <PropertyForm
        submitLabel={updateMutation.isPending ? "Saving..." : "Save changes"}
        initialValues={{
          title: property.title,
          description: property.description,
          purpose: property.purpose as "sale" | "rent" | "short_let",
          state: property.state,
          city: property.city,
          area: property.area,
          priceKobo: property.priceKobo,
          bedrooms: property.bedrooms ? Number(property.bedrooms) : undefined,
          bathrooms: property.bathrooms ? Number(property.bathrooms) : undefined,
          parkingSpaces: property.parkingSpaces ? Number(property.parkingSpaces) : undefined,
          streetAddress: (property as { streetAddress?: string }).streetAddress ?? "",
        }}
        onSubmit={async (values) => {
          if (!id) return;
          const payload: UpdatePropertyPayload = {
            title: values.title,
            description: values.description,
            purpose: values.purpose,
            state: values.state,
            city: values.city,
            area: values.area,
            streetAddress: values.streetAddress,
            priceKobo: values.priceKobo,
            bedrooms: values.bedrooms,
            bathrooms: values.bathrooms,
            parkingSpaces: values.parkingSpaces,
          };
          await updateMutation.mutateAsync(payload);
        }}
      />

      {id ? <PropertyMediaManager propertyId={id} /> : null}

      <section className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Published description preview</h2>
        <RichTextContent html={property.description} className="property-description max-w-4xl" />
      </section>
    </div>
  );
}
