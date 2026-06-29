import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { createPublicLead } from "@/services/leads.service";
import { getApiErrorMessage, getFieldErrors, parseApiError } from "@/utils/api-error";
import { cn } from "@/utils/cn";
import { formatNumberWithCommas, stripNumberFormatting } from "@/utils/formatters";

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

const countryCodes = [
  { label: "NG", value: "+234" },
  { label: "GH", value: "+233" },
  { label: "UK", value: "+44" },
  { label: "US", value: "+1" },
];

function isValidPhone(value: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(value.replace(/[\s-]/g, ""));
}

function createRequestPropertySchema(variant: RequestFormVariant) {
  return z
    .object({
      fullName: z.string().trim().min(1, "Full name is required"),
      countryCode: z.string().trim().min(1),
      phoneNumber: z.string().trim().min(1, "Phone number is required"),
      email: z.string().trim().min(1, "Email address is required").email("Enter a valid email address"),
      preferredLocation: z.string().trim().optional(),
      budgetKobo: z.string().optional().transform(stripNumberFormatting),
      propertyInterest: z.string().trim().optional(),
      inquiryNotes: z.string().trim().min(1, "Tell us a little about what you need").max(5000, "Notes must not exceed 5000 characters"),
      source: z.string().optional(),
      website: z.string().max(0, "Spam detected").optional(),
    })
    .superRefine((value, context) => {
      if (!isValidPhone(`${value.countryCode}${value.phoneNumber}`)) {
        context.addIssue({ code: "custom", path: ["phoneNumber"], message: "Enter a valid phone number" });
      }

      if (variant === "generic") {
        if (!value.preferredLocation?.trim()) {
          context.addIssue({ code: "custom", path: ["preferredLocation"], message: "Preferred location is required" });
        }
        if (!value.propertyInterest?.trim()) {
          context.addIssue({ code: "custom", path: ["propertyInterest"], message: "Property interest is required" });
        }
      }
    });
}

type RequestFormVariant = "generic" | "property_specific";
type RequestPropertySchema = ReturnType<typeof createRequestPropertySchema>;
type RequestPropertyFormInput = z.input<RequestPropertySchema>;
type RequestPropertyFormValues = z.output<RequestPropertySchema>;

