import type { components } from "./api.generated";

export type LeadNote = components["schemas"]["LeadNoteResponseDto"];

export type CreateLeadPayload = components["schemas"]["CreateLeadDto"];
export interface PublicPropertyRequestPayload {
  fullName: string;
  phoneNumber: string;
  email?: string;
  preferredLocation?: string;
  budgetKobo?: string | number;
  propertyInterest?: string;
  inquiryNotes?: string;
  message?: string;
  source?: string;
  website?: string;
}

export interface PublicLeadPayload {
  propertyId?: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  preferredLocation?: string;
  budgetKobo?: string;
  propertyInterest?: string;
  inquiryNotes: string;
  message?: string;
  source?: string;
  website?: string;
}
export type LeadStatusPayload = components["schemas"]["UpdateLeadStatusDto"];
export type LeadAssignmentPayload = components["schemas"]["AssignLeadDto"];
export type LeadNotePayload = components["schemas"]["AddLeadNoteDto"];

export type LeadAssignee = {
  id?: string;
  email?: string;
  fullName?: string;
};

export type Lead = Omit<
  components["schemas"]["LeadResponseDto"],
  "propertyId" | "email" | "preferredLocation" | "budgetKobo" | "propertyInterest" | "inquiryNotes" | "message" | "source" | "assignmentStatus" | "assignee"
> & {
  propertyId?: string | null;
  email?: string | null;
  preferredLocation?: string | null;
  budgetKobo?: string | null;
  propertyInterest?: string | null;
  inquiryNotes?: string | null;
  message?: string | null;
  source?: string | null;
  assignmentStatus?: string | null;
  assignee?: LeadAssignee | null;
  notes?: LeadNote[];
};

export type LeadListItem = components["schemas"]["LeadResponseDto"];

export interface UpdateLeadPayload {
  assigneeId?: string;
  status?: string;
  note?: string;
}
