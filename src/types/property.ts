import type { components } from "./api.generated";
import type { SortDirection } from "./common";

export type PropertyImage = components["schemas"]["PropertyImageResponseDto"];

export type CreatePropertyPayload = components["schemas"]["CreatePropertyDto"];
export type UpdatePropertyPayload = components["schemas"]["UpdatePropertyDto"];

export type Property = Omit<
  components["schemas"]["PropertyResponseDto"],
  "bedrooms" | "bathrooms" | "reviewedAt" | "publishedAt"
> & {
  purpose?: string;
  status?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  images?: PropertyImage[];
  thumbnails?: PropertyImage[];
  streetAddress?: string | null;
  parkingSpaces?: number | null;
  sizeSqm?: number | null;
  isFeatured?: boolean;
  listingType?: string;
};

export type PropertyListItem = Property;

export interface PropertyFilters {
  search?: string;
  q?: string;
  purpose?: string;
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
  limit?: number;
}
