import type { components } from "./api.generated";

export type AuthTokens = components["schemas"]["TokenPairDto"];
export type LoginPayload = components["schemas"]["LoginDto"];
export type RefreshPayload = components["schemas"]["RefreshTokenDto"];

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  roles?: components["schemas"]["UserRoleDto"][];
  role?: string;
};
