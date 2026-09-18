import {
  dbGetUsers,
  dbGetUserById,
  dbGetUserByEmail,
  dbCreateUser,
  dbUpdateUser,
  dbGetAttendance,
  dbGetAttendanceById,
  dbPunchIn,
  dbPunchOut,
  dbValidateAttendance,
  dbGetOvertimeRequests,
  dbCreateOvertimeRequest,
  dbReviewOvertime,
  dbGetNotifications,
  dbMarkNotificationRead,
  dbMarkAllNotificationsRead,
  dbGetSettings,
  dbUpdateSettings,
  resetMockDatabase,
} from "./mockDatabase";
import { User } from "../types/user";
import { Attendance, AttendanceStatus, ValidationStatus } from "../types/attendance";
import { OvertimeRequest } from "../types/overtime";
import { NotificationItem } from "../types/notification";
import { SystemSettings } from "../types/settings";
import { LoginCredentials, SignupData } from "../types/auth";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // ---------------- AUTH ----------------
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await delay(300);
    const user = dbGetUserByEmail(credentials.email);
    if (!user) {
      throw new Error("Invalid credentials. Please verify your email and try again.");
    }
    if (user.status !== "ACTIVE") {
      throw new Error("This account is currently deactivated. Please contact your system administrator.");
    }
    const token = `ams_jwt_${user.id}_${Date.now()}`;
    return { user, token };
  },

  async signup(data: SignupData): Promise<{ user: User; token: string }> {
    await delay(350);
    const existing = dbGetUserByEmail(data.email);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }
    const newUser = dbCreateUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      department: data.department,
      designation: data.designation,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      status: "ACTIVE",
    });
    const token = `ams_jwt_${newUser.id}_${Date.now()}`;
    return { user: newUser, token };
  },

  async getCurrentUser(id: string): Promise<User> {
    await delay(100);
    const user = dbGetUserById(id);
    if (!user) throw new Error("User session expired or not found");
    return user;
  },

  // ---------------- USERS ----------------
  async getUsers(): Promise<User[]> {
    await delay(200);
    return dbGetUsers();
  },

  async createUser(userData: any): Promise<User> {
    await delay(250);
    return dbCreateUser(userData);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(250);
    return dbUpdateUser(id, updates);
  },

  // ---------------- ATTENDANCE ----------------
  async getAttendance(filter?: {
    employeeId?: string;
    managerId?: string;
    department?: string;
    date?: string;
    status?: AttendanceStatus;
    validationStatus?: ValidationStatus;
  }): Promise<Attendance[]> {
    await delay(200);
    let list = dbGetAttendance();
    const users = dbGetUsers();

    if (filter?.employeeId) {
      list = list.filter((a) => a.employeeId === filter.employeeId);
    }
    if (filter?.managerId) {
      const teamUserIds = users
        .filter((u) => u.managerId === filter.managerId)
        .map((u) => u.id);
      list = list.filter((a) => teamUserIds.includes(a.employeeId));
    }
    if (filter?.department && filter.department !== "ALL") {
      list = list.filter((a) => a.employeeDepartment === filter.department);
    }
    if (filter?.date) {
      list = list.filter((a) => a.date === filter.date);
    }
    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    if (filter?.validationStatus) {
      list = list.filter((a) => a.validationStatus === filter.validationStatus);
    }

    return list;
  },

  async getAttendanceById(id: string): Promise<Attendance> {
    await delay(150);
    const record = dbGetAttendanceById(id);
    if (!record) throw new Error("Attendance record not found");
    return record;
  },

  async punchIn(payload: {
    employeeId: string;
    selfie: string;
    location: Attendance["punchInLocation"];
    faceDetected?: boolean;
    faceConfidence?: number;
  }): Promise<Attendance> {
    await delay(400);
    return dbPunchIn(payload);
  },

  async punchOut(payload: {
    attendanceId: string;
    selfie: string;
    location: Attendance["punchInLocation"];
  }): Promise<Attendance> {
    await delay(400);
    return dbPunchOut(payload);
  },

  async validateAttendance(payload: {
    attendanceId: string;
    validationStatus: ValidationStatus;
    remarks?: string;
    validatedBy: string;
  }): Promise<Attendance> {
    await delay(300);
    return dbValidateAttendance(payload);
  },

  // ---------------- OVERTIME ----------------
  async getOvertimeRequests(filter?: {
    employeeId?: string;
    managerId?: string;
    status?: string;
  }): Promise<OvertimeRequest[]> {
    await delay(200);
    let list = dbGetOvertimeRequests();
    const users = dbGetUsers();

    if (filter?.employeeId) {
      list = list.filter((r) => r.employeeId === filter.employeeId);
    }
    if (filter?.managerId) {
      const teamUserIds = users
        .filter((u) => u.managerId === filter.managerId)
        .map((u) => u.id);
      list = list.filter((r) => teamUserIds.includes(r.employeeId));
    }
    if (filter?.status && filter.status !== "ALL") {
      list = list.filter((r) => r.status === filter.status);
    }

    return list;
  },

  async createOvertimeRequest(data: {
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    requestedHours: number;
    reason: string;
    attendanceId?: string;
  }): Promise<OvertimeRequest> {
    await delay(350);
    return dbCreateOvertimeRequest(data);
  },

  async reviewOvertime(payload: {
    requestId: string;
    status: "APPROVED" | "REJECTED";
    remarks?: string;
    reviewerId: string;
    reviewerName: string;
  }): Promise<OvertimeRequest> {
    await delay(300);
    return dbReviewOvertime(payload);
  },

  // ---------------- NOTIFICATIONS ----------------
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    await delay(150);
    return dbGetNotifications(userId);
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(100);
    dbMarkNotificationRead(id);
  },

  async markAllNotificationsRead(userId?: string): Promise<void> {
    await delay(150);
    dbMarkAllNotificationsRead(userId);
  },

  // ---------------- SETTINGS ----------------
  async getSettings(): Promise<SystemSettings> {
    await delay(150);
    return dbGetSettings();
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    await delay(300);
    return dbUpdateSettings(updates);
  },

  async resetDemo(): Promise<void> {
    await delay(400);
    resetMockDatabase();
  },
};
