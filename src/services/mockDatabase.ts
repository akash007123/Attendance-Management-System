import { User } from "../types/user";
import { Attendance, AttendanceStatus, ValidationStatus } from "../types/attendance";
import { OvertimeRequest } from "../types/overtime";
import { NotificationItem } from "../types/notification";
import { SystemSettings } from "../types/settings";
import { MOCK_USERS } from "../data/mockUsers";
import { MOCK_ATTENDANCE } from "../data/mockAttendance";
import { MOCK_OVERTIME_REQUESTS } from "../data/mockOvertime";
import { MOCK_NOTIFICATIONS } from "../data/mockNotifications";
import { DEFAULT_SETTINGS } from "../data/mockSettings";
import { getItem, setItem } from "../utils/storage";
import { calculateWorkingMinutes, isCompletedShift, getAttendanceDateString } from "../utils/date";

const KEYS = {
  USERS: "ams_db_users",
  ATTENDANCE: "ams_db_attendance",
  OVERTIME: "ams_db_overtime",
  NOTIFICATIONS: "ams_db_notifications",
  SETTINGS: "ams_db_settings",
  INITIALIZED: "ams_db_initialized_v3",
};

// Initialize database with seeds if not present
export function initMockDatabase(): void {
  const isInitialized = getItem<boolean>(KEYS.INITIALIZED, false);
  if (!isInitialized) {
    resetMockDatabase();
  }
}

