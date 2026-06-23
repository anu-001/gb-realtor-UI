import { UserRole } from "@/constants/api-enums";

const dashboardRoles = [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.Analyst] as const;
const propertyViewRoles = [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.ContentEditor, UserRole.Analyst, UserRole.SupportAgent] as const;
const propertyCreateRoles = [UserRole.SuperAdmin, UserRole.PropertyManager] as const;
const propertyEditRoles = [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.ContentEditor] as const;
const propertyPublishRoles = [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.ContentEditor] as const;
const propertyArchiveRoles = [UserRole.SuperAdmin, UserRole.PropertyManager] as const;
const leadViewRoles = [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.SupportAgent, UserRole.Analyst] as const;
const leadManageRoles = [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.SupportAgent] as const;
const analyticsRoles = [UserRole.SuperAdmin, UserRole.Analyst] as const;
const featuredRoles = [UserRole.SuperAdmin, UserRole.PropertyManager, UserRole.ContentEditor] as const;

export function resolveAgentRole(role?: string | null): string | null {
  if (!role) return null;

  const compact = role.replace(/[\s_-]+/g, "").toLowerCase();
  const aliases: Record<string, string> = {
    admin: UserRole.SuperAdmin,
    administrator: UserRole.SuperAdmin,
    superadmin: UserRole.SuperAdmin,
    superadministrator: UserRole.SuperAdmin,
    superuser: UserRole.SuperAdmin,
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

  if (aliases[compact]) {
    return aliases[compact];
  }

  if (compact.includes("super") && compact.includes("admin")) {
    return UserRole.SuperAdmin;
  }

  if (compact.includes("property") && compact.includes("manager")) {
    return UserRole.PropertyManager;
  }

  if (compact.includes("content") && compact.includes("editor")) {
    return UserRole.ContentEditor;
  }

  if (compact.includes("support") && compact.includes("agent")) {
    return UserRole.SupportAgent;
  }

  if (compact.includes("analyst") || compact.includes("analytics")) {
    return UserRole.Analyst;
  }

  return role;
}

export function canCreateListing(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && propertyCreateRoles.includes(resolved as (typeof propertyCreateRoles)[number]));
}

export function canEditListing(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && propertyEditRoles.includes(resolved as (typeof propertyEditRoles)[number]));
}

export function canPublishListing(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && propertyPublishRoles.includes(resolved as (typeof propertyPublishRoles)[number]));
}

export function canArchiveListing(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && propertyArchiveRoles.includes(resolved as (typeof propertyArchiveRoles)[number]));
}

export function canManageFeaturedListing(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && featuredRoles.includes(resolved as (typeof featuredRoles)[number]));
}

export function canViewLeads(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && leadViewRoles.includes(resolved as (typeof leadViewRoles)[number]));
}

export function canManageLeadActions(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && leadManageRoles.includes(resolved as (typeof leadManageRoles)[number]));
}

export function canViewAnalytics(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && analyticsRoles.includes(resolved as (typeof analyticsRoles)[number]));
}

export function canViewDashboard(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && dashboardRoles.includes(resolved as (typeof dashboardRoles)[number]));
}

export function canViewProperties(role?: string | null): boolean {
  const resolved = resolveAgentRole(role);
  return Boolean(resolved && propertyViewRoles.includes(resolved as (typeof propertyViewRoles)[number]));
}

export function canManageTeam(role?: string | null): boolean {
  return resolveAgentRole(role) === UserRole.SuperAdmin;
}
