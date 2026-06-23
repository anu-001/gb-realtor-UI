import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginUser } from "../../store/authSlice";
import { useApiError } from "../../hooks/use-api-error";
import { slideUp } from "../../utils/motion";
import { Typography } from "../../components/ui/Typography";
import { AuthLayout } from "../../app/layouts/AuthLayout";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const auth = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [submissionError, setSubmissionError] = useState<unknown>(null);
  const { message, fieldErrors } = useApiError(submissionError);

  const redirectTo = useMemo(() => location.state?.from?.pathname ?? "/", [location.state]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (auth.isAuthenticated && auth.accessToken) {
      navigate(redirectTo, { replace: true });
    }
  }, [auth.accessToken, auth.isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;
    for (const [field, fieldError] of Object.entries(fieldErrors)) {
      setError(field as keyof LoginFormValues, {
        type: fieldError.type,
        message: fieldError.message,
      });
    }
  }, [fieldErrors, setError]);

  const bannerError = submissionError && Object.keys(fieldErrors).length === 0 ? message : null;

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    setSubmissionError(null);

    try {
      await dispatch(loginUser(values)).unwrap();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSubmissionError(error);
    }
  });

  return (
    <AuthLayout>
      <motion.div
        variants={slideUp}
        initial="initial"
        animate="animate"
        className="w-full rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-modal)]"
      >
        <div className="mb-8">
          <Typography variant="h2" as="h1" className="text-[var(--color-text-primary)]">
            Welcome back
          </Typography>
          <Typography variant="body" className="mt-2 text-[var(--color-text-secondary)]">
            Sign in to continue to your workspace.
          </Typography>
        </div>

        {bannerError ? (
          <div className="mb-6 rounded-[12px] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
            {bannerError}
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
              className="h-12 w-full rounded-[12px] border border-[var(--color-border)] bg-white px-4 text-[15px] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              {...register("email")}
            />
            {errors.email?.message ? <p className="mt-2 text-sm text-[var(--color-danger)]">{errors.email.message}</p> : null}
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
                className="h-12 w-full rounded-[12px] border border-[var(--color-border)] bg-white px-4 pr-12 text-[15px] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password?.message ? (
              <p className="mt-2 text-sm text-[var(--color-danger)]">{errors.password.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={auth.isLoading}
            className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {auth.isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
