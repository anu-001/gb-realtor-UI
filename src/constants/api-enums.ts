export const PropertyStatus = {
  Draft: "Draft",
  PendingReview: "PendingReview",
  Published: "Published",
  Archived: "Archived",
} as const;

export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

export const UserRole = {
  SuperAdmin: "SuperAdmin",
  PropertyManager: "PropertyManager",
  ContentEditor: "ContentEditor",
  Analyst: "Analyst",
  SupportAgent: "SupportAgent",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const LeadStatus = {
  New: "New",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Closed: "Closed",
  Lost: "Lost",
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const PropertyType = {
  House: "House",
  Apartment: "Apartment",
  Land: "Land",
  Commercial: "Commercial",
  Villa: "Villa",
} as const;

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const ListingType = {
  Sale: "Sale",
  Rent: "Rent",
} as const;

export type ListingType = (typeof ListingType)[keyof typeof ListingType];
