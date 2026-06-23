import createClient from "openapi-fetch";
import type { AuthTokens, RefreshPayload } from "../types/auth";
import type { paths } from "../types/api.generated";
import { getRefreshToken } from "./auth-session";

type AuthSnapshot = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

type ToastApi = {
  error: (message: string) => void;
  warning?: (message: string) => void;
};

type ReduxLikeStore<State = unknown> = {
  getState: () => State;
  dispatch?: (action: unknown) => unknown;
};

type ApiClientConfig<State = unknown> = {
  store?: ReduxLikeStore<State>;
  selectAuth?: (state: State) => AuthSnapshot | null | undefined;
  setAuthTokens?: (tokens: AuthTokens) => void;
  clearAuth?: () => void;
  redirectToLogin?: () => void;
  toast?: ToastApi;
};

type ViteEnv = {
  VITE_API_BASE_URL?: string;
};

const rawFetch = globalThis.fetch.bind(globalThis);
const authRefreshPath = "/api/v1/auth/refresh";

let config: ApiClientConfig = {};
let refreshPromise: Promise<AuthTokens | null> | null = null;

const viteBaseUrl = (import.meta as ImportMeta & { env?: ViteEnv }).env?.VITE_API_BASE_URL ?? "";
const fallbackBaseUrl = globalThis.location?.origin ?? "";
const baseUrl = viteBaseUrl || fallbackBaseUrl;

function getAuthSnapshot(): AuthSnapshot {
  const state = config.store?.getState();

  if (config.selectAuth) {
    return config.selectAuth(state as never) ?? {};
  }

  const candidate = state as {
    auth?: AuthSnapshot & { tokens?: AuthSnapshot };
    session?: AuthSnapshot & { tokens?: AuthSnapshot };
  };

  const auth = candidate?.auth ?? candidate?.session;
  if (!auth) {
    return {};
  }

  return {
    accessToken: auth.accessToken ?? auth.tokens?.accessToken ?? null,
    refreshToken: auth.refreshToken ?? auth.tokens?.refreshToken ?? null,
  };
}

function applyBearerToken(request: Request, accessToken?: string | null): Request {
  const headers = new Headers(request.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return new Request(request, { headers });
}

function resolveUrl(pathname: string): string {
  if (baseUrl) {
    return new URL(pathname, baseUrl).toString();
  }

  return pathname;
}

function isAuthRefreshRequest(request: Request): boolean {
  try {
    return new URL(request.url).pathname === authRefreshPath;
  } catch {
    return request.url.endsWith(authRefreshPath);
  }
}

function notifyRateLimit(): void {
  config.toast?.warning?.("Too many requests, please wait.");
}

function notifyServerError(): void {
  config.toast?.error("Something went wrong, please try again.");
}

function redirectToLogin(): void {
  config.clearAuth?.();

  if (config.redirectToLogin) {
    config.redirectToLogin();
    return;
  }

  if (globalThis.location) {
    globalThis.location.assign("/login");
  }
}

async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshUrl = resolveUrl(authRefreshPath);
      const payload: RefreshPayload = { refreshToken: getRefreshToken() ?? "" };
      const response = await rawFetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return null;
      }

      const tokens = (await response.json().catch(() => null)) as AuthTokens | null;
      if (!tokens?.accessToken || !tokens.refreshToken) {
        return null;
      }

      config.setAuthTokens?.(tokens);
      return tokens;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function fetchWithAuth(input: Request): Promise<Response> {
  const auth = getAuthSnapshot();
  const request = applyBearerToken(input, auth.accessToken);
  const retryRequest = request.clone();

  const response = await rawFetch(request);
  if (response.status === 429) {
    notifyRateLimit();
  } else if (response.status === 500) {
    notifyServerError();
  }

  if (response.status !== 401 || isAuthRefreshRequest(request)) {
    return response;
  }

  const tokens = await refreshAccessToken();
  if (!tokens?.accessToken) {
    redirectToLogin();
    return response;
  }

  const refreshedRequest = applyBearerToken(retryRequest, tokens.accessToken);
  const refreshedResponse = await rawFetch(refreshedRequest);

  if (refreshedResponse.status === 429) {
    notifyRateLimit();
  } else if (refreshedResponse.status === 500) {
    notifyServerError();
  }

  if (refreshedResponse.status === 401) {
    redirectToLogin();
  }

  return refreshedResponse;
}

async function fetchWithoutAuth(input: Request): Promise<Response> {
  return rawFetch(input);
}

export function configureApiClient(nextConfig: ApiClientConfig): void {
  config = nextConfig;
}

export const privateClient = createClient<paths>({
  baseUrl,
  fetch: fetchWithAuth,
});

export const publicClient = createClient<paths>({
  baseUrl,
  fetch: fetchWithoutAuth,
});

export const apiClient = privateClient;
