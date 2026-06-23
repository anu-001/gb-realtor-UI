import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuth } from "@/store/authSlice";
import { login } from "@/services/auth.service";
import { setRefreshToken } from "@/services/auth-session";
import { useApiError } from "@/hooks/use-api-error";
import { slideUp } from "@/utils/motion";
import { Typography } from "@/components/ui/Typography";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [submissionError, setSubmissionError] = useState<unknown>(null);
  const { message, fieldErrors } = useApiError(submissionError);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | undefined;
    return state?.from?.pathname ?? "/dashboard";
  }, [location.state]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    for (const [field, error] of Object.entries(fieldErrors)) {
      setError(field as keyof LoginFormValues, error);
    }
  }, [fieldErrors, setError]);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    setSubmissionError(null);

    try {
      const tokens = await login(values);
      setRefreshToken(tokens.refreshToken);
      dispatch(setAuth({ user: null, accessToken: tokens.accessToken }));
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSubmissionError(error);
    }
  });

  const bannerMessage = submissionError && Object.keys(fieldErrors).length === 0 ? message : null;

  return (
    <motion.section
      variants={slideUp}
      initial="initial"
      animate="animate"
      className="w-full rounded-modal border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-modal md:p-8"
    >
      <div className="mb-8">
        <Typography as="h1" variant="h2" className="text-[var(--color-text-primary)]">
          Welcome back
        </Typography>
        <Typography variant="body" className="mt-2 text-[var(--color-text-secondary)]">
          Sign in to your account
        </Typography>
      </div>

      {bannerMessage ? (
        <div className="mb-6 rounded-input border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {bannerMessage}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="h-12 w-full rounded-input border border-[var(--color-border)] bg-white px-4 text-body outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            {...register("email")}
          />
          {errors.email?.message ? <p className="mt-2 text-caption text-[var(--color-danger)]">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 w-full rounded-input border border-[var(--color-border)] bg-white px-4 pr-12 text-body outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-4 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password?.message ? (
            <p className="mt-2 text-caption text-[var(--color-danger)]">{errors.password.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-input bg-[var(--color-accent)] px-4 font-body text-body font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Sign in"}
        </button>
      </form>
    </motion.section>
  );
}

export default LoginPage;
