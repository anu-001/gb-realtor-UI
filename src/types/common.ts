import type { components } from "./api.generated";

export type PaginationMeta = components["schemas"]["PaginationMetaDto"];

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  meta?: unknown;
}

export type SortDirection = "asc" | "desc";

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  errors?: ApiFieldError[];
  timestamp?: string;
  path?: string;
}
