import { apiClient } from "./api-client";
import { unwrapApiResponse } from "./_request";

export async function getAnalyticsSummary(
  filters?: { from?: string; to?: string },
): Promise<import("../types/api.generated").components["schemas"]["AnalyticsSummaryResponseDto"]> {
  return unwrapApiResponse(apiClient.GET("/api/v1/analytics/summary", { params: { query: filters } }));
}

export async function getAnalyticsDashboard(
  filters?: { from?: string; to?: string },
): Promise<import("../types/api.generated").components["schemas"]["AnalyticsSummaryResponseDto"]> {
  return unwrapApiResponse(apiClient.GET("/api/v1/analytics/dashboard", { params: { query: filters } }));
}

export async function getInfrastructure(): Promise<import("../types/api.generated").components["schemas"]["InfrastructureResponseDto"]> {
  return unwrapApiResponse(apiClient.GET("/api/v1/infrastructure"));
}

export async function getHealth(): Promise<import("../types/api.generated").components["schemas"]["HealthResponseDto"]> {
  return unwrapApiResponse(apiClient.GET("/health"));
}

export async function getReadiness(): Promise<import("../types/api.generated").components["schemas"]["ReadinessResponseDto"]> {
  return unwrapApiResponse(apiClient.GET("/health/ready"));
}
