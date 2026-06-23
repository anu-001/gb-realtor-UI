import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { store } from "@/store";
import { AuthBootstrap } from "@/features/auth/AuthBootstrap";
import { getQueryClient } from "@/app/query-client";

const queryClient = getQueryClient();

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>{children}</AuthBootstrap>
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </Provider>
  );
}
