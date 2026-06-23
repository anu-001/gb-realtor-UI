import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PropertyForm } from "./components/PropertyForm";
import { createProperty } from "@/services/properties.service";
import type { CreatePropertyPayload } from "@/types/property";

export default function AddListingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: Parameters<typeof createProperty>[0]) => createProperty(values),
    onSuccess: async (property) => {
      await queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      navigate(`/agent/listings/${property.id}/edit`, { replace: true });
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Create property</h1>
        <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
          Build a new listing draft, then attach media and publish when it is ready.
        </p>
      </div>

      <PropertyForm
        submitLabel={mutation.isPending ? "Saving..." : "Create draft"}
        onSubmit={async (values) => {
          const payload: CreatePropertyPayload = {
            title: values.title,
            description: values.description,
            purpose: values.purpose,
            state: values.state,
            city: values.city,
            area: values.area,
            priceKobo: values.priceKobo,
            bedrooms: values.bedrooms,
            bathrooms: values.bathrooms,
          };

          await mutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
