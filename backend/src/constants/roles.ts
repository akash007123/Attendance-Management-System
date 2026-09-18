export const ROLES = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
