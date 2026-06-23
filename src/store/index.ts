import { configureStore } from "@reduxjs/toolkit";
import { toast } from "sonner";
import authReducer, { clearAuth, setAuth } from "@/store/authSlice";
import uiReducer from "@/store/slices/uiSlice";
import { configureApiClient } from "@/services/api-client";
import { clearRefreshToken, setRefreshToken } from "@/services/auth-session";
import { getQueryClient } from "@/app/query-client";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

configureApiClient({
  store,
  selectAuth: (state) => ({
    accessToken: (state as RootState).auth.accessToken,
  }),
  setAuthTokens: (tokens) => {
    setRefreshToken(tokens.refreshToken);
    store.dispatch(setAuth({ user: store.getState().auth.user, accessToken: tokens.accessToken }));
  },
  clearAuth: () => {
    clearRefreshToken();
    store.dispatch(clearAuth());
  },
  redirectToLogin: () => {
    globalThis.location?.assign("/login");
  },
  toast,
});

export const appStore = store;
export const queryClient = getQueryClient();

export { useAppDispatch, useAppSelector } from "./hooks";
