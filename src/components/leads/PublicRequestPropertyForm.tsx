import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { RichTextEditorField } from "@/components/ui/RichTextEditorField";
import { createPublicPropertyRequest } from "@/services/leads.service";
import { getApiErrorMessage, getFieldErrors, parseApiError } from "@/utils/api-error";
import { cn } from "@/utils/cn";

function isValidNigerianPhone(value: string): boolean {
  return /^(?:\+234|0)[789][01]\d{8}$/.test(value.replace(/\s+/g, ""));
}

const publicRequestSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isValidNigerianPhone, "Enter a valid Nigerian phone number"),
  email: z.string().trim().optional().refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email address"),
  preferredLocation: z.string().trim().optional(),
  budgetKobo: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const digits = value.replace(/[^\d]/g, "");
      return digits.length ? digits : undefined;
    }),
  propertyInterest: z.string().trim().optional(),
  inquiryNotes: z.string().trim().optional(),
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
    phoneNumber: `public-request-phone-number-${formId}`,
    email: `public-request-email-${formId}`,
    preferredLocation: `public-request-location-${formId}`,
    budgetKobo: `public-request-budget-${formId}`,
    propertyInterest: `public-request-interest-${formId}`,
    inquiryNotes: `public-request-notes-${formId}`,
    message: `public-request-message-${formId}`,
    website: `public-request-website-${formId}`,
  };

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PublicRequestFormInput, unknown, PublicRequestFormValues>({
    resolver: zodResolver(publicRequestSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      fullName: "",
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

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await createPublicPropertyRequest({
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.replace(/\s+/g, ""),
        ...(values.email?.trim() ? { email: values.email.trim() } : {}),
        ...(values.preferredLocation?.trim() ? { preferredLocation: values.preferredLocation.trim() } : {}),
        ...(values.budgetKobo ? { budgetKobo: values.budgetKobo } : {}),
        ...(values.propertyInterest?.trim() ? { propertyInterest: values.propertyInterest.trim() } : {}),
        inquiryNotes: values.inquiryNotes ?? "",
        ...(values.message?.trim() ? { message: values.message.trim() } : {}),
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
        <p className="text-small font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Private request</p>
        <h2 className="mt-5 font-display text-h2 text-[var(--color-text-primary)]">{headline}</h2>
        <p className="mt-3 max-w-2xl text-body-lg text-[var(--color-text-secondary)]">{subheading}</p>
      </div>

      <div className="p-6 md:p-8 md:p-10">
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
              <h3 className="mt-5 font-display text-h3 text-[var(--color-text-primary)]">Thanks, {submittedName}!</h3>
              <p className="mt-3 max-w-xl text-body text-[var(--color-text-secondary)]">
                We’ve received your request and will follow up within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmittedName(null);
                  reset({
                    fullName: "",
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

                <FormField label="Phone number" htmlFor={fieldIds.phoneNumber} error={errors.phoneNumber?.message}>
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

                <FormField label="Preferred location" htmlFor={fieldIds.preferredLocation} error={errors.preferredLocation?.message}>
                  <input
                    id={fieldIds.preferredLocation}
                    autoComplete="off"
                    placeholder="Lekki"
                    className="ui-field"
                    aria-invalid={Boolean(errors.preferredLocation)}
                    aria-describedby={errors.preferredLocation ? `${fieldIds.preferredLocation}-error` : undefined}
                    {...register("preferredLocation")}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Budget" htmlFor={fieldIds.budgetKobo} error={errors.budgetKobo?.message} hint="Numbers only.">
                  <div className="flex h-12 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[var(--color-accent)]">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">₦</span>
                    <input
                      id={fieldIds.budgetKobo}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="150000000"
                      className="w-full bg-transparent text-body text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
                      aria-invalid={Boolean(errors.budgetKobo)}
                      aria-describedby={errors.budgetKobo ? `${fieldIds.budgetKobo}-error` : undefined}
                      {...register("budgetKobo")}
                    />
                  </div>
                </FormField>

                <FormField label="Property interest" htmlFor={fieldIds.propertyInterest} error={errors.propertyInterest?.message}>
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

              <RichTextEditorField<PublicRequestFormInput>
                name="inquiryNotes"
                control={control}
                label="What do you need?"
                placeholder="Tell us what you need, e.g. 3-bedroom apartment in Lekki, gated estate, budget under 150m."
                minHeight={220}
                maxCharacters={5000}
                showAlignment={false}
                toolbarVariant="full"
                helperText="Add details, preferences, and timing. Formatting is supported."
              />

              <FormField label="Message" htmlFor={fieldIds.message} error={errors.message?.message} hint="Optional short summary.">
                <textarea
                  id={fieldIds.message}
                  rows={4}
                  placeholder="A short note for our team"
                  className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-body text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-accent)]"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? `${fieldIds.message}-error` : undefined}
                  {...register("message")}
                />
              </FormField>

              <input type="hidden" value={source} {...register("source")} />
              <input type="hidden" aria-hidden="true" tabIndex={-1} autoComplete="off" {...register("website")} />

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-lg text-caption text-[var(--color-text-secondary)]">
                  We only use this to match your brief and get back to you quickly.
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
