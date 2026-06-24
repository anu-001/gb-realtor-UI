import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { createPublicLead } from "@/services/leads.service";
import { RichTextEditorField } from "@/components/ui/RichTextEditorField";
import { getApiErrorMessage, getFieldErrors, parseApiError } from "@/utils/api-error";
import { htmlTextLength, stripHtml } from "@/utils/html-text-length";
import { cn } from "@/utils/cn";

const citySuggestions = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Enugu",
  "Benin City",
  "Owerri",
  "Kaduna",
  "Ilorin",
  "Abeokuta",
  "Uyo",
  "Warri",
  "Asaba",
  "Calabar",
];

function isValidNigerianPhone(value: string): boolean {
  return /^(?:\+234|0)[789][01]\d{8}$/.test(value.replace(/\s+/g, ""));
}

const requestPropertySchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isValidNigerianPhone, "Enter a valid Nigerian phone number"),
  email: z.string().trim().min(1, "Email address is required").email("Enter a valid email address"),
  preferredLocation: z.string().trim().min(1, "Preferred location is required"),
  budgetKobo: z
    .string()
    .optional()
    .transform((value) => {
      const digits = value?.replace(/[^\d]/g, "");
      return digits && digits.length > 0 ? digits : undefined;
    }),
  propertyInterest: z.string().trim().min(1, "Property interest is required"),
  inquiryNotes: z
    .string()
    .refine((html) => htmlTextLength(html) > 0, "Tell us a little about what you need")
    .refine((html) => htmlTextLength(html) <= 1000, "Notes must not exceed 1000 characters"),
  source: z.string().optional(),
  website: z.string().max(0, "Spam detected").optional(),
});

type RequestPropertyFormInput = z.input<typeof requestPropertySchema>;
type RequestPropertyFormValues = z.output<typeof requestPropertySchema>;

type RequestPropertyFormProps = {
  propertyId?: string;
  propertyTitle?: string;
  preferredLocation?: string;
  headline?: string;
  subheading?: string;
  submitLabel?: string;
  source?: string;
  className?: string;
  compact?: boolean;
};

function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
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

