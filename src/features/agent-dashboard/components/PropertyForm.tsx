import { useMemo, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RichTextEditorField } from "@/components/ui/RichTextEditorField";
import { htmlTextLength } from "@/utils/html-text-length";

const propertyFormSchema = z.object({
  title: z.string().trim().min(1, "Property title is required").max(150, "Property title must not exceed 150 characters"),
  description: z
    .string()
    .min(1, "Property description is required")
    .refine((value) => htmlTextLength(value) >= 50, { message: "Description must be at least 50 characters" })
    .refine((value) => htmlTextLength(value) <= 5000, { message: "Description must not exceed 5000 characters" }),
  purpose: z.enum(["sale", "rent", "short_let"]),
  state: z.string().trim().min(1, "State is required"),
  city: z.string().trim().min(1, "City is required"),
  area: z.string().trim().min(1, "Area is required"),
  streetAddress: z.string().trim().optional(),
  priceKobo: z
    .string()
    .trim()
    .min(1, "Price is required")
    .regex(/^\d+$/, "Price must contain only numbers"),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  parkingSpaces: z.number().int().nonnegative().optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

type PropertyFormProps = {
  initialValues?: Partial<PropertyFormValues>;
  submitLabel: string;
  onSubmit: (values: PropertyFormValues) => Promise<void> | void;
  title?: ReactNode;
  description?: ReactNode;
};

const purposeOptions = [
  { value: "sale", label: "Sale" },
  { value: "rent", label: "Rent" },
  { value: "short_let", label: "Short let" },
] as const;

export function PropertyForm({
  initialValues,
  submitLabel,
  onSubmit,
  title = "Property Details",
  description = "Fill in the core listing data and refine the description with rich formatting.",
}: PropertyFormProps) {
  const defaultValues = useMemo<PropertyFormValues>(
    () => ({
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      purpose: initialValues?.purpose ?? "sale",
      state: initialValues?.state ?? "",
      city: initialValues?.city ?? "",
      area: initialValues?.area ?? "",
      streetAddress: initialValues?.streetAddress ?? "",
      priceKobo: initialValues?.priceKobo ?? "",
      bedrooms: initialValues?.bedrooms,
      bathrooms: initialValues?.bathrooms,
      parkingSpaces: initialValues?.parkingSpaces,
    }),
    [initialValues],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues,
    mode: "onChange",
  });

  return (
    <section className="space-y-6 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
      <div className="space-y-1">
        <h2 className="font-display text-h4 text-[var(--color-text-primary)]">{title}</h2>
        <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">{description}</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="property-title" className="block text-sm font-medium text-[var(--color-text-primary)]">
              Listing Title
            </label>
            <input
              id="property-title"
              {...register("title")}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="Modern 3-bedroom apartment in Lekki"
            />
            {errors.title?.message ? <p className="text-caption text-[var(--color-danger)]">{errors.title.message}</p> : null}
          </div>

          <div className="md:col-span-2">
            <RichTextEditorField<PropertyFormValues>
              name="description"
              control={control}
              label="Property Description"
              required
              placeholder="Describe the property in detail. Include key features, nearby landmarks, and what makes it unique..."
              minHeight={320}
              maxCharacters={5000}
              showAlignment
              toolbarVariant="editorial"
              rules={{ required: "Property description is required" }}
            />
          </div>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">Purpose</span>
            <select
              {...register("purpose")}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
            >
              {purposeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">Price (kobo)</span>
            <input
              inputMode="numeric"
              {...register("priceKobo")}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="125000000"
            />
            {errors.priceKobo?.message ? <p className="text-caption text-[var(--color-danger)]">{errors.priceKobo.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">State</span>
            <input
              {...register("state")}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="Lagos"
            />
            {errors.state?.message ? <p className="text-caption text-[var(--color-danger)]">{errors.state.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">City</span>
            <input
              {...register("city")}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="Ikeja"
            />
            {errors.city?.message ? <p className="text-caption text-[var(--color-danger)]">{errors.city.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">Area</span>
            <input
              {...register("area")}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="Ikeja GRA"
            />
            {errors.area?.message ? <p className="text-caption text-[var(--color-danger)]">{errors.area.message}</p> : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">Street address</span>
            <input
              {...register("streetAddress")}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="7 Admiralty Way"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">Bedrooms</span>
            <input
              inputMode="numeric"
              {...register("bedrooms", {
                setValueAs: (value) => (value === "" || value === undefined ? undefined : Number(value)),
              })}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="3"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">Bathrooms</span>
            <input
              inputMode="numeric"
              {...register("bathrooms", {
                setValueAs: (value) => (value === "" || value === undefined ? undefined : Number(value)),
              })}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="2"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">Parking spaces</span>
            <input
              inputMode="numeric"
              {...register("parkingSpaces", {
                setValueAs: (value) => (value === "" || value === undefined ? undefined : Number(value)),
              })}
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
              placeholder="1"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
