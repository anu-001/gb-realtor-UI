import type { components } from "../types/api.generated";
import type { CreateUserPayload, InternalUser, UpdateUserPayload } from "../types/user";
import { apiClient } from "./api-client";
import { unwrapApiResponse } from "./_request";

export async function listAuditLogs(
  filters?: Record<string, unknown>,
): Promise<components["schemas"]["PaginatedAuditLogsResponseDto"]> {
  const response = await unwrapApiResponse(
    apiClient.GET("/api/v1/audit-logs", {
      params: { query: filters as never },
    }),
  );
  return response as components["schemas"]["PaginatedAuditLogsResponseDto"];
}

export async function listRolesPermissions(): Promise<components["schemas"]["RoleResponseDto"][]> {
  return unwrapApiResponse(
    apiClient.GET("/api/v1/roles-permissions"),
  );
}

export async function createUser(payload: CreateUserPayload): Promise<InternalUser> {
  return unwrapApiResponse(apiClient.POST("/api/v1/users", { body: payload }));
}

export async function listUsers(
  filters?: Record<string, unknown>,
): Promise<components["schemas"]["PaginatedUsersResponseDto"]> {
  const response = await unwrapApiResponse(
    apiClient.GET("/api/v1/users", {
      params: { query: filters as never },
    }),
  );
  return response as components["schemas"]["PaginatedUsersResponseDto"];
}

export async function getUser(id: string): Promise<InternalUser> {
  return unwrapApiResponse(apiClient.GET("/api/v1/users/{id}", { params: { path: { id } } }));
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<InternalUser> {
  return unwrapApiResponse(apiClient.PATCH("/api/v1/users/{id}", { params: { path: { id } }, body: payload }));
}

export async function deactivateUser(id: string): Promise<InternalUser> {
  return unwrapApiResponse(apiClient.PATCH("/api/v1/users/{id}/deactivate", { params: { path: { id } } }));
}

export async function assignUserRoles(id: string, roleCodes: string[]): Promise<InternalUser> {
  return unwrapApiResponse(apiClient.PUT("/api/v1/users/{id}/roles", { params: { path: { id } }, body: { roleCodes } }));
}
