import type {
  CreateLeadPayload,
  Lead,
  LeadAssignmentPayload,
  LeadNote,
  LeadNotePayload,
  LeadStatusPayload,
  PublicPropertyRequestPayload,
  PublicLeadPayload,
} from "../types/lead";
import { privateClient, publicClient } from "./api-client";
import { unwrapApiResponse } from "./_request";

type PaginatedLeadsResponse = {
  data: Lead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function normalizeLead(lead: Record<string, unknown>): Lead {
  const record = lead;
  const assignee = record.assignee && typeof record.assignee === "object" ? (record.assignee as Record<string, unknown>) : null;

  return {
    id: String(record.id ?? ""),
    fullName: String(record.fullName ?? ""),
    phoneNumber: String(record.phoneNumber ?? ""),
    status: String(record.status ?? "new"),
    createdAt: String(record.createdAt ?? ""),
    updatedAt: String(record.updatedAt ?? ""),
    propertyId: typeof record.propertyId === "string" ? record.propertyId : null,
    email: typeof record.email === "string" ? record.email : null,
    preferredLocation: typeof record.preferredLocation === "string" ? record.preferredLocation : null,
    budgetKobo: typeof record.budgetKobo === "string" ? record.budgetKobo : null,
    propertyInterest: typeof record.propertyInterest === "string" ? record.propertyInterest : null,
    inquiryNotes: typeof record.inquiryNotes === "string" ? record.inquiryNotes : null,
    message: typeof record.message === "string" ? record.message : null,
    source: typeof record.source === "string" ? record.source : null,
    assignmentStatus: typeof record.assignmentStatus === "string" ? record.assignmentStatus : null,
    assignee: assignee
      ? {
        id: typeof assignee.id === "string" ? assignee.id : undefined,
        email: typeof assignee.email === "string" ? assignee.email : undefined,
        fullName: typeof assignee.fullName === "string" ? assignee.fullName : undefined,
        }
      : null,
  };
}

export async function captureLead(payload: PublicLeadPayload | CreateLeadPayload): Promise<Lead> {
  const postPublicLead = publicClient.POST as unknown as (
    path: string,
    options: { body: unknown },
  ) => Promise<{ data?: Record<string, unknown>; error?: unknown; response: Response }>;
  return normalizeLead(await unwrapApiResponse(postPublicLead("/api/v1/public/leads", { body: payload })));
}

export const createPublicLead = captureLead;

export async function createPublicPropertyRequest(payload: PublicPropertyRequestPayload): Promise<Lead> {
  const postPublicPropertyRequest = publicClient.POST as unknown as (
    path: string,
    options: { body: unknown },
  ) => Promise<{ data?: Record<string, unknown>; error?: unknown; response: Response }>;

  return normalizeLead(await unwrapApiResponse(postPublicPropertyRequest("/api/v1/public/leads/request", { body: payload })));
}

export async function listLeads(filters?: Record<string, unknown>): Promise<PaginatedLeadsResponse> {
  const response = await unwrapApiResponse(
    privateClient.GET("/api/v1/leads", {
      params: { query: filters as never },
    }),
  );
  const typed = response as import("../types/api.generated").components["schemas"]["PaginatedLeadsResponseDto"];
  const meta = typed.meta as unknown as { page?: number; limit?: number; total?: number; totalPages?: number };

  return {
    data: (typed.data ?? []).map((lead) => normalizeLead(lead as Record<string, unknown>)),
    meta: {
      page: Number(meta?.page ?? 1),
      limit: Number(meta?.limit ?? filters?.limit ?? 25),
      total: Number(meta?.total ?? 0),
      totalPages: Number(meta?.totalPages ?? 1),
    },
  };
}

export async function getLead(id: string): Promise<Lead> {
  return normalizeLead(await unwrapApiResponse(privateClient.GET("/api/v1/leads/{id}", { params: { path: { id } } })));
}

export async function assignLead(id: string, payload: LeadAssignmentPayload): Promise<Lead> {
  return normalizeLead(
    await unwrapApiResponse(privateClient.POST("/api/v1/leads/{id}/assignments", { params: { path: { id } }, body: payload })),
  );
}

export async function updateLeadStatus(id: string, payload: LeadStatusPayload): Promise<Lead> {
  return normalizeLead(
    await unwrapApiResponse(privateClient.PATCH("/api/v1/leads/{id}/status", { params: { path: { id } }, body: payload })),
  );
}

export async function addLeadNote(id: string, payload: LeadNotePayload): Promise<LeadNote> {
  return unwrapApiResponse(privateClient.POST("/api/v1/leads/{id}/notes", { params: { path: { id } }, body: payload })) as Promise<LeadNote>;
}
