import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { getPublicListings, type PublicListingsQuery, type PublicListingsResponse } from "@/services/properties.service";
import { PropertyType } from "@/constants/api-enums";

const listingTypeSchema = z.enum(["sale", "rent"]);
const sortSchema = z.enum(["newest", "oldest", "price_asc", "price_desc", "featured_first"]);
const propertyTypeSchema = z.enum([PropertyType.House, PropertyType.Apartment, PropertyType.Land, PropertyType.Commercial, PropertyType.Villa]);

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const numberFromString = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const positiveIntFromString = (value: unknown) => {
  const parsed = numberFromString(value);
  if (parsed === undefined) return undefined;
  const intValue = Math.trunc(parsed);
  return intValue > 0 ? intValue : undefined;
};

const searchParamSchema = z.object({
  q: optionalTrimmedString,
  location: optionalTrimmedString,
  type: propertyTypeSchema.optional(),
  listingType: listingTypeSchema.optional(),
  beds: z.preprocess(positiveIntFromString, z.number().int().positive().optional()),
  minPrice: z.preprocess(numberFromString, z.number().int().nonnegative().optional()),
  maxPrice: z.preprocess(numberFromString, z.number().int().nonnegative().optional()),
  featured: z
    .preprocess((value) => (value === "true" ? true : value === "false" ? false : undefined), z.boolean().optional())
    .optional(),
  sort: sortSchema.catch("newest"),
  page: z.preprocess((value) => positiveIntFromString(value) ?? 1, z.number().int().min(1).catch(1)),
  pageSize: z.preprocess((value) => positiveIntFromString(value) ?? 12, z.number().int().min(1).max(48).catch(12)),
});

export type PropertySearchState = {
  q?: string;
  location?: string;
  type?: z.infer<typeof propertyTypeSchema>;
  listingType?: z.infer<typeof listingTypeSchema>;
  beds?: number;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort: z.infer<typeof sortSchema>;
  page: number;
  pageSize: number;
};

type UpdateSearchParams = Partial<PropertySearchState> & {
  resetPage?: boolean;
};

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

function parseSearchParams(searchParams: URLSearchParams): PropertySearchState {
  const parsed = searchParamSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    listingType: searchParams.get("listingType") ?? undefined,
    beds: searchParams.get("beds") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    featured: searchParams.get("featured") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  const fallback: PropertySearchState = {
    sort: "newest",
    page: 1,
    pageSize: 12,
  };

  if (!parsed.success) {
    return fallback;
  }

  const { minPrice, maxPrice } = parsed.data;
  const normalizedMin = minPrice;
  const normalizedMax = maxPrice;
  const safeRange =
    normalizedMin !== undefined && normalizedMax !== undefined && normalizedMin > normalizedMax
      ? { minPrice: normalizedMax, maxPrice: normalizedMin }
      : { minPrice: normalizedMin, maxPrice: normalizedMax };

  return {
    q: parsed.data.q || undefined,
    location: parsed.data.location || undefined,
    type: parsed.data.type,
    listingType: parsed.data.listingType,
    beds: parsed.data.beds,
    minPrice: safeRange.minPrice,
    maxPrice: safeRange.maxPrice,
    featured: parsed.data.featured,
    sort: parsed.data.sort,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
}

function toPublicListingsQuery(filters: PropertySearchState): PublicListingsQuery {
  const typeMap: Record<z.infer<typeof propertyTypeSchema>, PublicListingsQuery["type"]> = {
    [PropertyType.House]: "house",
    [PropertyType.Apartment]: "apartment",
    [PropertyType.Land]: "land",
    [PropertyType.Commercial]: "commercial",
    [PropertyType.Villa]: "villa",
  };

  return {
    q: filters.q?.trim() || undefined,
    location: filters.location?.trim() || undefined,
    type: filters.type ? typeMap[filters.type] : undefined,
    listingType: filters.listingType,
    beds: filters.beds,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    featured: filters.featured,
    sort: filters.sort,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

function serializeFilters(next: PropertySearchState): string {
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.location) params.set("location", next.location);
  if (next.type) params.set("type", next.type);
  if (next.listingType) params.set("listingType", next.listingType);
  if (next.beds !== undefined) params.set("beds", String(next.beds));
  if (next.minPrice !== undefined) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== undefined) params.set("maxPrice", String(next.maxPrice));
  if (next.featured !== undefined) params.set("featured", String(next.featured));
  if (next.sort) params.set("sort", next.sort);
  params.set("page", String(next.page));
  params.set("pageSize", String(next.pageSize));
  return params.toString();
}

function mergeFilters(current: PropertySearchState, next: UpdateSearchParams): PropertySearchState {
  const merged: PropertySearchState = {
    ...current,
    ...next,
    page: next.resetPage ? 1 : next.page ?? current.page,
    pageSize: next.pageSize ?? current.pageSize,
    sort: next.sort ?? current.sort,
  };

  if (next.location !== undefined) {
    merged.location = next.location?.trim() || undefined;
  }

  if (next.q !== undefined) {
    merged.q = next.q?.trim() || undefined;
  }

  if (next.type !== undefined) merged.type = next.type;
  if (next.listingType !== undefined) merged.listingType = next.listingType;
  if (next.beds !== undefined) merged.beds = next.beds;
  if (next.minPrice !== undefined) merged.minPrice = next.minPrice;
  if (next.maxPrice !== undefined) merged.maxPrice = next.maxPrice;
  if (next.featured !== undefined) merged.featured = next.featured;

  if (merged.minPrice !== undefined && merged.maxPrice !== undefined && merged.minPrice > merged.maxPrice) {
    [merged.minPrice, merged.maxPrice] = [merged.maxPrice, merged.minPrice];
  }

  return merged;
}

export type UsePropertySearchResult = {
  filters: PropertySearchState;
  publicQuery: PublicListingsQuery;
  data: PublicListingsResponse["data"];
  meta: PublicListingsResponse["meta"];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
  updateFilters: (next: UpdateSearchParams) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
};

export function usePropertySearch(): UsePropertySearchResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  const debouncedFilters = useDebouncedValue(filters, 300);

  const query = useQuery({
    queryKey: ["public-properties", serializeFilters(debouncedFilters)],
    queryFn: () => getPublicListings(toPublicListingsQuery(debouncedFilters)),
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: false,
    throwOnError: true,
  });

  const updateFilters = useCallback(
    (next: UpdateSearchParams) => {
      const merged = mergeFilters(filters, next);
      setSearchParams(new URLSearchParams(serializeFilters(merged)), { replace: true });
    },
    [filters, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback(
    (page: number) => {
      updateFilters({ page: Math.max(1, page), resetPage: false });
    },
    [updateFilters],
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      updateFilters({ pageSize: Math.max(1, pageSize), resetPage: true });
    },
    [updateFilters],
  );

  return {
    filters,
    publicQuery: toPublicListingsQuery(debouncedFilters),
    data: query.data?.data ?? [],
    meta: query.data?.meta ?? { page: filters.page, pageSize: filters.pageSize, total: 0, totalPages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
  };
}

export { parseSearchParams };
