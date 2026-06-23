import type { components } from "./api.generated";
import type { UserRole } from "@/constants/api-enums";

export type InternalUser = components["schemas"]["UserResponseDto"] & {
  role?: UserRole | string;
};
export type CreateUserPayload = components["schemas"]["CreateEmployeeDto"];
export type UpdateUserPayload = components["schemas"]["UpdateEmployeeDto"];
