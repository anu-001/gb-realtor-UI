import { UserRole } from "@/constants/api-enums";

const elevatedRoles = [UserRole.PropertyManager, UserRole.ContentEditor, UserRole.SuperAdmin] as const;
const publishRoles = [UserRole.PropertyManager, UserRole.SuperAdmin] as const;
const leadRoles = [UserRole.SupportAgent, UserRole.PropertyManager, UserRole.SuperAdmin] as const;

function normalizeRole(role?: string | null): string | null {
  if (!role) return null;

  const compact = role.replace(/[\s_-]+/g, "").toLowerCase();
  const aliases: Record<string, string> = {
    admin: UserRole.SuperAdmin,
    administrator: UserRole.SuperAdmin,
    superadmin: UserRole.SuperAdmin,
    manager: UserRole.PropertyManager,
    propertymanager: UserRole.PropertyManager,
    contenteditor: UserRole.ContentEditor,
    editor: UserRole.ContentEditor,
    analyst: UserRole.Analyst,
    analytics: UserRole.Analyst,
    supportagent: UserRole.SupportAgent,
    support: UserRole.SupportAgent,
    agent: UserRole.SupportAgent,
  };

  return aliases[compact] ?? role;
}

export function canCreateListing(role?: string | null): boolean {
  const resolved = normalizeRole(role);
  return Boolean(resolved && elevatedRoles.includes(resolved as (typeof elevatedRoles)[number]));
}

export function canEditListing(role?: string | null): boolean {
  return canCreateListing(role);
}

export function canPublishListing(role?: string | null): boolean {
  const resolved = normalizeRole(role);
  return Boolean(resolved && publishRoles.includes(resolved as (typeof publishRoles)[number]));
}

export function canArchiveListing(role?: string | null): boolean {
  return canPublishListing(role);
}

export function canManageFeaturedListing(role?: string | null): boolean {
  return canPublishListing(role);
}

export function canViewLeads(role?: string | null): boolean {
  const resolved = normalizeRole(role);
  return Boolean(resolved && leadRoles.includes(resolved as (typeof leadRoles)[number]));
}

export function canViewAnalytics(role?: string | null): boolean {
  const resolved = normalizeRole(role);
  return resolved === UserRole.Analyst || resolved === UserRole.SuperAdmin || resolved === UserRole.PropertyManager;
}

export function canManageTeam(role?: string | null): boolean {
  return normalizeRole(role) === UserRole.SuperAdmin;
}
