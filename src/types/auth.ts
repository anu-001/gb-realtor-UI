import type { components } from "./api.generated";
import type { InternalUser } from "./user";

export type AuthTokens = components["schemas"]["TokenPairDto"];
export type LoginPayload = components["schemas"]["LoginDto"];
export type RefreshPayload = components["schemas"]["RefreshTokenDto"];

export type AuthUser = Pick<
  InternalUser,
  "id" | "email" | "fullName" | "phoneNumber" | "isActive" | "roles"
>;