export function RequestPropertyForm({
  propertyId,
  propertyTitle,
  preferredLocation,
  headline = "Request a Property",
  subheading = "Share the brief. We’ll send a sharp follow-up within 24 hours.",
  submitLabel = "Request Property",
  source = "website",
  className,
  compact = false,
}: RequestPropertyFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const noteEditorId = useId();
  const fieldIds = useMemo(
    () => ({
      fullName: `request-full-name-${noteEditorId}`,
      phoneNumber: `request-phone-number-${noteEditorId}`,
      email: `request-email-${noteEditorId}`,
      preferredLocation: `request-location-${noteEditorId}`,
      budgetKobo: `request-budget-${noteEditorId}`,
      propertyInterest: `request-interest-${noteEditorId}`,
      inquiryNotes: `request-notes-${noteEditorId}`,
      website: `request-website-${noteEditorId}`,
    }),
    [noteEditorId],
  );

  const {
    register,
    control,
    handleSubmit,
    setFocus,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestPropertyFormInput, unknown, RequestPropertyFormValues>({
    resolver: zodResolver(requestPropertySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      preferredLocation: preferredLocation ?? "",
      budgetKobo: "",
      propertyInterest: "",
      inquiryNotes: "",
      source,
      website: "",
    },
  });

  useEffect(() => {
    if (!preferredLocation) {
      return;
    }

    setValue("preferredLocation", preferredLocation, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [preferredLocation, setValue]);

  const focusFirstError = (fieldNames: Array<keyof RequestPropertyFormValues>) => {
    if (!fieldNames.length) return;
    const firstError = fieldNames[0];
    if (firstError === "inquiryNotes") {
      window.requestAnimationFrame(() => {
        document.getElementById(fieldIds.inquiryNotes)?.focus();
      });
      return;
    }
    setFocus(firstError);
  };

  const onSubmit = handleSubmit(
    async (values) => {
      setSubmitError(null);

      try {
        const normalizedNotes = stripHtml(values.inquiryNotes).replace(/\s+/g, " ").trim();
        await createPublicLead({
          ...(propertyId ? { propertyId } : {}),
          fullName: values.fullName.trim(),
          phoneNumber: values.phoneNumber.replace(/\s+/g, ""),
          email: values.email.trim(),
          preferredLocation: values.preferredLocation.trim(),
          budgetKobo: values.budgetKobo,
          propertyInterest: values.propertyInterest.trim(),
          inquiryNotes: values.inquiryNotes,
          message: normalizedNotes.slice(0, 500) || undefined,
          source: values.source?.trim() || source,
          website: values.website,
        });
        setSubmittedName(values.fullName.trim());
      } catch (error) {
        const parsedError = parseApiError(error);
        const fieldErrors = getFieldErrors(parsedError);

        Object.entries(fieldErrors).forEach(([field, fieldError]) => {
          setError(field as keyof RequestPropertyFormValues, {
            type: "server",
            message: fieldError.message,
          });
        });

        setSubmitError(
          parsedError.statusCode === 429
            ? "Too many requests, please try again later."
            : getApiErrorMessage(parsedError),
        );
      }
    },
    (fieldErrors) => {
      const orderedFields: Array<keyof RequestPropertyFormValues> = [
        "fullName",
        "phoneNumber",
        "email",
        "preferredLocation",
        "budgetKobo",
        "propertyInterest",
        "inquiryNotes",
      ];
      focusFirstError(orderedFields.filter((field) => Boolean(fieldErrors[field])));
    },
  );

  const hasContext = Boolean(propertyTitle || preferredLocation);

  return (
    <section
      className={cn(
        "ui-surface-strong overflow-hidden",
        className,
      )}
    >
      {!compact ? (
        <div className="border-b border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_97%,white)_0%,var(--color-surface)_100%)] p-6 md:p-8">
          <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Request details</p>
          <h2 className="mt-5 font-display text-h2 text-[var(--color-text-primary)]">{headline}</h2>
          <p className="mt-3 max-w-2xl text-body-lg text-[var(--color-text-secondary)]">{subheading}</p>
        </div>
      ) : null}

      <div className={cn("p-6 md:p-8", compact && "md:p-10")}>
        {compact ? (
          <div className="mb-6 flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Request details</p>

            {hasContext ? (
              <div className="max-w-sm rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                {propertyTitle ? <p className="font-display text-h4 text-[var(--color-text-primary)]">{propertyTitle}</p> : null}
                {preferredLocation ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-body text-[var(--color-text-secondary)]">
                    <MapPin className="h-4 w-4" />
                    {preferredLocation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

          <AnimatePresence mode="wait">
            {submittedName ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex min-h-[22rem] flex-col justify-center rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-success)_8%,var(--color-surface))_0%,var(--color-surface)_100%)] p-6 text-[var(--color-text-primary)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] text-[var(--color-success)]">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-h3 text-[var(--color-text-primary)]">
                  Thanks, {submittedName}!
                </h2>
                <p className="mt-3 max-w-xl text-body text-[var(--color-text-secondary)]">
                  We received your request and will contact you within 24 hours with the next best matches.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/search"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
                  >
                    Continue browsing
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedName(null);
                      reset({
                        fullName: "",
                        phoneNumber: "",
                        email: "",
                        preferredLocation: preferredLocation ?? "",
                        budgetKobo: "",
                        propertyInterest: "",
                        inquiryNotes: "",
                        source,
                        website: "",
                      });
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
                  >
                    Send another request
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={onSubmit}
                className="space-y-5"
                noValidate
              >
                {submitError ? (
                  <div className="rounded-input border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-caption text-[var(--color-danger)]" role="alert">
                    {submitError}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Full name" htmlFor={fieldIds.fullName} error={errors.fullName?.message}>
                    <input
                      id={fieldIds.fullName}
                      autoComplete="name"
                      placeholder="Jane Doe"
                      className="ui-field"
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? `${fieldIds.fullName}-error` : undefined}
                      {...register("fullName")}
                    />
                  </FormField>

                  <FormField
                    label="Phone number"
                    htmlFor={fieldIds.phoneNumber}
                    error={errors.phoneNumber?.message}
                  >
                    <input
                      id={fieldIds.phoneNumber}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+2348012345678"
                      className="ui-field"
                      aria-invalid={Boolean(errors.phoneNumber)}
                      aria-describedby={errors.phoneNumber ? `${fieldIds.phoneNumber}-error` : undefined}
                      {...register("phoneNumber")}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Email address" htmlFor={fieldIds.email} error={errors.email?.message}>
                    <input
                      id={fieldIds.email}
                      type="email"
                      autoComplete="email"
                      placeholder="jane@example.com"
                      className="ui-field"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? `${fieldIds.email}-error` : undefined}
                      {...register("email")}
                    />
                  </FormField>

                  <FormField
                    label="Preferred location"
                    htmlFor={fieldIds.preferredLocation}
                    error={errors.preferredLocation?.message}
                  >
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[var(--color-accent)]">
                      <MapPin className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <input
                        id={fieldIds.preferredLocation}
                        list={`${fieldIds.preferredLocation}-cities`}
                        autoComplete="off"
                        className="w-full bg-transparent text-body text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
                        placeholder="Lagos"
                        aria-invalid={Boolean(errors.preferredLocation)}
                        aria-describedby={errors.preferredLocation ? `${fieldIds.preferredLocation}-error` : undefined}
                        {...register("preferredLocation")}
                      />
                      <datalist id={`${fieldIds.preferredLocation}-cities`}>
                        {citySuggestions.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </div>
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <FormField
                    label="Budget"
                    htmlFor={fieldIds.budgetKobo}
                    error={errors.budgetKobo?.message}
                  >
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[var(--color-accent)]">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">₦</span>
                      <input
                        id={fieldIds.budgetKobo}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="Optional"
                        className="w-full bg-transparent text-body text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
                        aria-invalid={Boolean(errors.budgetKobo)}
                        aria-describedby={errors.budgetKobo ? `${fieldIds.budgetKobo}-error` : undefined}
                        {...register("budgetKobo", {
                          setValueAs: (value) => {
                            if (typeof value !== "string") {
                              return undefined;
                            }
                            const digits = value.replace(/[^\d]/g, "");
                            return digits.length > 0 ? digits : undefined;
                          },
                        })}
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Property interest"
                    htmlFor={fieldIds.propertyInterest}
                    error={errors.propertyInterest?.message}
                  >
                    <input
                      id={fieldIds.propertyInterest}
                      autoComplete="off"
                      placeholder="3-bedroom apartment"
                      className="ui-field"
                      aria-invalid={Boolean(errors.propertyInterest)}
                      aria-describedby={errors.propertyInterest ? `${fieldIds.propertyInterest}-error` : undefined}
                      {...register("propertyInterest")}
                    />
                  </FormField>
                </div>

                <RichTextEditorField
                  id={fieldIds.inquiryNotes}
                  name="inquiryNotes"
                  control={control}
                  label="Notes"
              placeholder="Example: 3-bedroom apartment in Lekki, gated estate, budget under 150m."
                  minHeight={140}
                  maxCharacters={1000}
                  toolbarVariant="editorial"
                  required
                  rules={{ required: "Tell us a little about what you need" }}
                />

                <input type="hidden" value={source} {...register("source")} />
                <input type="hidden" value="" aria-hidden="true" tabIndex={-1} autoComplete="off" {...register("website")} />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg text-caption text-[var(--color-text-secondary)]">
                    We only use this to reply with suitable properties and next steps.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ui-button-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Sending...
                      </>
                    ) : (
                      <>
                        {submitLabel}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>
  );
}
