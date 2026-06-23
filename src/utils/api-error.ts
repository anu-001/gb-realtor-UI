import type { ApiError, ApiFieldError } from "../types/common";

type BackendErrorLike = {
  statusCode?: number;
  message?: string | string[];
  errors?: ApiFieldError[];
  timestamp?: string;
  path?: string;
  error?: string;
};

export type FieldErrorMap = Record<string, { type: "server"; message: string }>;

const fallbackMessages: Record<number, string> = {
  400: "The request could not be processed.",
  401: "Session expired, please log in.",
  403: "You do not have permission to do this.",
  404: "Not found.",
  429: "Too many requests, please wait.",
  500: "Something went wrong, please try again.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBackendErrorLike(value: unknown): value is BackendErrorLike {
  return isRecord(value) && ("statusCode" in value || "message" in value || "errors" in value);
}

function asMessage(message: unknown): string | string[] {
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === "string");
  }

  if (typeof message === "string") {
    return message;
  }

  return "";
}

function statusCodeFromError(error: unknown, response?: Response): number {
  if (isBackendErrorLike(error) && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  return response?.status ?? 0;
}

function messageFromError(error: unknown, statusCode: number): string | string[] {
  if (isBackendErrorLike(error)) {
    const message = asMessage(error.message);
    if (message && (Array.isArray(message) ? message.length > 0 : message.length > 0)) {
      return message;
    }
  }

  return fallbackMessages[statusCode] ?? "Unexpected API error.";
}

export function parseApiError(error: unknown, response?: Response): ApiError {
  const statusCode = statusCodeFromError(error, response);
  const backend = isBackendErrorLike(error) ? error : undefined;
  return {
    statusCode,
    message: messageFromError(error, statusCode),
    errors: backend?.errors,
    timestamp: backend?.timestamp,
    path: backend?.path,
  };
}

export function getApiErrorMessage(error: unknown, response?: Response): string {
  const parsed = parseApiError(error, response);

  if (parsed.statusCode === 400 || parsed.statusCode === 422) {
    if (Array.isArray(parsed.message)) {
      return parsed.message[0] ?? fallbackMessages[parsed.statusCode] ?? "The request could not be processed.";
    }

    if (parsed.errors?.length) {
      return parsed.errors[0]?.message ?? fallbackMessages[parsed.statusCode] ?? "The request could not be processed.";
    }
  }

  if (parsed.statusCode in fallbackMessages) {
    return fallbackMessages[parsed.statusCode] ?? "Unexpected API error.";
  }

  if (Array.isArray(parsed.message)) {
    return parsed.message[0] ?? fallbackMessages[parsed.statusCode] ?? "Unexpected API error.";
  }

  return parsed.message || fallbackMessages[parsed.statusCode] || "Unexpected API error.";
}

export const getErrorMessage = getApiErrorMessage;

export function getApiFieldErrors(error: unknown, response?: Response): FieldErrorMap {
  const parsed = parseApiError(error, response);
  return (parsed.errors ?? []).reduce<FieldErrorMap>((acc, item) => {
    if (!item.field) {
      return acc;
    }

    acc[item.field] = {
      type: "server",
      message: item.message,
    };

    return acc;
  }, {});
}

export const getFieldErrors = getApiFieldErrors;

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!isRecord(error)) {
    return false;
  }

  return error.name === "TypeError" && typeof error.message === "string" && /fetch/i.test(error.message);
}
