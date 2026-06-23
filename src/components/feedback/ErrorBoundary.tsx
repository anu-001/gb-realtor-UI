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
    // Keep dev console noise useful without crashing the app shell.
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
        <div className="flex min-h-[280px] items-center justify-center rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-card">
          <div className="max-w-md">
            <AlertTriangle className="mx-auto h-10 w-10 text-[var(--color-danger)]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-h4 text-[var(--color-text-primary)]">
              {this.props.title ?? "Couldn’t load content"}
            </h2>
            <p className="mt-2 text-body text-[var(--color-text-secondary)]">
              {this.props.message ?? "Something went wrong while loading this section."}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
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
