import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createPublicPropertyRequest } from "@/services/leads.service";
import {
  getApiErrorMessage,
  getFieldErrors,
  parseApiError,
} from "@/utils/api-error";
import { cn } from "@/utils/cn";
import {
  formatNumberWithCommas,
  stripNumberFormatting,
} from "@/utils/formatters";

const countryCodes = [
  { label: "NG", value: "+234" },
  { label: "GH", value: "+233" },
  { label: "UK", value: "+44" },
  { label: "US", value: "+1" },
];

function isValidPhone(value: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(value.replace(/[\s-]/g, ""));
}

const publicRequestSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  countryCode: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Enter a valid email address",
    ),
  preferredLocation: z.string().trim().optional(),
  budgetKobo: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return stripNumberFormatting(value);
    }),
  propertyInterest: z.string().trim().optional(),
  inquiryNotes: z
    .string()
    .trim()
    .min(1, "Tell us what you need")
    .max(5000, "Brief must not exceed 5000 characters"),
  message: z.string().trim().optional(),
  source: z.string().optional(),
  website: z.string().max(0, "Spam detected").optional(),
});

type PublicRequestFormInput = z.input<typeof publicRequestSchema>;
type PublicRequestFormValues = z.output<typeof publicRequestSchema>;

type PublicRequestPropertyFormProps = {
  className?: string;
  headline?: string;
  subheading?: string;
  submitLabel?: string;
  source?: string;
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
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p
          id={hintId}
          className="text-caption text-[var(--color-text-secondary)]"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="text-caption text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PublicRequestPropertyForm({
  className,
  headline = "Request a property",
  subheading = "Share what you need. We’ll match the brief and follow up quickly.",
  submitLabel = "Send request",
  source = "request-property",
}: PublicRequestPropertyFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const formId = useId();
  const fieldIds = {
    fullName: `public-request-full-name-${formId}`,
    countryCode: `public-request-country-code-${formId}`,
    phoneNumber: `public-request-phone-number-${formId}`,
    email: `public-request-email-${formId}`,
    preferredLocation: `public-request-location-${formId}`,
    budgetKobo: `public-request-budget-${formId}`,
    propertyInterest: `public-request-interest-${formId}`,
    inquiryNotes: `public-request-notes-${formId}`,
    website: `public-request-website-${formId}`,
  };

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PublicRequestFormInput, unknown, PublicRequestFormValues>({
    resolver: zodResolver(publicRequestSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      fullName: "",
      countryCode: "+234",
      phoneNumber: "",
      email: "",
      preferredLocation: "",
      budgetKobo: "",
      propertyInterest: "",
      inquiryNotes: "",
      message: "",
      source,
      website: "",
    },
  });

  const inquiryNotes = watch("inquiryNotes") ?? "";
  const budgetValue = watch("budgetKobo") ?? "";
  const budgetRegistration = register("budgetKobo");

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (!isValidPhone(`${values.countryCode}${values.phoneNumber}`)) {
      setError("phoneNumber", {
        type: "validate",
        message: "Enter a valid phone number",
      });
      return;
    }

    try {
      await createPublicPropertyRequest({
        fullName: values.fullName.trim(),
        phoneNumber: `${values.countryCode}${values.phoneNumber}`.replace(
          /[\s-]/g,
          "",
        ),
        ...(values.email?.trim() ? { email: values.email.trim() } : {}),
        ...(values.preferredLocation?.trim()
          ? { preferredLocation: values.preferredLocation.trim() }
          : {}),
        ...(values.budgetKobo ? { budgetKobo: values.budgetKobo } : {}),
        ...(values.propertyInterest?.trim()
          ? { propertyInterest: values.propertyInterest.trim() }
          : {}),
        inquiryNotes: values.inquiryNotes.trim(),
        message: values.inquiryNotes.trim().slice(0, 500),
        source: values.source?.trim() || source,
        website: values.website,
      });
      setSubmittedName(values.fullName.trim());
    } catch (error) {
      const parsedError = parseApiError(error);
      const fieldErrors = getFieldErrors(parsedError);

      Object.entries(fieldErrors).forEach(([field, fieldError]) => {
        setError(field as keyof PublicRequestFormInput, {
          type: "server",
          message: fieldError.message,
        });
      });

      setSubmitError(getApiErrorMessage(parsedError));
    }
  });

  return (
    <section className={cn("ui-surface-strong overflow-hidden", className)}>
      <div className="border-b border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_97%,white)_0%,var(--color-surface)_100%)] p-6 md:p-8">
        <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Request details
        </p>
        <h2 className="mt-5 font-display text-h2 text-[var(--color-text-primary)]">
          {headline}
        </h2>
        <p className="mt-3 max-w-2xl text-body-lg text-[var(--color-text-secondary)]">
          {subheading}
        </p>
      </div>

      <div className="p-6 md:p-10">
        <AnimatePresence mode="wait">
          {submittedName ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex min-h-[22rem] flex-col justify-center rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-success)_8%,var(--color-surface))_0%,var(--color-surface)_100%)] p-6"
              role="status"
              aria-live="polite"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] text-[var(--color-success)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-h3 text-[var(--color-text-primary)]">
                Thanks, {submittedName}!
              </h3>
              <p className="mt-3 max-w-xl text-body text-[var(--color-text-secondary)]">
                We’ve received your request and will follow up within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmittedName(null);
                  reset({
                    fullName: "",
                    countryCode: "+234",
                    phoneNumber: "",
                    email: "",
                    preferredLocation: "",
                    budgetKobo: "",
                    propertyInterest: "",
                    inquiryNotes: "",
                    message: "",
                    source,
                    website: "",
                  });
                }}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
              >
                Send another request
              </button>
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
                <div
                  className="rounded-input border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-caption text-[var(--color-danger)]"
                  role="alert"
                >
                  {submitError}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Full name"
                  htmlFor={fieldIds.fullName}
                  error={errors.fullName?.message}
                >
                  <input
                    id={fieldIds.fullName}
                    autoComplete="name"
                    placeholder="Jane Doe"
                    className="ui-field placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={
                      errors.fullName ? `${fieldIds.fullName}-error` : undefined
                    }
                    {...register("fullName")}
                  />
                </FormField>

                <FormField
                  label="Phone number"
                  htmlFor={fieldIds.phoneNumber}
                  error={errors.phoneNumber?.message}
                >
                  <div className="flex h-12 w-full min-w-0 overflow-hidden rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] transition focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-1">
                    <div className="flex flex-none items-center border-r border-[var(--color-border)] bg-[var(--color-surface)] px-2">
                      <label htmlFor={fieldIds.countryCode} className="sr-only">
                        Country code
                      </label>
                      <select
                        id={fieldIds.countryCode}
                        className="h-full w-[5.75rem] bg-transparent text-sm font-medium text-[var(--color-text-primary)] outline-none"
                        {...register("countryCode")}
                      >
                        {countryCodes.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label} {country.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      id={fieldIds.phoneNumber}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="801 234 5678"
                      className="h-full w-0 min-w-0 flex-1 bg-transparent px-3 text-body text-[var(--color-text-primary)] outline-none placeholder:text-gray-500"
                      aria-invalid={Boolean(errors.phoneNumber)}
                      aria-describedby={
                        errors.phoneNumber
                          ? `${fieldIds.phoneNumber}-error`
                          : undefined
                      }
                      {...register("phoneNumber")}
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormField
                    label="Email address"
                    htmlFor={fieldIds.email}
                    error={errors.email?.message}
                  >
                    <input
                      id={fieldIds.email}
                      type="email"
                      autoComplete="email"
                      placeholder="jane@example.com"
                      className="ui-field placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? `${fieldIds.email}-error` : undefined
                      }
                      {...register("email")}
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="Preferred location"
                    htmlFor={fieldIds.preferredLocation}
                    error={errors.preferredLocation?.message}
                  >
                    <input
                      id={fieldIds.preferredLocation}
                      autoComplete="off"
                      placeholder="Lekki"
                      className="ui-field placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      aria-invalid={Boolean(errors.preferredLocation)}
                      aria-describedby={
                        errors.preferredLocation
                          ? `${fieldIds.preferredLocation}-error`
                          : undefined
                      }
                      {...register("preferredLocation")}
                    />
                  </FormField>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Budget"
                  htmlFor={fieldIds.budgetKobo}
                  error={errors.budgetKobo?.message}
                  hint="Numbers only."
                >
                  <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                      ₦
                    </span>
                    <input
                      id={fieldIds.budgetKobo}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="150,000,000"
                      value={budgetValue}
                      className="w-full bg-transparent text-body text-[var(--color-text-primary)] outline-none placeholder:text-gray-500"
                      aria-invalid={Boolean(errors.budgetKobo)}
                      aria-describedby={
                        errors.budgetKobo
                          ? `${fieldIds.budgetKobo}-error`
                          : undefined
                      }
                      name={budgetRegistration.name}
                      ref={budgetRegistration.ref}
                      onBlur={budgetRegistration.onBlur}
                      onChange={(event) => {
                        setValue(
                          "budgetKobo",
                          formatNumberWithCommas(event.target.value),
                          { shouldDirty: true, shouldValidate: false },
                        );
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
                    aria-describedby={
                      errors.propertyInterest
                        ? `${fieldIds.propertyInterest}-error`
                        : undefined
                    }
                    {...register("propertyInterest")}
                  />
                </FormField>
              </div>

              <FormField
                label="What do you need?"
                htmlFor={fieldIds.inquiryNotes}
                error={errors.inquiryNotes?.message}
              >
                <textarea
                  id={fieldIds.inquiryNotes}
                  rows={8}
                  maxLength={5000}
                  placeholder="Tell us what you need, e.g. 3-bedroom apartment in Lekki, gated estate, budget under 150m."
                  className="min-h-[220px] w-full resize-y rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-body leading-7 text-[var(--color-text-primary)] outline-none transition placeholder:text-gray-500 focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  aria-invalid={Boolean(errors.inquiryNotes)}
                  aria-describedby={
                    errors.inquiryNotes
                      ? `${fieldIds.inquiryNotes}-error`
                      : `${fieldIds.inquiryNotes}-counter`
                  }
                  {...register("inquiryNotes")}
                />
                <p
                  id={`${fieldIds.inquiryNotes}-counter`}
                  className="text-right text-small text-slate-700"
                >
                  {inquiryNotes.length} / 5000 characters
                </p>
              </FormField>

              <input type="hidden" value={source} {...register("source")} />
              <input
                type="hidden"
                aria-hidden="true"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-lg text-caption text-slate-700">
                  Our luxury agents review all briefs and typically respond
                  within 2 hours.
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
