import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type DragEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, ImagePlus, Image as ImageIcon, Star, Trash2, Upload } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RichTextEditorField } from "@/components/ui/RichTextEditorField";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { createProperty, createPropertyWithImages } from "@/services/properties.service";
import { createPropertyMediaUploadUrl } from "@/services/media.service";
import { htmlTextLength } from "@/utils/html-text-length";
import { cn } from "@/utils/cn";
import type { CreatePropertyPayload, Property, PropertyUploadSlot, PropertyImageMetadataInput } from "@/types/property";
import { getApiErrorMessage, getFieldErrors, parseApiError } from "@/utils/api-error";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 10 * 1024 * 1024;
const maxImageCount = 10;

const createPropertySchema = z.object({
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
  priceKobo: z
    .string()
    .trim()
    .min(1, "Price is required")
    .regex(/^\d+$/, "Price must contain only numbers"),
  bedrooms: z
    .number()
    .int("Bedrooms must be a whole number")
    .min(0, "Bedrooms cannot be negative")
    .optional(),
  bathrooms: z
    .number()
    .int("Bathrooms must be a whole number")
    .min(0, "Bathrooms cannot be negative")
    .optional(),
});

type CreatePropertyFormInput = z.input<typeof createPropertySchema>;
type CreatePropertyFormValues = z.output<typeof createPropertySchema>;

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  isPrimary: boolean;
  status: "idle" | "uploading" | "uploaded" | "failed";
  error?: string;
  uploadUrl?: string;
  publicUrl?: string;
};

type UploadSlotState = PropertyUploadSlot & {
  status: "pending" | "uploading" | "uploaded" | "failed";
  error?: string;
};

type PropertyCreateFormProps = {
  className?: string;
};

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-caption text-[var(--color-text-secondary)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-caption text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(kilobytes >= 10 ? 0 : 1)} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function inferAltText(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Listing image";
}

function resolveKey(prefix = "image"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function validateImageFile(file: File): string | null {
  if (!allowedMimeTypes.has(file.type)) {
    return "Use JPEG, PNG, or WebP images only.";
  }

  if (file.size > maxImageBytes) {
    return "Each image must be 10MB or smaller.";
  }

  return null;
}

async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
}

function mapCreateResponse(
  response: { property?: Property | null; uploadSlots?: PropertyUploadSlot[]; raw?: unknown } | Property | null | undefined,
): { property: Property | null; uploadSlots: PropertyUploadSlot[] } {
  if (!response || typeof response !== "object") {
    return { property: null, uploadSlots: [] };
  }

  const candidate = response as { property?: Property | null; uploadSlots?: PropertyUploadSlot[]; data?: Property | null; slots?: PropertyUploadSlot[]; uploads?: PropertyUploadSlot[]; images?: PropertyUploadSlot[] };
  const property = candidate.property ?? candidate.data ?? null;
  const uploadSlots = candidate.uploadSlots ?? candidate.slots ?? candidate.uploads ?? candidate.images ?? [];

  if (property && typeof property === "object" && "id" in property) {
    return { property, uploadSlots };
  }

  if ("id" in response) {
    return { property: response as Property, uploadSlots };
  }

  return { property: null, uploadSlots };
}

