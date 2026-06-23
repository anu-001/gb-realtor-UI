import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/api-error";

let queryClient: QueryClient | null = null;

export function getQueryClient() {
  if (queryClient) return queryClient;

  queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  return queryClient;
}
