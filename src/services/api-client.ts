import createClient from "openapi-fetch";
import type { AuthTokens, RefreshPayload } from "../types/auth";
import type { paths } from "../types/api.generated";
import { getRefreshToken } from "./auth-session";

type AuthSnapshot = {
  accessToken?: string | null;
};

type ToastApi = {
  error: (message: string) => void;
  warning?: (message: string) => void;
};

type ReduxLikeStore<State = unknown> = {
  getState: () => State;
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
const viteBaseUrl = (import.meta as ImportMeta & { env?: ViteEnv }).env?.VITE_API_BASE_URL ?? "";
const fallbackBaseUrl = "https://gb-est-api-production-5a53612aa0b9.herokuapp.com/api/v1";
const baseUrl = viteBaseUrl || fallbackBaseUrl;

const publicRouteMatchers: RegExp[] = [
  /^\/health(?:\/ready)?(?:\/?)?$/,
  /^\/api\/v1\/health(?:\/ready)?(?:\/?)?$/,
  /^\/api\/v1\/featured-properties(?:\/[^/?#]+)?(?:\/?)?$/,
  /^\/api\/v1\/public\/properties\/discovery(?:\/?)?$/,
  /^\/api\/v1\/public\/properties\/[^/?#]+(?:\/?)?$/,
  /^\/api\/v1\/public\/leads(?:\/?)?$/,
  /^\/api\/v1\/public\/leads\/request(?:\/?)?$/,
  /^\/api\/v1\/auth\/login(?:\/?)?$/,
  /^\/api\/v1\/auth\/refresh(?:\/?)?$/,
];

let config: ApiClientConfig = {};
let refreshPromise: Promise<AuthTokens | null> | null = null;

function normalizeUrl(url: string): URL | null {
  try {
    return new URL(url, baseUrl || globalThis.location?.origin || "http://localhost");
  } catch {
    return null;
  }
}

function getAuthSnapshot(): AuthSnapshot {
  const state = config.store?.getState();

  if (state && config.selectAuth) {
    return config.selectAuth(state as never) ?? {};
  }

  return {};
}

function resolveUrl(pathname: string): string {
  if (baseUrl) {
    return new URL(pathname, baseUrl).toString();
  }

  return pathname;
}

function appendAuthorizationHeader(request: Request, accessToken?: string | null): Request {
  if (!accessToken || isPublicRoute(request.url)) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return new Request(request, { headers });
}

function isAuthRefreshRequest(request: Request): boolean {
  const url = normalizeUrl(request.url);
  const pathname = url?.pathname ?? request.url;
  return /\/auth\/refresh\/?$/.test(pathname);
}

function notifyRateLimit(): void {
  config.toast?.warning?.("Too many requests, please wait.");
}

function notifyServerError(): void {
  config.toast?.error("We hit a problem. Please try again.");
}

function handleResponseSideEffects(response: Response): void {
  if (response.status === 429) {
    notifyRateLimit();
  } else if (response.status === 500) {
    notifyServerError();
  }
}

function sessionExpiredResponse(): Response {
  return new Response(JSON.stringify({ statusCode: 401, message: "Session expired, please log in again." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
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
      const refreshUrl = resolveUrl("/api/v1/auth/refresh");
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

export function isPublicRoute(url: string): boolean {
  const pathname = normalizeUrl(url)?.pathname ?? url;
  return publicRouteMatchers.some((matcher) => matcher.test(pathname));
}

async function fetchWithRetry(request: Request, accessToken: string | null | undefined): Promise<Response> {
  const authenticatedRequest = appendAuthorizationHeader(request, accessToken);
  const response = await rawFetch(authenticatedRequest);
  handleResponseSideEffects(response);
  return response;
}

async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input, init);
  const auth = getAuthSnapshot();
  const refreshToken = getRefreshToken();
  const requestIsRefresh = isAuthRefreshRequest(request);

  if (!isPublicRoute(request.url) && !auth.accessToken) {
    if (refreshToken) {
      const refreshed = await refreshAccessToken();
      if (!refreshed?.accessToken) {
        redirectToLogin();
        return sessionExpiredResponse();
      }
      const refreshedResponse = await fetchWithRetry(request, refreshed.accessToken);

      if (refreshedResponse.status !== 401) {
        return refreshedResponse;
      }
    } else {
      redirectToLogin();
      return sessionExpiredResponse();
    }
  }

  const response = await fetchWithRetry(request, auth.accessToken);

  if (response.status !== 401 || requestIsRefresh || isPublicRoute(request.url)) {
    return response;
  }

  const tokens = await refreshAccessToken();
  if (!tokens?.accessToken) {
    redirectToLogin();
    return response;
  }

  const retriedResponse = await fetchWithRetry(request, tokens.accessToken);

  if (retriedResponse.status === 401) {
    redirectToLogin();
  }

  return retriedResponse;
}

async function fetchWithoutAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input, init);
  const response = await rawFetch(request);
  handleResponseSideEffects(response);

  return response;
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
