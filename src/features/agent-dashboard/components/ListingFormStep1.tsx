import type { ReactNode } from "react";
import { useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RichTextEditorField } from "@/components/ui/RichTextEditorField";
import { htmlTextLength } from "@/utils/html-text-length";

const listingDetailsSchema = z.object({
  title: z.string().min(1, "Property title is required").max(150, "Property title must not exceed 150 characters"),
  description: z
    .string()
    .min(1, "Property description is required")
    .refine((value) => htmlTextLength(value) >= 50, {
      message: "Description must be at least 50 characters",
    })
    .refine((value) => htmlTextLength(value) <= 5000, {
      message: "Description must not exceed 5000 characters",
    }),
});

export type ListingDetailsValues = z.infer<typeof listingDetailsSchema>;

type ListingFormStep1Props = {
  initialValues?: Partial<ListingDetailsValues>;
  onSubmit?: (values: ListingDetailsValues) => void | Promise<void>;
  submitLabel?: string;
  title?: ReactNode;
};

export function ListingFormStep1({
  initialValues,
  onSubmit,
  submitLabel = "Save and continue",
  title = "Property Details",
}: ListingFormStep1Props) {
  const defaultValues = useMemo<ListingDetailsValues>(
    () => ({
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
    }),
    [initialValues?.description, initialValues?.title],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListingDetailsValues>({
    resolver: zodResolver(listingDetailsSchema),
    defaultValues,
    mode: "onChange",
  });

  return (
    <section className="space-y-6 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
      <div className="space-y-1">
        <h2 className="font-display text-h4 text-[var(--color-text-primary)]">{title}</h2>
        <p className="text-body text-[var(--color-text-secondary)]">Provide the core listing details before moving to media and location.</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit?.(values);
        })}
      >
        <div className="space-y-2">
          <label htmlFor="listing-title" className="block text-sm font-medium text-[var(--color-text-primary)]">
            Listing Title
          </label>
          <input
            id="listing-title"
            {...register("title")}
            className="h-12 w-full rounded-input border border-[var(--color-border)] bg-white px-4 text-body outline-none transition focus-visible:border-[var(--color-accent)]"
            placeholder="e.g. Modern 3-bedroom apartment in Lekki"
          />
          {errors.title?.message ? <p className="text-caption text-[var(--color-danger)]">{errors.title.message}</p> : null}
        </div>

        <RichTextEditorField
          name="description"
          control={control}
          label="Property Description"
          required
          placeholder="Describe the property in detail. Include key features, nearby landmarks, and what makes it unique..."
          minHeight={400}
          maxCharacters={5000}
          showAlignment={true}
          rules={{ required: "Property description is required" }}
        />

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
