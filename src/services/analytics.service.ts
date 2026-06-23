import { apiClient, publicClient } from "./api-client";
import { unwrapApiResponse } from "./_request";
import { parseApiError } from "@/utils/api-error";

export async function getAnalyticsSummary(
  filters?: { from?: string; to?: string },
): Promise<import("../types/api.generated").components["schemas"]["AnalyticsSummaryResponseDto"]> {
  return unwrapApiResponse(apiClient.GET("/api/v1/analytics/summary", { params: { query: filters } }));
}

export async function getAnalyticsDashboard(
  filters?: { from?: string; to?: string },
): Promise<import("../types/api.generated").components["schemas"]["AnalyticsSummaryResponseDto"]> {
  try {
    return await unwrapApiResponse(apiClient.GET("/api/v1/analytics/dashboard", { params: { query: filters } }));
  } catch (error) {
    const errorInfo = parseApiError(error);
    if (errorInfo.statusCode === 404) {
      return unwrapApiResponse(apiClient.GET("/api/v1/analytics/summary", { params: { query: filters } }));
    }
    throw error;
  }
}

export async function getInfrastructure(): Promise<import("../types/api.generated").components["schemas"]["InfrastructureResponseDto"]> {
  return unwrapApiResponse(apiClient.GET("/api/v1/infrastructure"));
}

export async function getHealth(): Promise<import("../types/api.generated").components["schemas"]["HealthResponseDto"]> {
  return unwrapApiResponse(publicClient.GET("/health"));
}

export async function getReadiness(): Promise<import("../types/api.generated").components["schemas"]["ReadinessResponseDto"]> {
  return unwrapApiResponse(publicClient.GET("/health/ready"));
}
