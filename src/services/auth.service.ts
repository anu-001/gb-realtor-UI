import type { AuthTokens, LoginPayload, RefreshPayload } from "../types/auth";
import { privateClient, publicClient } from "./api-client";
import { unwrapApiResponse } from "./_request";

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  return unwrapApiResponse(publicClient.POST("/api/v1/auth/login", { body: payload }));
}

export async function refreshTokens(payload: RefreshPayload): Promise<AuthTokens> {
  return unwrapApiResponse(publicClient.POST("/api/v1/auth/refresh", { body: payload }));
}

export async function logout(payload: RefreshPayload): Promise<{ success: boolean }> {
  return unwrapApiResponse(privateClient.POST("/api/v1/auth/logout", { body: payload }));
}

export async function logoutAll(): Promise<{ success: boolean }> {
  return unwrapApiResponse(privateClient.POST("/api/v1/auth/logout-all"));
}
