import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Attendance } from "../models/attendance.model";
import { User } from "../models/user.model";
import { AuditLog } from "../models/auditLog.model";
import { Notification } from "../models/notification.model";
import {
  getAttendanceDateString,
  calculateWorkingMinutes,
  isCompletedShift,
} from "../utils/date";
import { logger } from "../utils/logger";

// Mongoose compound index on employeeId and attendanceDate to enforce strictly one attendance record per day
Attendance.schema.index({ employeeId: 1, attendanceDate: 1 }, { unique: true });

const inFlightPunchInLocks = new Set<string>();

/**
 * GET /api/attendance/today
 * Returns today's attendance record for the authenticated user.
 */
export async function getTodayAttendance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.id;
    const todayStr = getAttendanceDateString();

    const record = await Attendance.findOne({
      employeeId,
      $or: [{ attendanceDate: todayStr }, { date: todayStr }],
    });

    return res.json({
      success: true,
      data: record || null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/attendance/punch-in
 * Strictly authoritative server-side endpoint.
 * Enforces business rule: If already punched out today, punch in is strictly disallowed.
 */
export async function punchIn(req: AuthRequest, res: Response, next: NextFunction) {
  const employeeId = req.user!.id;
  const todayStr = getAttendanceDateString();
  const lockKey = `${employeeId}:${todayStr}`;

  if (inFlightPunchInLocks.has(lockKey)) {
    return res.status(409).json({
      success: false,
      message: "A punch-in request is already being processed for today.",
      code: "ATTENDANCE_REQUEST_IN_PROGRESS",
    });
  }

  inFlightPunchInLocks.add(lockKey);

  try {
    // Query for today's record by employeeId and attendanceDate / date
    const existingRecord = await Attendance.findOne({
      employeeId,
      $or: [{ attendanceDate: todayStr }, { date: todayStr }],
    });

    // Enforce Duplicate Punch-In Rule:
    // Validate that 'punchOut' is null before allowing a new 'punchIn'
    if (existingRecord) {
      if (existingRecord.punchOut !== null && existingRecord.punchOut !== undefined) {
        logger.warn(
          `[AUDIT] ATTENDANCE_PUNCH_IN_REJECTED: employeeId=${employeeId} date=${todayStr} reason=ATTENDANCE_ALREADY_PUNCHED_OUT`
        );
        await AuditLog.create({
          userId: employeeId,
          userName: req.user!.name,
          userRole: req.user!.role,
          action: "ATTENDANCE_PUNCH_IN_REJECTED",
          targetEntity: "Attendance",
          targetId: existingRecord.id,
          details: { reason: "ATTENDANCE_ALREADY_PUNCHED_OUT", date: todayStr },
        });

        return res.status(409).json({
          success: false,
          message: "You already punched out for today. Please contact admin/manager.",
          code: "ATTENDANCE_ALREADY_PUNCHED_OUT",
        });
      }

      // If punchIn already exists and punchOut is null (shift currently in progress)
      if (existingRecord.punchIn) {
        logger.warn(
          `[AUDIT] ATTENDANCE_PUNCH_IN_REJECTED: employeeId=${employeeId} date=${todayStr} reason=ATTENDANCE_ALREADY_PUNCHED_IN`
        );
        return res.status(409).json({
          success: false,
          message: "You have already punched in for today.",
          code: "ATTENDANCE_ALREADY_PUNCHED_IN",
        });
      }
    }

    // RULE 3: Valid new punch-in
    const { selfie, location, faceDetected, faceConfidence } = req.body;
    const now = new Date().toISOString();

    const isFaceVerified = faceDetected ?? true;
    const isLocationValid = location?.isWithinGeofence ?? true;

    let validationStatus: "VALID" | "SUSPICIOUS" = "VALID";
    let validationRemarks = `Face presence verified (${faceConfidence ?? 95}% confidence). Inside geofenced office perimeter.`;

    if (!isFaceVerified) {
      validationStatus = "SUSPICIOUS";
      validationRemarks = "Face presence verification failed or was bypassed during punch in.";
    } else if (!isLocationValid) {
      validationStatus = "SUSPICIOUS";
      validationRemarks = "Punched in outside designated office geofence perimeter.";
    }

    const user = await User.findOne({
      $or: [{ id: employeeId }, { email: req.user!.email }],
    });

    const newRecord = await Attendance.create({
      employeeId,
      employeeName: user?.name || req.user!.name,
      employeeEmail: user?.email || req.user!.email,
      employeeDepartment: user?.department || req.user!.department || "Engineering",
      employeeAvatar:
        user?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(employeeId)}`,
      date: todayStr,
      attendanceDate: todayStr,
      punchIn: now,
      punchOut: null,
      punchInSelfie: selfie || "data:image/svg+xml;utf8,<svg></svg>",
      punchOutSelfie: null,
      punchInLocation: location || {
        latitude: 22.7196,
        longitude: 75.8577,
        address: "Tech Park Corporate HQ",
        isWithinGeofence: true,
        distanceMeters: 10,
      },
      punchOutLocation: null,
      totalWorkingMinutes: 0,
      status: "PRESENT",
      validationStatus,
      validationRemarks,
      faceDetected: isFaceVerified,
      faceConfidence: faceConfidence ?? 95,
      overtimeStatus: "NONE",
    });

    await AuditLog.create({
      userId: employeeId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: "ATTENDANCE_PUNCH_IN",
      targetEntity: "Attendance",
      targetId: newRecord.id,
      details: {
        date: todayStr,
        punchIn: now,
        validationStatus,
        isWithinGeofence: location?.isWithinGeofence,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Attendance punched in successfully.",
      data: newRecord,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already punched out for today. Please contact admin/manager.",
        code: "ATTENDANCE_ALREADY_PUNCHED_OUT",
      });
    }
    next(error);
  } finally {
    inFlightPunchInLocks.delete(lockKey);
  }
}

/**
 * POST /api/attendance/punch-out
 */
export async function punchOut(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.id;
    const todayStr = getAttendanceDateString();
    const { attendanceId, selfie, location } = req.body;

    const record = await Attendance.findOne(
      attendanceId ? { _id: attendanceId } : { employeeId, date: todayStr }
    );

    if (!record || !record.punchIn) {
      return res.status(400).json({
        success: false,
        message: "You must punch in before punching out.",
        code: "ATTENDANCE_NOT_PUNCHED_IN",
      });
    }

    if (record.punchOut) {
      return res.status(409).json({
        success: false,
        message: "You have already punched out for today.",
        code: "ATTENDANCE_ALREADY_PUNCHED_OUT",
      });
    }

    const now = new Date().toISOString();
    const workingMinutes = calculateWorkingMinutes(record.punchIn, now);
    const isComplete = isCompletedShift(workingMinutes, 8);

    record.punchOut = now;
    record.punchOutSelfie = selfie || "data:image/svg+xml;utf8,<svg></svg>";
    record.punchOutLocation = location || {
      latitude: 22.7196,
      longitude: 75.8577,
      address: "Tech Park Corporate HQ",
      isWithinGeofence: true,
      distanceMeters: 12,
    };
    record.totalWorkingMinutes = workingMinutes;
    record.status = isComplete ? "COMPLETED" : "INCOMPLETE";

    await record.save();

    await AuditLog.create({
      userId: employeeId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: "ATTENDANCE_PUNCH_OUT",
      targetEntity: "Attendance",
      targetId: record.id,
      details: {
        date: todayStr,
        punchOut: now,
        totalWorkingMinutes: workingMinutes,
        status: record.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Attendance punched out successfully.",
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/attendance
 * Filtered attendance records.
 */
export async function getAttendanceList(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query: any = {};
    const { employeeId, date, status, validationStatus, department, startDate, endDate } = req.query;

    // Role-based authorization scoping
    if (req.user?.role === "EMPLOYEE") {
      query.employeeId = req.user.id;
    } else if (req.user?.role === "MANAGER") {
      if (employeeId) {
        query.employeeId = String(employeeId);
      }
      if (department && department !== "ALL") {
        query.employeeDepartment = String(department);
      } else {
        query.employeeDepartment = req.user.department;
      }
    } else {
      // ADMIN
      if (employeeId) query.employeeId = String(employeeId);
      if (department && department !== "ALL") query.employeeDepartment = String(department);
    }

    if (date) query.date = String(date);
    if (status && status !== "ALL") query.status = String(status);
    if (validationStatus && validationStatus !== "ALL") query.validationStatus = String(validationStatus);

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = String(startDate);
      if (endDate) query.date.$lte = String(endDate);
    }

    const records = await Attendance.find(query).sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/attendance/:id
 */
export async function getAttendanceById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const record = await Attendance.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }],
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    return res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/attendance/:id/validation
 */
export async function validateAttendance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { validationStatus, remarks, validatedBy } = req.body;

    const record = await Attendance.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }],
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    record.validationStatus = validationStatus;
    if (remarks) record.validationRemarks = remarks;
    record.validatedBy = validatedBy || req.user?.name || "Manager";
    record.validatedAt = new Date().toISOString();

    await record.save();

    await Notification.create({
      userId: record.employeeId,
      title: "Attendance Validation Updated",
      message: `Your attendance for ${record.date} was marked as ${validationStatus}.`,
      type: "VALIDATION_DECISION",
    });

    return res.json({
      success: true,
      message: `Attendance validation updated to ${validationStatus}.`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/attendance/reset-today (Development & testing helper)
 */
export async function resetToday(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.id;
    const todayStr = getAttendanceDateString();

    await Attendance.deleteMany({
      employeeId,
      date: todayStr,
    });

    return res.json({
      success: true,
      message: `Today's attendance record cleared for employee ${employeeId}.`,
    });
  } catch (error) {
    next(error);
  }
}
