import type { components } from "./api.generated";
import type { SortDirection } from "./common";

export type PropertyImage = components["schemas"]["PropertyImageResponseDto"];

export type CreatePropertyPayload = components["schemas"]["CreatePropertyDto"];
export type UpdatePropertyPayload = components["schemas"]["UpdatePropertyDto"];

export type Property = components["schemas"]["PropertyResponseDto"] & {
  images?: PropertyImage[];
};

export type PropertyListItem = components["schemas"]["PropertyResponseDto"];

export interface PropertyFilters {
  q?: string;
  propertyType?: string;
  listingType?: string;
  status?: string;
  location?: string;
  state?: string;
  city?: string;
  minPriceKobo?: string;
  maxPriceKobo?: string;
  bedrooms?: number;
  bathrooms?: number;
  minSizeSqm?: string;
  maxSizeSqm?: string;
  featured?: boolean;
  sort?: SortDirection | string;
  page?: number;
  pageSize?: number;
}
