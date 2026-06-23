import { QueryClient } from "@tanstack/react-query";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: import.meta.env.DEV ? false : true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