export function PropertyCreateForm({ className }: PropertyCreateFormProps) {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null);
  const [uploadSlots, setUploadSlots] = useState<UploadSlotState[]>([]);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputId = useId();
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const selectedImagesRef = useRef<SelectedImage[]>([]);

  const fieldIds = useMemo(
    () => ({
      title: `property-title-${fileInputId}`,
      description: `property-description-${fileInputId}`,
      purpose: `property-purpose-${fileInputId}`,
      priceKobo: `property-price-${fileInputId}`,
      state: `property-state-${fileInputId}`,
      city: `property-city-${fileInputId}`,
      area: `property-area-${fileInputId}`,
      bedrooms: `property-bedrooms-${fileInputId}`,
      bathrooms: `property-bathrooms-${fileInputId}`,
    }),
    [fileInputId],
  );

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePropertyFormInput, unknown, CreatePropertyFormValues>({
    resolver: zodResolver(createPropertySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      purpose: "sale",
      state: "",
      city: "",
      area: "",
      priceKobo: "",
      bedrooms: undefined,
      bathrooms: undefined,
    },
  });

  const imageCount = selectedImages.length;
  const primaryImageCount = selectedImages.filter((image) => image.isPrimary).length;

  const setPrimaryImage = (id: string) => {
    setSelectedImages((current) =>
      current.map((image) => ({
        ...image,
        isPrimary: image.id === id,
      })),
    );
  };

  const removeImage = (id: string) => {
    setSelectedImages((current) => {
      const next = current.filter((image) => image.id !== id);
      const removed = current.find((image) => image.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      if (next.length && next.every((image) => !image.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }

      return next;
    });
    setImageError(null);
  };

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (!incoming.length) return;

    const nextImages: SelectedImage[] = [];
    let nextCount = selectedImagesRef.current.length;
    let nextPrimaryExists = selectedImagesRef.current.some((image) => image.isPrimary);

    for (const file of incoming) {
      if (nextCount >= maxImageCount) {
        setImageError(`You can add up to ${maxImageCount} images.`);
        break;
      }

      const validation = validateImageFile(file);
      if (validation) {
        setImageError(validation);
        continue;
      }

      const id = resolveKey("selected-image");
      const image: SelectedImage = {
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: inferAltText(file.name),
        isPrimary: !nextPrimaryExists,
        status: "idle",
      };

      if (image.isPrimary) {
        nextPrimaryExists = true;
      }

      nextImages.push(image);
      nextCount += 1;
    }

    if (nextImages.length) {
      setSelectedImages((current) => [...current, ...nextImages]);
    }
  };

  const uploadSelectedFiles = async (propertyId: string, slots: PropertyUploadSlot[]) => {
    if (!selectedImagesRef.current.length) {
      return;
    }

    setIsUploadingFiles(true);

    try {
      const nextSlots = slots.length
        ? slots
        : await Promise.all(
            selectedImagesRef.current.map((image) =>
              createPropertyMediaUploadUrl({
                propertyId,
                filename: image.file.name,
                mimeType: image.file.type || "image/jpeg",
                sizeBytes: image.file.size,
              }),
            ),
          );

      const mappedSlots: UploadSlotState[] = nextSlots.map((slot, index) => {
        const typedSlot = slot as PropertyUploadSlot & { altText?: string | null; isPrimary?: boolean };

        return {
          ...typedSlot,
          status: "pending",
          altText: typedSlot.altText ?? selectedImagesRef.current[index]?.altText ?? null,
          isPrimary: typeof typedSlot.isPrimary === "boolean" ? typedSlot.isPrimary : selectedImagesRef.current[index]?.isPrimary,
        };
      });

      setUploadSlots(mappedSlots);

      for (let index = 0; index < mappedSlots.length; index += 1) {
        const slot = mappedSlots[index];
        const image = selectedImagesRef.current[index];
        if (!slot || !image) {
          continue;
        }

        try {
          setUploadSlots((current) =>
            current.map((entry, currentIndex) =>
              currentIndex === index ? { ...entry, status: "uploading", error: undefined } : entry,
            ),
          );
          await uploadFile(slot.uploadUrl, image.file);
          setUploadSlots((current) =>
            current.map((entry, currentIndex) =>
              currentIndex === index ? { ...entry, status: "uploaded" } : entry,
            ),
          );
          setSelectedImages((current) =>
            current.map((entry) =>
              entry.id === image.id ? { ...entry, status: "uploaded", uploadUrl: slot.uploadUrl, publicUrl: slot.publicUrl } : entry,
            ),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Image upload failed.";
          setUploadSlots((current) =>
            current.map((entry, currentIndex) =>
              currentIndex === index ? { ...entry, status: "failed", error: message } : entry,
            ),
          );
          setSelectedImages((current) =>
            current.map((entry) => (entry.id === image.id ? { ...entry, status: "failed", error: message } : entry)),
          );
          throw error;
        }
      }
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: CreatePropertyFormValues) => {
      const propertyPayload: CreatePropertyPayload = {
        title: values.title.trim(),
        description: values.description,
        purpose: values.purpose,
        state: values.state.trim(),
        city: values.city.trim(),
        area: values.area.trim(),
        priceKobo: values.priceKobo.trim(),
        ...(typeof values.bedrooms === "number" ? { bedrooms: values.bedrooms } : {}),
        ...(typeof values.bathrooms === "number" ? { bathrooms: values.bathrooms } : {}),
      };

      if (!selectedImagesRef.current.length) {
        const property = await createProperty(propertyPayload);
        return { property, uploadSlots: [] as PropertyUploadSlot[] };
      }

      const imageMetadata: PropertyImageMetadataInput[] = selectedImagesRef.current.map((image, index) => ({
        filename: image.file.name,
        mimeType: image.file.type || "image/jpeg",
        sizeBytes: image.file.size,
        altText: image.altText.trim() || undefined,
        isPrimary: index === 0 || image.isPrimary,
      }));

      const created = await createPropertyWithImages({
        ...propertyPayload,
        images: imageMetadata,
      });

      return mapCreateResponse(created);
    },
    onSuccess: async ({ property, uploadSlots: responseUploadSlots }) => {
      if (!property?.id) {
        setSubmitError("The property was created, but the server did not return a property record.");
        return;
      }

      setCreatedProperty(property);
      setSubmitError(null);

      if (selectedImagesRef.current.length > 0) {
        try {
          await uploadSelectedFiles(property.id, responseUploadSlots);
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : "One or more images could not be uploaded.");
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      await queryClient.invalidateQueries({ queryKey: ["public-properties"] });
    },
    onError: (error) => {
      const parsedError = parseApiError(error);
      const fieldErrors = getFieldErrors(parsedError);

      Object.entries(fieldErrors).forEach(([field, fieldError]) => {
        if (field === "title" || field === "description" || field === "purpose" || field === "state" || field === "city" || field === "area" || field === "priceKobo" || field === "bedrooms" || field === "bathrooms") {
          setError(field as keyof CreatePropertyFormValues, {
            type: "server",
            message: fieldError.message,
          });
        }
      });

      setSubmitError(getApiErrorMessage(parsedError));
    },
  });

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files ?? []);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const clearForm = () => {
    setSubmitError(null);
    setImageError(null);
    setUploadSlots([]);
    setCreatedProperty(null);
    selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedImages([]);
    reset({
      title: "",
      description: "",
      purpose: "sale",
      state: "",
      city: "",
      area: "",
      priceKobo: "",
      bedrooms: undefined,
      bathrooms: undefined,
    });
  };

  const content = createdProperty ? (
    <div className="space-y-6">
      <div className="rounded-modal border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-success)_8%,var(--color-surface))_0%,var(--color-surface)_100%)] p-6 shadow-card">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] text-[var(--color-success)]">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-display text-h3 text-[var(--color-text-primary)]">Property created</h2>
        <p className="mt-2 max-w-2xl text-body text-[var(--color-text-secondary)]">
          {createdProperty.title} is ready. Uploads are listed below so you can confirm the gallery immediately.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/properties/${createdProperty.id}`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            View property
          </a>
          <a
            href={`/agent/listings/${createdProperty.id}/edit`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
          >
            Continue editing
          </a>
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
          >
            Create another
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Created data</p>
          <h3 className="mt-3 font-display text-h4 text-[var(--color-text-primary)]">{createdProperty.title}</h3>
          <p className="mt-2 text-body text-[var(--color-text-secondary)]">
            {createdProperty.area}, {createdProperty.city}, {createdProperty.state}
          </p>
          <p className="mt-4 text-caption text-[var(--color-text-secondary)]">
            Price kobo: {createdProperty.priceKobo}
          </p>
        </section>

        <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Upload slots</p>
          {isUploadingFiles ? (
            <p className="mt-3 text-body text-[var(--color-text-secondary)]">Uploading images...</p>
          ) : null}
          <div className="mt-4 space-y-3">
            {uploadSlots.length ? (
              uploadSlots.map((slot, index) => (
                <div key={`${slot.uploadUrl}-${index}`} className="rounded-input border border-[var(--color-border)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {slot.filename ?? selectedImages[index]?.file.name ?? `Image ${index + 1}`}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-small font-medium",
                        slot.status === "uploaded"
                          ? "bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]"
                          : slot.status === "failed"
                            ? "bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] text-[var(--color-danger)]"
                            : "bg-[var(--color-border)] text-[var(--color-text-secondary)]",
                      )}
                    >
                      {slot.status}
                    </span>
                  </div>
                  {slot.publicUrl ? <p className="mt-1 break-all text-caption text-[var(--color-text-secondary)]">{slot.publicUrl}</p> : null}
                  {slot.error ? <p className="mt-1 text-caption text-[var(--color-danger)]">{slot.error}</p> : null}
                </div>
              ))
            ) : (
              <EmptyState
                icon={ImageIcon}
                heading="No images"
                message="This listing was saved without images. You can add them later from the edit screen."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  ) : (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(null);
        await mutation.mutateAsync(values);
      })}
      noValidate
    >
      {submitError ? (
        <div className="rounded-input border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-caption text-[var(--color-danger)]" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="space-y-5 rounded-modal border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="space-y-1">
            <h2 className="font-display text-h4 text-[var(--color-text-primary)]">Property details</h2>
            <p className="text-body text-[var(--color-text-secondary)]">
              Add the essentials first. The description supports rich formatting and stays sanitized end to end.
            </p>
          </div>

          <div className="space-y-4">
            <FormField label="Title" htmlFor={fieldIds.title} error={errors.title?.message}>
              <input
                id={fieldIds.title}
                autoComplete="off"
                placeholder="Modern 3-bedroom apartment in Lekki"
                className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? `${fieldIds.title}-error` : undefined}
                {...register("title")}
              />
            </FormField>

            <RichTextEditorField<CreatePropertyFormValues>
              name="description"
              control={control}
              label="Description"
              required
              placeholder="Describe the property in detail. Include highlights, surroundings, and what makes it worth a closer look..."
              minHeight={400}
              maxCharacters={5000}
              showAlignment
              toolbarVariant="full"
              rules={{ required: "Property description is required" }}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Purpose" htmlFor={fieldIds.purpose}>
                <select
                  id={fieldIds.purpose}
                  {...register("purpose")}
                  className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                >
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                  <option value="short_let">Short let</option>
                </select>
              </FormField>

              <FormField label="Price (kobo)" htmlFor={fieldIds.priceKobo} error={errors.priceKobo?.message}>
                <input
                  id={fieldIds.priceKobo}
                  inputMode="numeric"
                  placeholder="125000000"
                  className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                  aria-invalid={Boolean(errors.priceKobo)}
                  aria-describedby={errors.priceKobo ? `${fieldIds.priceKobo}-error` : undefined}
                  {...register("priceKobo")}
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="State" htmlFor={fieldIds.state} error={errors.state?.message}>
                <input
                  id={fieldIds.state}
                  autoComplete="address-level1"
                  placeholder="Lagos"
                  className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                  aria-invalid={Boolean(errors.state)}
                  aria-describedby={errors.state ? `${fieldIds.state}-error` : undefined}
                  {...register("state")}
                />
              </FormField>

              <FormField label="City" htmlFor={fieldIds.city} error={errors.city?.message}>
                <input
                  id={fieldIds.city}
                  autoComplete="address-level2"
                  placeholder="Ikeja"
                  className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? `${fieldIds.city}-error` : undefined}
                  {...register("city")}
                />
              </FormField>
            </div>

            <FormField label="Area" htmlFor={fieldIds.area} error={errors.area?.message}>
              <input
                id={fieldIds.area}
                autoComplete="off"
                placeholder="Ikeja GRA"
                className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                aria-invalid={Boolean(errors.area)}
                aria-describedby={errors.area ? `${fieldIds.area}-error` : undefined}
                {...register("area")}
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Bedrooms" htmlFor={fieldIds.bedrooms} error={errors.bedrooms?.message}>
                <input
                  id={fieldIds.bedrooms}
                  inputMode="numeric"
                  placeholder="3"
                  className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                  aria-invalid={Boolean(errors.bedrooms)}
                  aria-describedby={errors.bedrooms ? `${fieldIds.bedrooms}-error` : undefined}
                  {...register("bedrooms", {
                    setValueAs: (value) => (value === "" || value === undefined ? undefined : Number(value)),
                  })}
                />
              </FormField>

              <FormField label="Bathrooms" htmlFor={fieldIds.bathrooms} error={errors.bathrooms?.message}>
                <input
                  id={fieldIds.bathrooms}
                  inputMode="numeric"
                  placeholder="2"
                  className="h-12 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                  aria-invalid={Boolean(errors.bathrooms)}
                  aria-describedby={errors.bathrooms ? `${fieldIds.bathrooms}-error` : undefined}
                  {...register("bathrooms", {
                    setValueAs: (value) => (value === "" || value === undefined ? undefined : Number(value)),
                  })}
                />
              </FormField>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploadingFiles}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting || isUploadingFiles ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create property
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="text-caption text-[var(--color-text-secondary)]">
                Description length: 50 to 5,000 characters.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-modal border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="space-y-1">
            <h3 className="font-display text-h4 text-[var(--color-text-primary)]">Images</h3>
            <p className="text-body text-[var(--color-text-secondary)]">
              Add up to 10 JPEG, PNG, or WebP files. Mark one image as primary before you submit.
            </p>
          </div>

          {imageError ? (
            <div className="rounded-input border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-caption text-[var(--color-danger)]" role="alert">
              {imageError}
            </div>
          ) : null}

          <div
            ref={dropZoneRef}
            className="rounded-card border border-dashed border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_96%,white)_0%,var(--color-surface)_100%)] p-5 transition hover:border-[var(--color-accent)]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Drop images here</p>
                <p className="text-caption text-[var(--color-text-secondary)]">
                  {imageCount}/{maxImageCount} selected. Only one primary image is allowed.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]">
                <ImagePlus className="h-4 w-4" />
                Add images
                <input
                  id={fileInputId}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelection}
                />
              </label>
            </div>
          </div>

          {imageCount ? (
            <div className="space-y-3">
              {primaryImageCount !== 1 ? (
                <div className="rounded-input border border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_10%,white)] px-4 py-3 text-caption text-[var(--color-warning)]">
                  Choose one primary image.
                </div>
              ) : null}

              <div className="grid gap-4">
                {selectedImages.map((image) => (
                  <article key={image.id} className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
                    <div className="grid gap-4 p-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                      <img
                        src={image.previewUrl}
                        alt={image.altText}
                        className="h-40 w-full rounded-card object-cover sm:h-full"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{image.file.name}</p>
                            <p className="text-caption text-[var(--color-text-secondary)]">
                              {formatBytes(image.file.size)} · {image.file.type || "image"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-small font-medium",
                              image.isPrimary
                                ? "bg-[color-mix(in_srgb,var(--color-accent)_10%,white)] text-[var(--color-accent)]"
                                : "bg-[var(--color-border)] text-[var(--color-text-secondary)]",
                            )}
                          >
                            {image.isPrimary ? "Primary" : "Secondary"}
                          </span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                          <FormField label="Alt text" htmlFor={`${image.id}-alt`}>
                            <input
                              id={`${image.id}-alt`}
                              value={image.altText}
                              onChange={(event) =>
                                setSelectedImages((current) =>
                                  current.map((entry) => (entry.id === image.id ? { ...entry, altText: event.target.value } : entry)),
                                )
                              }
                              className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                              placeholder="Describe this image"
                            />
                          </FormField>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(image.id)}
                              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                            >
                              <Star className="h-4 w-4" />
                              Make primary
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-danger)] transition hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,white)]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Upload}
              heading="No images yet"
              message="Add listing photos now or save the property first and finish the gallery later."
              action={
                <button
                  type="button"
                  onClick={() => dropZoneRef.current?.querySelector<HTMLInputElement>("input[type=file]")?.click()}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
                >
                  Select images
                </button>
              }
            />
          )}

          <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-caption text-[var(--color-text-secondary)]">
              Limit is 10 images, 10MB each. JPEG, PNG, and WebP only. One image must be primary.
            </p>
          </div>
        </section>
      </div>
    </form>
  );

  return (
    <section className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Property manager</p>
        <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Create a property</h1>
        <p className="max-w-2xl text-body text-[var(--color-text-secondary)]">
          Add the listing details, format the description beautifully, and attach images in one polished flow.
        </p>
      </div>

      {mutation.isPending && !createdProperty ? (
        <div className="space-y-4 rounded-modal border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <SkeletonLoader height="48px" />
          <SkeletonLoader height="220px" />
          <SkeletonLoader height="220px" />
        </div>
      ) : (
        content
      )}
    </section>
  );
}
