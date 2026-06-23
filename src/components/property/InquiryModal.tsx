import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { RichTextEditorField } from "@/components/ui/RichTextEditorField";
import { createPublicLead } from "@/services/leads.service";
import { htmlTextLength } from "@/utils/html-text-length";
import { cn } from "@/utils/cn";

const inquirySchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  inquiryNotes: z
    .string()
    .refine((html) => htmlTextLength(html) > 0, "Inquiry notes are required")
    .refine((html) => htmlTextLength(html) <= 1000, "Inquiry notes must not exceed 1000 characters"),
});

type InquiryValues = z.infer<typeof inquirySchema>;

type InquiryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle?: string;
  preferredLocation?: string;
};

export function InquiryModal({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  preferredLocation,
}: InquiryModalProps) {
  const [submittedName, setSubmittedName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      inquiryNotes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      setSubmitError(null);
      setSubmittedName("");
    }
  }, [open, reset]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100%-1.5rem,42rem)] -translate-x-1/2 -translate-y-1/2",
            "max-h-[min(90vh,52rem)] overflow-y-auto rounded-modal border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-modal outline-none",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-h4 text-[var(--color-text-primary)]">
                Inquire about this property
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-body text-[var(--color-text-secondary)]">
                {propertyTitle ? `${propertyTitle}${preferredLocation ? ` · ${preferredLocation}` : ""}` : "Share your requirements and we’ll get back to you."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
              aria-label="Close inquiry modal"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {submitError ? (
            <div className="mt-4 rounded-input border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-caption text-[var(--color-danger)]" role="alert">
              {submitError}
            </div>
          ) : null}

          {submittedName ? (
            <div className="mt-6 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-body text-[var(--color-text-primary)]">
              Thank you {submittedName}, we will contact you within 24 hours.
            </div>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(async (values) => {
                setSubmitError(null);
                try {
                  await createPublicLead({
                    propertyId,
                    fullName: values.fullName,
                    email: values.email,
                    phoneNumber: values.phoneNumber.trim(),
                    inquiryNotes: values.inquiryNotes,
                    preferredLocation,
                    source: "website-form",
                  });
                  setSubmittedName(values.fullName);
                } catch (error) {
                  const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : undefined;
                  setSubmitError(statusCode === 429 ? "Too many requests, please try again later" : "Something went wrong, please try again");
                }
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="inquiry-full-name" className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
                    Full name
                  </label>
                  <input
                    id="inquiry-full-name"
                    className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                    {...register("fullName")}
                  />
                  {errors.fullName?.message ? <p className="mt-1 text-caption text-[var(--color-danger)]">{errors.fullName.message}</p> : null}
                </div>
                <div>
                  <label htmlFor="inquiry-email" className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
                    Email
                  </label>
                  <input
                    id="inquiry-email"
                    type="email"
                    className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                    {...register("email")}
                  />
                  {errors.email?.message ? <p className="mt-1 text-caption text-[var(--color-danger)]">{errors.email.message}</p> : null}
                </div>
              </div>

                <div>
                  <label htmlFor="inquiry-phone-number" className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
                    Phone number
                  </label>
                  <input
                    id="inquiry-phone-number"
                    required
                    className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-body text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                    {...register("phoneNumber")}
                  />
                  {errors.phoneNumber?.message ? <p className="mt-1 text-caption text-[var(--color-danger)]">{errors.phoneNumber.message}</p> : null}
                </div>

              <RichTextEditorField
                name="inquiryNotes"
                control={control}
                label="Inquiry Notes"
                placeholder="Tell us what you are looking for, any specific requirements, your timeline, or questions you have..."
                minHeight={120}
                maxCharacters={1000}
                toolbarVariant="minimal"
                rules={{ required: "Inquiry notes are required" }}
              />

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <Dialog.Close className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : "Submit inquiry"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
