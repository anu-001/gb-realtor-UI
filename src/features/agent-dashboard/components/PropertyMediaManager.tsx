import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImageIcon, ImagePlus, Trash2 } from "lucide-react";
import { createPropertyMediaUploadUrl, confirmPropertyImage, deletePropertyImage, listPropertyMedia, reorderPropertyImages } from "@/services/media.service";
import { cn } from "@/utils/cn";
import type { PropertyImage } from "@/types/property";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { EmptyState } from "@/components/feedback/EmptyState";

type PropertyMediaManagerProps = {
  propertyId: string;
};

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
}

export function PropertyMediaManager({ propertyId }: PropertyMediaManagerProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imagesQuery = useQuery({
    queryKey: ["property-images", propertyId],
    queryFn: () => listPropertyMedia(propertyId),
  });

  const refreshImages = () => queryClient.invalidateQueries({ queryKey: ["property-images", propertyId] });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const upload = await createPropertyMediaUploadUrl({
        propertyId,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
      });
      await uploadFile(upload.uploadUrl, file);
      return confirmPropertyImage(upload.assetId, { altText: file.name });
    },
    onSuccess: refreshImages,
  });

  const reorderMutation = useMutation({
    mutationFn: (imageIds: string[]) => reorderPropertyImages(propertyId, imageIds),
    onSuccess: refreshImages,
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deletePropertyImage(imageId),
    onSuccess: refreshImages,
  });

  const images = useMemo(() => imagesQuery.data ?? [], [imagesQuery.data]);

  const onFileChange = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync(file);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const next = [...images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    await reorderMutation.mutateAsync(next.map((image) => image.id));
  };

  return (
    <section className="space-y-5 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-h4 text-[var(--color-text-primary)]">Property media</h3>
          <p className="text-body text-[var(--color-text-secondary)]">Upload, reorder, and manage the listing gallery.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-input border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]">
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Uploading..." : "Add images"}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(event) => void onFileChange(event.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {uploadError ? <p className="rounded-input border border-[var(--color-danger)] px-4 py-3 text-caption text-[var(--color-danger)]">{uploadError}</p> : null}

      {imagesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLoader key={index} height="220px" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          heading="No images uploaded yet"
          message="Upload the first set of listing photos to make this property easier to review and publish."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <MediaCard
              key={image.id}
              image={image}
              onMoveUp={() => void moveImage(index, -1)}
              onMoveDown={() => void moveImage(index, 1)}
              onDelete={() => {
                if (window.confirm("Delete this image?")) {
                  void deleteMutation.mutateAsync(image.id);
                }
              }}
              canMoveUp={index > 0}
              canMoveDown={index < images.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MediaCard({
  image,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
}: {
  image: PropertyImage;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const altText = toText(image.altText);

  return (
    <article className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
      <img
        src={image.publicUrl}
        alt={altText && altText.length > 0 ? altText : image.filename}
        className="h-48 w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{image.filename}</p>
            <p className="text-caption text-[var(--color-text-secondary)]">{image.isPrimary ? "Primary image" : `Order ${image.sortOrder}`}</p>
          </div>
          <span className={cn("rounded-full px-2 py-1 text-small font-medium", image.status === "available" ? "bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]" : "bg-[var(--color-border)] text-[var(--color-text-secondary)]")}>
            {image.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] disabled:opacity-40"
            aria-label="Move image up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] disabled:opacity-40"
            aria-label="Move image down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-danger)] transition hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,white)]"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