type RequestPropertyFormProps = {
  variant?: RequestFormVariant;
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
  variant = "generic",
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
      countryCode: `request-country-code-${noteEditorId}`,
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
  const schema = useMemo(() => createRequestPropertySchema(variant), [variant]);
  const isPropertySpecific = variant === "property_specific";

  const {
    register,
    handleSubmit,
    setFocus,
    setError,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequestPropertyFormInput, unknown, RequestPropertyFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: {
      fullName: "",
      countryCode: "+234",
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

  const inquiryNotes = watch("inquiryNotes") ?? "";
  const budgetValue = watch("budgetKobo") ?? "";
  const budgetRegistration = register("budgetKobo");

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
        const normalizedNotes = values.inquiryNotes.replace(/\s+/g, " ").trim();
        await createPublicLead({
          ...(propertyId ? { propertyId } : {}),
          fullName: values.fullName.trim(),
          phoneNumber: `${values.countryCode}${values.phoneNumber}`.replace(/[\s-]/g, ""),
          email: values.email.trim(),
          ...(isPropertySpecific ? {} : { preferredLocation: values.preferredLocation?.trim() ?? "" }),
          ...(isPropertySpecific || !values.budgetKobo ? {} : { budgetKobo: values.budgetKobo }),
          ...(isPropertySpecific ? {} : { propertyInterest: values.propertyInterest?.trim() ?? "" }),
          inquiryNotes: values.inquiryNotes.trim(),
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
        ...(isPropertySpecific ? [] : (["preferredLocation", "budgetKobo", "propertyInterest"] as const)),
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
                        countryCode: "+234",
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
                      className="ui-field placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? `${fieldIds.fullName}-error` : undefined}
                      {...register("fullName")}
                    />
                  </FormField>

                  <FormField label="Phone number" htmlFor={fieldIds.phoneNumber} error={errors.phoneNumber?.message}>
                    <div className="flex min-h-12 overflow-hidden rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] transition focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]">
                      <label htmlFor={fieldIds.countryCode} className="sr-only">Country code</label>
                      <select
                        id={fieldIds.countryCode}
                        className="min-h-12 border-r border-[var(--color-border)] bg-transparent px-3 text-sm font-medium text-[var(--color-text-primary)] outline-none"
                        {...register("countryCode")}
                      >
                        {countryCodes.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label} {country.value}
                          </option>
                        ))}
                      </select>
                      <input
                        id={fieldIds.phoneNumber}
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="801 234 5678"
                        className="min-h-12 w-full bg-transparent px-4 text-body text-[var(--color-text-primary)] outline-none placeholder:text-gray-500"
                        aria-invalid={Boolean(errors.phoneNumber)}
                        aria-describedby={errors.phoneNumber ? `${fieldIds.phoneNumber}-error` : undefined}
                        {...register("phoneNumber")}
                      />
                    </div>
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Email address" htmlFor={fieldIds.email} error={errors.email?.message}>
                    <input
                      id={fieldIds.email}
                      type="email"
                      autoComplete="email"
                      placeholder="jane@example.com"
                      className="ui-field placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? `${fieldIds.email}-error` : undefined}
                      {...register("email")}
                    />
                  </FormField>

                  {!isPropertySpecific ? (
                    <FormField
                      label="Preferred location"
                      htmlFor={fieldIds.preferredLocation}
                      error={errors.preferredLocation?.message}
                    >
                      <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]">
                        <MapPin className="h-4 w-4 text-[var(--color-text-secondary)]" />
                        <input
                          id={fieldIds.preferredLocation}
                          list={`${fieldIds.preferredLocation}-cities`}
                          autoComplete="off"
                          className="w-full bg-transparent text-body text-[var(--color-text-primary)] outline-none placeholder:text-gray-500"
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
                  ) : null}
                </div>

                {!isPropertySpecific ? (
                  <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <FormField
                    label="Budget"
                    htmlFor={fieldIds.budgetKobo}
                    error={errors.budgetKobo?.message}
                  >
                    <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">₦</span>
                      <input
                        id={fieldIds.budgetKobo}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="150,000,000"
                        value={budgetValue}
                        className="w-full bg-transparent text-body text-[var(--color-text-primary)] outline-none placeholder:text-gray-500"
                        aria-invalid={Boolean(errors.budgetKobo)}
                        aria-describedby={errors.budgetKobo ? `${fieldIds.budgetKobo}-error` : undefined}
                        name={budgetRegistration.name}
                        ref={budgetRegistration.ref}
                        onBlur={budgetRegistration.onBlur}
                        onChange={(event) => {
                          setValue("budgetKobo", formatNumberWithCommas(event.target.value), { shouldDirty: true, shouldValidate: false });
                        }}
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
                      className="ui-field placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      aria-invalid={Boolean(errors.propertyInterest)}
                      aria-describedby={errors.propertyInterest ? `${fieldIds.propertyInterest}-error` : undefined}
                      {...register("propertyInterest")}
                    />
                  </FormField>
                  </div>
                ) : null}

                <FormField label="What do you need?" htmlFor={fieldIds.inquiryNotes} error={errors.inquiryNotes?.message}>
                  <textarea
                    id={fieldIds.inquiryNotes}
                    rows={compact ? 6 : 8}
                    maxLength={5000}
                    placeholder="Example: 3-bedroom apartment in Lekki, gated estate, budget under 150m."
                    className="min-h-[160px] w-full resize-y rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-body leading-7 text-[var(--color-text-primary)] outline-none transition placeholder:text-gray-500 focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-invalid={Boolean(errors.inquiryNotes)}
                    aria-describedby={errors.inquiryNotes ? `${fieldIds.inquiryNotes}-error` : `${fieldIds.inquiryNotes}-counter`}
                    {...register("inquiryNotes")}
                  />
                  <p id={`${fieldIds.inquiryNotes}-counter`} className="text-right text-small text-slate-700">
                    {inquiryNotes.length} / 5000 characters
                  </p>
                </FormField>

                <input type="hidden" value={source} {...register("source")} />
                <input type="hidden" value="" aria-hidden="true" tabIndex={-1} autoComplete="off" {...register("website")} />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg text-caption text-slate-700">
                    Our luxury agents review all briefs and typically respond within 2 hours.
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
