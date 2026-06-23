import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthTokens, AuthUser, LoginPayload } from "../types/auth";
import type { ApiError } from "../types/common";
import { login as loginRequest, logout as logoutRequest, refreshTokens } from "../services/auth.service";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "../services/auth-session";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
};

function applyTokens(tokens: AuthTokens): AuthState {
  setRefreshToken(tokens.refreshToken);

  return {
    user: null,
    accessToken: tokens.accessToken,
    isAuthenticated: true,
    isLoading: false,
  };
}

export const loginUser = createAsyncThunk<AuthTokens, LoginPayload, { rejectValue: ApiError }>(
  "auth/loginUser",
  async (payload, thunkApi) => {
    try {
      const tokens = await loginRequest(payload);
      setRefreshToken(tokens.refreshToken);
      return tokens;
    } catch (error) {
      return thunkApi.rejectWithValue(error as ApiError);
    }
  },
);

export const restoreSession = createAsyncThunk<AuthTokens, void, { rejectValue: ApiError }>(
  "auth/restoreSession",
  async (_, thunkApi) => {
    try {
      const refreshToken = getRefreshToken() ?? "";
      const tokens = await refreshTokens({ refreshToken });
      setRefreshToken(tokens.refreshToken);
      return tokens;
    } catch (error) {
      return thunkApi.rejectWithValue(error as ApiError);
    }
  },
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: ApiError }>(
  "auth/logoutUser",
  async (_, thunkApi) => {
    try {
      const refreshToken = getRefreshToken() ?? "";
      await logoutRequest({ refreshToken });
      clearRefreshToken();
    } catch (error) {
      clearRefreshToken();
      return thunkApi.rejectWithValue(error as ApiError);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    hydrateAuth(state, action: PayloadAction<AuthTokens>) {
      const nextState = applyTokens(action.payload);
      state.user = nextState.user;
      state.accessToken = nextState.accessToken;
      state.isAuthenticated = nextState.isAuthenticated;
      state.isLoading = nextState.isLoading;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      clearRefreshToken();
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const nextState = applyTokens(action.payload);
        state.user = nextState.user;
        state.accessToken = nextState.accessToken;
        state.isAuthenticated = nextState.isAuthenticated;
        state.isLoading = nextState.isLoading;
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        const nextState = applyTokens(action.payload);
        state.user = nextState.user;
        state.accessToken = nextState.accessToken;
        state.isAuthenticated = nextState.isAuthenticated;
        state.isLoading = nextState.isLoading;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        clearRefreshToken();
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        clearRefreshToken();
      });
  },
});

export const { setAccessToken, setAuthLoading, hydrateAuth, logout } = authSlice.actions;
export default authSlice.reducer;
