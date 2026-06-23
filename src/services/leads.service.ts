import type {
  CreateLeadPayload,
  Lead,
  LeadAssignmentPayload,
  LeadNote,
  LeadNotePayload,
  LeadStatusPayload,
} from "../types/lead";
import { privateClient, publicClient } from "./api-client";
import { unwrapApiResponse } from "./_request";

export async function captureLead(payload: CreateLeadPayload): Promise<Lead> {
  return unwrapApiResponse((publicClient.POST as any)("/api/v1/public/leads", { body: payload }));
}

export const createPublicLead = captureLead;

export async function listLeads(
  filters?: Record<string, unknown>,
): Promise<import("../types/api.generated").components["schemas"]["PaginatedLeadsResponseDto"]> {
  const response = await unwrapApiResponse(
    privateClient.GET("/api/v1/leads", {
      params: { query: filters as never },
    }),
  );
  return response as import("../types/api.generated").components["schemas"]["PaginatedLeadsResponseDto"];
}

export async function getLead(id: string): Promise<Lead> {
  return unwrapApiResponse(privateClient.GET("/api/v1/leads/{id}", { params: { path: { id } } }));
}

export async function assignLead(id: string, payload: LeadAssignmentPayload): Promise<Lead> {
  return unwrapApiResponse(privateClient.POST("/api/v1/leads/{id}/assignments", { params: { path: { id } }, body: payload }));
}

export async function updateLeadStatus(id: string, payload: LeadStatusPayload): Promise<Lead> {
  return unwrapApiResponse(privateClient.PATCH("/api/v1/leads/{id}/status", { params: { path: { id } }, body: payload }));
}

export async function addLeadNote(id: string, payload: LeadNotePayload): Promise<LeadNote> {
  return unwrapApiResponse(privateClient.POST("/api/v1/leads/{id}/notes", { params: { path: { id } }, body: payload }));
}
