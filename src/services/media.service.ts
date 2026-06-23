import type { components } from "../types/api.generated";
import type { PropertyImage } from "../types/property";
import { apiClient } from "./api-client";
import { unwrapApiResponse } from "./_request";

export async function createPropertyMediaUploadUrl(payload: {
  propertyId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<components["schemas"]["PropertyMediaUploadResponseDto"]> {
  return unwrapApiResponse(
    apiClient.POST("/api/v1/property-media/upload-url", {
      body: payload as never,
    }),
  );
}

export async function confirmPropertyImage(imageId: string, payload?: { altText?: string }): Promise<PropertyImage> {
  return unwrapApiResponse(
    apiClient.POST("/api/v1/property-media/images/{imageId}/confirm", {
      params: { path: { imageId } },
      body: payload ?? {},
    }),
  );
}

export async function listPropertyMedia(propertyId: string): Promise<PropertyImage[]> {
  return unwrapApiResponse(
    apiClient.GET("/api/v1/property-media/properties/{propertyId}/images", {
      params: { path: { propertyId } },
    }),
  );
}

export async function reorderPropertyImages(propertyId: string, imageIds: string[]): Promise<PropertyImage[]> {
  return unwrapApiResponse(
    apiClient.PUT("/api/v1/property-media/properties/{propertyId}/images/order", {
      params: { path: { propertyId } },
      body: { imageIds },
    }),
  );
}

export async function deletePropertyImage(imageId: string): Promise<{ success: boolean }> {
  return unwrapApiResponse(apiClient.DELETE("/api/v1/property-media/images/{imageId}", { params: { path: { imageId } } }));
}

export async function listFeaturedProperties(
  limit?: number,
): Promise<components["schemas"]["FeaturedPropertyResponseDto"][]> {
  return unwrapApiResponse(
    apiClient.GET("/api/v1/featured-properties", {
      params: typeof limit === "number" ? { query: { limit: limit as never } } : undefined,
    }),
  );
}

export async function featureProperty(
  propertyId: string,
): Promise<components["schemas"]["FeaturedPropertyResponseDto"]> {
  return unwrapApiResponse(apiClient.POST("/api/v1/featured-properties/{propertyId}", { params: { path: { propertyId } } }));
}

export async function unfeatureProperty(propertyId: string): Promise<{ success: boolean }> {
  return unwrapApiResponse(apiClient.DELETE("/api/v1/featured-properties/{propertyId}", { params: { path: { propertyId } } }));
}

export async function createFileUploadUrl(payload: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<components["schemas"]["UploadUrlResponseDto"]> {
  return unwrapApiResponse(
    apiClient.POST("/api/v1/files/upload-url", {
      body: payload as never,
    }),
  );
}
