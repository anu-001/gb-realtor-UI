import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type MonitoringClient = {
  captureException?: (error: unknown, context?: Record<string, unknown>) => void;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

function reportError(error: Error, info: ErrorInfo): void {
  const monitoring = globalThis as typeof globalThis & { Sentry?: MonitoringClient };
  monitoring.Sentry?.captureException?.(error, { extra: { componentStack: info.componentStack } });
  if (import.meta.env.DEV) {
    console.error(error, info);
  }
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, info);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[280px] items-center justify-center rounded-modal border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_97%,white)_0%,var(--color-surface)_100%)] p-6 text-center shadow-card">
          <div className="max-w-md">
            <AlertTriangle className="mx-auto h-10 w-10 text-[var(--color-danger)]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-h4 text-[var(--color-text-primary)]">
              {this.props.title ?? "We couldn’t load this section"}
            </h2>
            <p className="mt-2 text-body text-[var(--color-text-secondary)]">
              {this.props.message ?? "Please try again in a moment."}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-6 ui-button-primary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {this.props.retryLabel ?? "Retry"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
