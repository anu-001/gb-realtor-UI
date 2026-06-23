import { UserRole } from "@/constants/api-enums";
import type { AuthUser } from "@/types/auth";
import { resolveAgentRole } from "@/utils/agent-access";

type JsonRecord = Record<string, unknown>;

const ROLE_KEYS = [
  "role",
  "roleCode",
  "roleName",
  "code",
  "name",
  "type",
  "userRole",
  "accountRole",
] as const;

const ROLE_COLLECTION_KEYS = [
  "roles",
  "roleCodes",
  "authorities",
  "permissions",
  "claims",
  "user",
  "account",
  "profile",
  "data",
  "payload",
] as const;

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return globalThis.atob(padded);
}

function decodeJwtPayload(accessToken: string | null | undefined): JsonRecord | null {
  if (!accessToken) return null;

  try {
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) return null;
    return JSON.parse(decodeBase64Url(payloadPart)) as JsonRecord;
  } catch {
    return null;
  }
}

function collectRoleCandidates(value: unknown, depth = 0): string[] {
  if (depth > 4 || value === null || value === undefined) return [];

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectRoleCandidates(item, depth + 1));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as JsonRecord;
  const candidates: string[] = [];

  for (const key of ROLE_KEYS) {
    const entry = record[key];
    if (typeof entry === "string" && entry.trim()) {
      candidates.push(entry.trim());
    }
  }

  for (const key of ROLE_COLLECTION_KEYS) {
    if (record[key] !== undefined) {
      candidates.push(...collectRoleCandidates(record[key], depth + 1));
    }
  }

  return candidates;
}

function isKnownWorkspaceRole(role: string | null): role is (typeof UserRole)[keyof typeof UserRole] {
  return Boolean(role && Object.values(UserRole).includes(role as (typeof UserRole)[keyof typeof UserRole]));
}

export function resolveWorkspaceRole(user?: AuthUser | null, accessToken?: string | null): string | null {
  const candidates = [
    user?.role ?? null,
    user?.roles?.[0]?.code ?? null,
    ...collectRoleCandidates(decodeJwtPayload(accessToken)),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  for (const candidate of candidates) {
    const resolved = resolveAgentRole(candidate);
    if (isKnownWorkspaceRole(resolved)) {
      return resolved;
    }
  }

  return null;
}

export function resolveWorkspaceRoleFromToken(accessToken?: string | null): string | null {
  return resolveWorkspaceRole(null, accessToken);
}
