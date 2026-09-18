import { User, UserRole } from "./user";

export interface AuthState {
  currentUser: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  department: string;
  designation: string;
}