export function resetMockDatabase(): void {
  setItem(KEYS.USERS, MOCK_USERS);
  setItem(KEYS.ATTENDANCE, MOCK_ATTENDANCE);
  setItem(KEYS.OVERTIME, MOCK_OVERTIME_REQUESTS);
  setItem(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
  setItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
  setItem(KEYS.INITIALIZED, true);
}

// ----------------- USERS -----------------

export function dbGetUsers(): User[] {
  initMockDatabase();
  return getItem<User[]>(KEYS.USERS, MOCK_USERS);
}

export function dbGetUserById(id: string): User | undefined {
  const users = dbGetUsers();
  return users.find(u => u.id === id);
}

export function dbGetUserByEmail(email: string): User | undefined {
  const users = dbGetUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function dbUpdateUser(id: string, updates: Partial<User>): User {
  const users = dbGetUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) throw new Error("User not found");
  
  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  setItem(KEYS.USERS, users);
  return updatedUser;
}

export function dbCreateUser(user: Omit<User, "id" | "joinedDate">): User {
  const users = dbGetUsers();
  const newUser: User = {
    ...user,
    id: `usr_${Date.now()}`,
    joinedDate: new Date().toISOString().split("T")[0],
  };
  users.push(newUser);
  setItem(KEYS.USERS, users);
  return newUser;
}

// ----------------- ATTENDANCE -----------------

export function dbGetAttendance(): Attendance[] {
  initMockDatabase();
  const list = getItem<Attendance[]>(KEYS.ATTENDANCE, MOCK_ATTENDANCE);
  
  // Deduplicate by ID to guarantee unique keys across rendering cycles
  const seenIds = new Set<string>();
  const uniqueList = list.filter((item) => {
    if (!item?.id || seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  // Sort descending by date & punchIn
  return uniqueList.sort((a, b) => new Date(b.punchIn).getTime() - new Date(a.punchIn).getTime());
}

export function dbGetAttendanceById(id: string): Attendance | undefined {
  const list = dbGetAttendance();
  return list.find(a => a.id === id);
}

export function dbPunchIn(params: {
  employeeId: string;
  selfie: string;
  location: Attendance["punchInLocation"];
  faceDetected?: boolean;
  faceConfidence?: number;
}): Attendance {
  const users = dbGetUsers();
  const employee = users.find(u => u.id === params.employeeId);
  if (!employee) throw new Error("Employee not found");

  const todayStr = getAttendanceDateString();
  const list = dbGetAttendance();

  // Find attendance record for this employee for the current business date (Asia/Kolkata)
  const todayRecord = list.find(
    a => a.employeeId === params.employeeId && a.date === todayStr
  );

  if (todayRecord) {
    // STATE 3: If already punched in AND punched out
    if (todayRecord.punchOut) {
      console.warn(
        `[AUDIT] ATTENDANCE_PUNCH_IN_REJECTED: Employee attempted duplicate punch-in after punch-out. employeeId=${params.employeeId} date=${todayStr} reason=ATTENDANCE_ALREADY_PUNCHED_OUT`
      );
      const err: any = new Error("You already punched out for today. Please contact admin/manager.");
      err.code = "ATTENDANCE_ALREADY_PUNCHED_OUT";
      err.status = 409;
      throw err;
    }

    // STATE 2: If already punched in but not punched out
    if (todayRecord.punchIn) {
      console.warn(
        `[AUDIT] ATTENDANCE_PUNCH_IN_REJECTED: Employee attempted duplicate punch-in while shift is active. employeeId=${params.employeeId} date=${todayStr} reason=ATTENDANCE_ALREADY_PUNCHED_IN`
      );
      const err: any = new Error("You have already punched in for today.");
      err.code = "ATTENDANCE_ALREADY_PUNCHED_IN";
      err.status = 409;
      throw err;
    }
  }

  const now = new Date().toISOString();
  const isFaceVerified = params.faceDetected ?? true;
  const isLocationValid = params.location.isWithinGeofence;

  let validationStatus: Attendance["validationStatus"] = "PENDING";
  let validationRemarks: string | undefined = undefined;

  if (isFaceVerified && isLocationValid) {
    validationStatus = "VALID";
    validationRemarks = `Face presence verified (${params.faceConfidence ?? 95}% confidence). Inside geofenced office perimeter.`;
  } else if (!isFaceVerified) {
    validationStatus = "SUSPICIOUS";
    validationRemarks = "Face presence verification failed or was bypassed during punch in.";
  } else if (!isLocationValid) {
    validationStatus = "SUSPICIOUS";
    validationRemarks = `Punched in ${params.location.distanceMeters || "several"}m outside designated office geofence.`;
  }

  const newAttendance: Attendance = {
    id: `att_${Date.now()}_${params.employeeId}`,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeEmail: employee.email,
    employeeDepartment: employee.department,
    employeeAvatar: employee.avatar,
    date: todayStr,
    punchIn: now,
    punchOut: null,
    punchInSelfie: params.selfie,
    punchOutSelfie: null,
    punchInLocation: params.location,
    punchOutLocation: null,
    totalWorkingMinutes: 0,
    status: "PRESENT",
    validationStatus,
    validationRemarks,
    faceDetected: isFaceVerified,
    faceConfidence: params.faceConfidence ?? (isFaceVerified ? 95 : 0),
    overtimeStatus: "NONE",
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(newAttendance);
  setItem(KEYS.ATTENDANCE, list);

  // Add notification
  dbAddNotification({
    userId: employee.id,
    title: "Punch In Recorded",
    message: `Attendance marked at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`,
    type: "ATTENDANCE",
    link: "/employee/attendance",
  });

  if (!params.location.isWithinGeofence && employee.managerId) {
    dbAddNotification({
      userId: employee.managerId,
      title: "Geofence Alert: Suspicious Punch-In",
      message: `${employee.name} punched in outside office bounds. Verification requested.`,
      type: "VALIDATION",
      link: "/manager/validation",
    });
  }

  return newAttendance;
}

export function dbPunchOut(params: {
  attendanceId: string;
  selfie: string;
  location: Attendance["punchInLocation"];
  employeeId?: string;
}): Attendance {
  const list = dbGetAttendance();
  const todayStr = getAttendanceDateString();
  const index = list.findIndex(
    a => a.id === params.attendanceId || (params.employeeId && a.employeeId === params.employeeId && a.date === todayStr)
  );
  if (index === -1) {
    const err: any = new Error("You must punch in before punching out.");
    err.code = "ATTENDANCE_NOT_PUNCHED_IN";
    err.status = 400;
    throw err;
  }

  const record = list[index];
  if (record.punchOut) {
    const err: any = new Error("You have already punched out for today.");
    err.code = "ATTENDANCE_ALREADY_PUNCHED_OUT";
    err.status = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const workingMinutes = calculateWorkingMinutes(record.punchIn, now);
  const settings = dbGetSettings();
  const isComplete = isCompletedShift(workingMinutes, settings.standardShiftHours);

  const updatedRecord: Attendance = {
    ...record,
    punchOut: now,
    punchOutSelfie: params.selfie,
    punchOutLocation: params.location,
    totalWorkingMinutes: workingMinutes,
    status: isComplete ? "COMPLETED" : "INCOMPLETE",
    updatedAt: now,
  };

  list[index] = updatedRecord;
  setItem(KEYS.ATTENDANCE, list);

  // Notify employee
  dbAddNotification({
    userId: record.employeeId,
    title: "Punch Out Recorded",
    message: `Punched out. Total working duration: ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m. Status: ${updatedRecord.status}.`,
    type: "ATTENDANCE",
    link: "/employee/attendance",
  });

  return updatedRecord;
}

export function dbValidateAttendance(params: {
  attendanceId: string;
  validationStatus: ValidationStatus;
  remarks?: string;
  validatedBy: string;
}): Attendance {
  const list = dbGetAttendance();
  const index = list.findIndex(a => a.id === params.attendanceId);
  if (index === -1) throw new Error("Attendance record not found");

  const record = list[index];
  const now = new Date().toISOString();

  const updatedRecord: Attendance = {
    ...record,
    validationStatus: params.validationStatus,
    validationRemarks: params.remarks || record.validationRemarks,
    validatedBy: params.validatedBy,
    validatedAt: now,
    updatedAt: now,
  };

  list[index] = updatedRecord;
  setItem(KEYS.ATTENDANCE, list);

  // Notify employee of validation outcome
  dbAddNotification({
    userId: record.employeeId,
    title: `Attendance Marked as ${params.validationStatus}`,
    message: `Your attendance for ${record.date} was marked as ${params.validationStatus} by ${params.validatedBy}.${params.remarks ? ` Note: "${params.remarks}"` : ""}`,
    type: "VALIDATION",
    link: "/employee/attendance",
  });

  return updatedRecord;
}

// ----------------- OVERTIME -----------------

export function dbGetOvertimeRequests(): OvertimeRequest[] {
  initMockDatabase();
  const list = getItem<OvertimeRequest[]>(KEYS.OVERTIME, MOCK_OVERTIME_REQUESTS);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function dbCreateOvertimeRequest(data: {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  requestedHours: number;
  reason: string;
  attendanceId?: string;
}): OvertimeRequest {
  const users = dbGetUsers();
  const employee = users.find(u => u.id === data.employeeId);
  if (!employee) throw new Error("Employee not found");

  const list = dbGetOvertimeRequests();
  const now = new Date().toISOString();

  const newRequest: OvertimeRequest = {
    id: `ot_${Date.now()}`,
    attendanceId: data.attendanceId,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeDepartment: employee.department,
    employeeAvatar: employee.avatar,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    requestedHours: data.requestedHours,
    reason: data.reason,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(newRequest);
  setItem(KEYS.OVERTIME, list);

  // Update linked attendance record if present
  if (data.attendanceId) {
    const attList = dbGetAttendance();
    const attIndex = attList.findIndex(a => a.id === data.attendanceId);
    if (attIndex !== -1) {
      attList[attIndex].overtimeStatus = "PENDING";
      attList[attIndex].overtimeHours = data.requestedHours;
      setItem(KEYS.ATTENDANCE, attList);
    }
  }

  // Notify manager
  if (employee.managerId) {
    dbAddNotification({
      userId: employee.managerId,
      title: "New Overtime Request",
      message: `${employee.name} submitted an overtime request for ${data.requestedHours} hrs on ${data.date}.`,
      type: "OVERTIME",
      link: "/manager/overtime",
    });
  }

  return newRequest;
}

export function dbReviewOvertime(params: {
  requestId: string;
  status: "APPROVED" | "REJECTED";
  remarks?: string;
  reviewerId: string;
  reviewerName: string;
}): OvertimeRequest {
  const list = dbGetOvertimeRequests();
  const index = list.findIndex(r => r.id === params.requestId);
  if (index === -1) throw new Error("Overtime request not found");

  const req = list[index];
  const now = new Date().toISOString();

  const updatedReq: OvertimeRequest = {
    ...req,
    status: params.status,
    reviewerId: params.reviewerId,
    reviewerName: params.reviewerName,
    reviewerRemarks: params.remarks,
    updatedAt: now,
  };

  list[index] = updatedReq;
  setItem(KEYS.OVERTIME, list);

  // Update linked attendance record
  if (req.attendanceId) {
    const attList = dbGetAttendance();
    const attIndex = attList.findIndex(a => a.id === req.attendanceId);
    if (attIndex !== -1) {
      attList[attIndex].overtimeStatus = params.status;
      setItem(KEYS.ATTENDANCE, attList);
    }
  }

  // Notify employee
  dbAddNotification({
    userId: req.employeeId,
    title: `Overtime Request ${params.status}`,
    message: `Your overtime request for ${req.date} (${req.requestedHours}h) was ${params.status.toLowerCase()} by ${params.reviewerName}.${params.remarks ? ` Remarks: "${params.remarks}"` : ""}`,
    type: "OVERTIME",
    link: "/employee/overtime",
  });

  return updatedReq;
}

// ----------------- NOTIFICATIONS -----------------

export function dbGetNotifications(userId?: string): NotificationItem[] {
  initMockDatabase();
  const list = getItem<NotificationItem[]>(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
  if (!userId) return list;
  return list.filter(n => n.userId === userId || n.userId === "ALL");
}

export function dbAddNotification(item: Omit<NotificationItem, "id" | "createdAt" | "isRead">): NotificationItem {
  const list = dbGetNotifications();
  const newNotif: NotificationItem = {
    ...item,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newNotif);
  setItem(KEYS.NOTIFICATIONS, list);
  return newNotif;
}

export function dbMarkNotificationRead(id: string): void {
  const list = dbGetNotifications();
  const notif = list.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
    setItem(KEYS.NOTIFICATIONS, list);
  }
}

export function dbMarkAllNotificationsRead(userId?: string): void {
  const list = dbGetNotifications();
  list.forEach(n => {
    if (!userId || n.userId === userId || n.userId === "ALL") {
      n.isRead = true;
    }
  });
  setItem(KEYS.NOTIFICATIONS, list);
}

// ----------------- SETTINGS -----------------

export function dbGetSettings(): SystemSettings {
  initMockDatabase();
  return getItem<SystemSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function dbUpdateSettings(updates: Partial<SystemSettings>): SystemSettings {
  const current = dbGetSettings();
  const updated = { ...current, ...updates };
  setItem(KEYS.SETTINGS, updated);
  return updated;
}
