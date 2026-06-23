import type { components } from "./api.generated";

export type LeadNote = components["schemas"]["LeadNoteResponseDto"];

export type CreateLeadPayload = components["schemas"]["CreateLeadDto"];
export type LeadStatusPayload = components["schemas"]["UpdateLeadStatusDto"];
export type LeadAssignmentPayload = components["schemas"]["AssignLeadDto"];
export type LeadNotePayload = components["schemas"]["AddLeadNoteDto"];

export type Lead = components["schemas"]["LeadResponseDto"] & {
  notes?: LeadNote[];
};

export type LeadListItem = components["schemas"]["LeadResponseDto"];

export interface UpdateLeadPayload {
  assigneeId?: string;
  status?: string;
  note?: string;
}
