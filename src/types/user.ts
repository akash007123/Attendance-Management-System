export type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  designation: string;
  avatar: string;
  managerId?: string;
  managerName?: string;
  status: UserStatus;
  isActive?: boolean;
  joinedDate: string;
  createdAt?: string;
}
