import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthTokens, AuthUser, LoginPayload } from "@/types/auth";
import { login as loginRequest, logout as logoutRequest, refresh as refreshRequest } from "@/services/auth.service";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/services/auth-session";
import { resolveWorkspaceRole } from "@/utils/auth-role";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
};

function normalizeAuthUser(user: AuthUser | null): AuthUser | null {
  if (!user) return null;

  return {
    ...user,
    role: resolveWorkspaceRole(user) ?? user.role ?? user.roles?.[0]?.code ?? undefined,
  };
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return globalThis.atob(padded);
}

function userFromToken(accessToken: string | null): AuthUser | null {
  if (!accessToken) return null;

  try {
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) return null;
    const normalizedPayload = JSON.parse(decodeBase64Url(payloadPart)) as Record<string, unknown>;
    const roles = Array.isArray(normalizedPayload.roles) ? (normalizedPayload.roles as AuthUser["roles"]) : undefined;
    const role = resolveWorkspaceRole(
      undefined,
      accessToken,
    );

    const id = typeof normalizedPayload.sub === "string" ? normalizedPayload.sub : typeof normalizedPayload.id === "string" ? normalizedPayload.id : "";
    const email = typeof normalizedPayload.email === "string" ? normalizedPayload.email : "";
    const fullName =
      typeof normalizedPayload.fullName === "string"
        ? normalizedPayload.fullName
        : typeof normalizedPayload.name === "string"
          ? normalizedPayload.name
          : email || "Signed in user";

    return normalizeAuthUser({
      id,
      email,
      fullName,
      isActive: true,
      roles,
      role: role ?? undefined,
    });
  } catch {
    return null;
  }
}

function applyAuth(tokens: AuthTokens, user: AuthUser | null = null): AuthState {
  setRefreshToken(tokens.refreshToken);
  const resolvedUser = normalizeAuthUser(user) ?? userFromToken(tokens.accessToken);

  return {
    user: resolvedUser,
    accessToken: tokens.accessToken,
    isAuthenticated: true,
    isInitializing: false,
  };
}

export const loginUser = createAsyncThunk<
  { tokens: AuthTokens; user: AuthUser | null },
  LoginPayload
>("auth/loginUser", async (payload) => {
  const tokens = await loginRequest(payload);
  return { tokens, user: null };
});

export const restoreSession = createAsyncThunk<
  { tokens: AuthTokens; user: AuthUser | null },
  void
>("auth/restoreSession", async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const tokens = await refreshRequest({ refreshToken });
  return { tokens, user: null };
});

export const logoutUser = createAsyncThunk<void, void>("auth/logoutUser", async () => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await logoutRequest({ refreshToken });
  }
  clearRefreshToken();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: AuthUser | null; accessToken: string | null }>) {
      state.user = normalizeAuthUser(action.payload.user) ?? userFromToken(action.payload.accessToken);
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = Boolean(action.payload.accessToken);
      state.isInitializing = false;
      if (action.payload.accessToken) {
        // access token is kept in memory only
      }
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      clearRefreshToken();
    },
    setInitializing(state, action: PayloadAction<boolean>) {
      state.isInitializing = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const next = applyAuth(action.payload.tokens, action.payload.user);
        state.user = next.user;
        state.accessToken = next.accessToken;
        state.isAuthenticated = next.isAuthenticated;
        state.isInitializing = false;
      })
      .addCase(loginUser.rejected, (state) => {
        state.isInitializing = false;
      })
      .addCase(restoreSession.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        const next = applyAuth(action.payload.tokens, action.payload.user);
        state.user = next.user;
        state.accessToken = next.accessToken;
        state.isAuthenticated = next.isAuthenticated;
        state.isInitializing = false;
      })
      .addCase(restoreSession.rejected, (state) => {
        clearRefreshToken();
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      });
  },
});

export const { setAuth, clearAuth, setInitializing } = authSlice.actions;

// Compatibility exports for existing code paths
export const setAccessToken = (accessToken: string | null) => setAuth({ user: null, accessToken });
export const setAuthLoading = (isLoading: boolean) => setInitializing(isLoading);
export const hydrateAuth = (tokens: AuthTokens) => setAuth({ user: null, accessToken: tokens.accessToken });
export const logout = clearAuth;

export default authSlice.reducer;
