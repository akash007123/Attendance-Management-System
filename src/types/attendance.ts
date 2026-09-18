export type AttendanceStatus = "PRESENT" | "INCOMPLETE" | "COMPLETED" | "ABSENT" | "LATE" | "HALF_DAY";

export type ValidationStatus = "PENDING" | "VALID" | "INVALID" | "SUSPICIOUS";

export type OvertimeStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  isWithinGeofence: boolean;
  distanceMeters?: number;
  address?: string;
  isDemoLocation?: boolean;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  employeeDepartment: string;
  employeeAvatar?: string;
  date: string; // YYYY-MM-DD
  punchIn: string; // ISO String
  punchOut?: string | null; // ISO String
  punchInSelfie: string; // base64 / dataUrl
  punchOutSelfie?: string | null;
  punchInLocation: AttendanceLocation;
  punchOutLocation?: AttendanceLocation | null;
  totalWorkingMinutes: number;
  status: AttendanceStatus;
  validationStatus: ValidationStatus;
  validationRemarks?: string;
  validatedBy?: string;
  validatedAt?: string;
  overtimeStatus: OvertimeStatus;
  overtimeHours?: number;
  overtimeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  presentToday: number;
  completedToday: number;
  incompleteToday: number;
  absentToday: number;
  pendingValidation: number;
  totalEmployees: number;
}
