import type { components } from "../types/api.generated";
import type { Property, PropertyFilters, PropertyImage, CreatePropertyPayload, UpdatePropertyPayload } from "../types/property";
import { privateClient, publicClient } from "./api-client";
import { unwrapApiResponse } from "./_request";

export interface PublicListingsQuery {
  q?: string;
  location?: string;
  state?: string;
  city?: string;
  type?: "house" | "apartment" | "land" | "commercial" | "villa";
  listingType?: "sale" | "rent" | "short_let";
  status?: "draft" | "pending_review" | "published" | "archived";
  propertyType?: "sale" | "rent" | "short_let";
  minPriceKobo?: string | number;
  maxPriceKobo?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  beds?: number;
  bathrooms?: number;
  minSizeSqm?: string | number;
  maxSizeSqm?: string | number;
  featured?: boolean;
  openHouse?: boolean;
  newConstruction?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "oldest" | "featured_first";
  page?: number;
  pageSize?: number;
}

export interface PublicListingsMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PublicListingsResponse {
  data: components["schemas"]["PublicPropertyResponseDto"][];
  meta: PublicListingsMeta;
}

function mapSearchFiltersToSpecQuery(filters?: PublicListingsQuery): Record<string, unknown> {
  if (!filters) {
    return {};
  }

  const minPriceKobo = filters.minPriceKobo ?? filters.minPrice;
  const maxPriceKobo = filters.maxPriceKobo ?? filters.maxPrice;

  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.location ? { location: filters.location } : {}),
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
    ...(filters.listingType ? { listingType: filters.listingType } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(minPriceKobo !== undefined ? { minPriceKobo: String(minPriceKobo) } : {}),
    ...(maxPriceKobo !== undefined ? { maxPriceKobo: String(maxPriceKobo) } : {}),
    ...(filters.beds !== undefined ? { bedrooms: filters.beds } : {}),
    ...(filters.bathrooms !== undefined ? { bathrooms: filters.bathrooms } : {}),
    ...(filters.minSizeSqm !== undefined ? { minSizeSqm: String(filters.minSizeSqm) } : {}),
    ...(filters.maxSizeSqm !== undefined ? { maxSizeSqm: String(filters.maxSizeSqm) } : {}),
    ...(filters.featured !== undefined ? { featured: filters.featured } : {}),
    ...(filters.openHouse !== undefined ? { openHouse: filters.openHouse } : {}),
    ...(filters.newConstruction !== undefined ? { newConstruction: filters.newConstruction } : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
    ...(filters.page !== undefined ? { page: filters.page } : {}),
    ...(filters.pageSize !== undefined ? { pageSize: filters.pageSize } : {}),
  };
}

export async function listProperties(
  filters?: PropertyFilters,
): Promise<{ data: Property[]; meta: components["schemas"]["PropertyPaginationMetaDto"] }> {
  const response = await unwrapApiResponse(
    privateClient.GET("/api/v1/properties", {
      params: { query: filters as never },
    }),
  );
  const typed = response as components["schemas"]["PaginatedPropertiesResponseDto"];
  return {
    data: (typed.data ?? []) as Property[],
    meta: typed.meta,
  };
}

export async function createProperty(payload: CreatePropertyPayload): Promise<Property> {
  return (await unwrapApiResponse(privateClient.POST("/api/v1/properties", { body: payload }))) as unknown as Property;
}

export async function getPropertyById(id: string): Promise<Property> {
  return (await unwrapApiResponse(privateClient.GET("/api/v1/properties/{id}", { params: { path: { id } } }))) as unknown as Property;
}

export async function updateProperty(id: string, payload: UpdatePropertyPayload): Promise<Property> {
  return (await unwrapApiResponse(privateClient.PATCH("/api/v1/properties/{id}", { params: { path: { id } }, body: payload }))) as unknown as Property;
}

export async function submitPropertyForReview(
  id: string,
  payload?: { reason?: string },
): Promise<Property> {
  return (await unwrapApiResponse(
    privateClient.POST("/api/v1/properties/{id}/submit-review", {
      params: { path: { id } },
      body: payload ?? {},
    }),
  )) as unknown as Property;
}

export async function approveProperty(id: string): Promise<Property> {
  return (await unwrapApiResponse(privateClient.POST("/api/v1/properties/{id}/approve", { params: { path: { id } } }))) as unknown as Property;
}

export async function publishProperty(id: string, payload?: { reason?: string }): Promise<Property> {
  return (await unwrapApiResponse(
    privateClient.POST("/api/v1/properties/{id}/publish", {
      params: { path: { id } },
      body: payload ?? {},
    }),
  )) as unknown as Property;
}

export async function archiveProperty(id: string, payload?: { reason?: string }): Promise<Property> {
  return (await unwrapApiResponse(
    privateClient.POST("/api/v1/properties/{id}/archive", {
      params: { path: { id } },
      body: payload ?? {},
    }),
  )) as unknown as Property;
}

export async function getPublicListings(filters?: PublicListingsQuery): Promise<PublicListingsResponse> {
  const response = await unwrapApiResponse(
    publicClient.GET("/api/v1/public/properties/discovery" as never, {
      params: { query: mapSearchFiltersToSpecQuery(filters) },
    } as never),
  );
  const typed = response as components["schemas"]["PaginatedPublicPropertiesResponseDto"] & {
    meta?: Partial<PublicListingsMeta> & { limit?: number };
  };

  return {
    data: typed.data,
    meta: {
      page: Number(typed.meta?.page ?? 1),
      pageSize: Number(typed.meta?.pageSize ?? typed.meta?.limit ?? 25),
      total: Number(typed.meta?.total ?? 0),
      totalPages: Number(typed.meta?.totalPages ?? 1),
    },
  };
}

export async function discoverProperties(
  filters?: PublicListingsQuery,
): Promise<components["schemas"]["PaginatedPublicPropertiesResponseDto"]> {
  const response = await getPublicListings(filters);
  return {
    data: response.data,
    meta: response.meta,
  } as unknown as components["schemas"]["PaginatedPublicPropertiesResponseDto"];
}

export async function getPublicPropertyById(id: string): Promise<components["schemas"]["PublicPropertyResponseDto"]> {
  return unwrapApiResponse(
    publicClient.GET("/api/v1/public/properties/{id}" as never, { params: { path: { id } } } as never),
  ) as Promise<components["schemas"]["PublicPropertyResponseDto"]>;
}

export async function getFeaturedProperties(): Promise<components["schemas"]["FeaturedPropertyResponseDto"][]> {
  return unwrapApiResponse(publicClient.GET("/api/v1/featured-properties"));
}

export async function listPropertyImages(propertyId: string): Promise<PropertyImage[]> {
  return unwrapApiResponse(
    privateClient.GET("/api/v1/property-media/properties/{propertyId}/images", {
      params: { path: { propertyId } },
    }),
  );
}
