import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout as logoutAction, setAccessToken } from "./authSlice";
import { configureApiClient } from "../services/api-client";
import { clearRefreshToken, setRefreshToken } from "../services/auth-session";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: true,
});

configureApiClient({
  store,
  setAuthTokens: (tokens) => {
    setRefreshToken(tokens.refreshToken);
    store.dispatch(setAccessToken(tokens.accessToken));
  },
  clearAuth: () => {
    clearRefreshToken();
    store.dispatch(logoutAction());
  },
  redirectToLogin: () => {
    if (globalThis.location) {
      globalThis.location.assign("/login");
    }
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const appStore = store;
