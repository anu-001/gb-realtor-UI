import { getApiFieldErrors, getApiErrorMessage, isNetworkError, parseApiError } from "../utils/api-error";

export function useApiError(error: unknown): {
  message: string;
  fieldErrors: ReturnType<typeof getApiFieldErrors>;
  isNetworkError: boolean;
} {
  const parsed = parseApiError(error);

  return {
    message: getApiErrorMessage(parsed),
    fieldErrors: getApiFieldErrors(parsed),
    isNetworkError: isNetworkError(error),
  };
}
