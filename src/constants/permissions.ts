export const Permissions = {
  PropertyView: "property.view",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
