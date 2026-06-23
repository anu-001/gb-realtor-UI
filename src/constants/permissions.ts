export const Permissions = {
  PropertyView: "property:view",
  PropertyCreate: "property:create",
  PropertyUpdate: "property:update",
  PropertyPublish: "property:publish",
  PropertyArchive: "property:archive",
  LeadView: "request:view",
  LeadUpdate: "request:update",
  AnalyticsView: "analytics:view",
  UserView: "user:view",
  UserCreate: "user:create",
  UserUpdate: "user:update",
  UserDeactivate: "user:deactivate",
  RoleUpdate: "role:update",
  AuditView: "audit:view",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
