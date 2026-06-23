import { parseApiError } from "../utils/api-error";

export async function unwrapApiResponse<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const result = await promise;

  if (result.error) {
    throw parseApiError(result.error, result.response);
  }

  if (result.data === undefined) {
    throw parseApiError(
      {
        statusCode: result.response.status,
        message: result.response.statusText || "Unexpected API error.",
      },
      result.response,
    );
  }

  return result.data;
}
