import { User } from "../models/user.model";
import { Attendance } from "../models/attendance.model";
import { OvertimeRequest } from "../models/overtime.model";
import { Settings } from "../models/settings.model";
import { Notification } from "../models/notification.model";
import { logger } from "../utils/logger";
import { SEED_USERS } from "../data/seedData";
import { getAttendanceDateString } from "../utils/date";

export async function seedDatabaseIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info("Seeding initial users into MongoDB...");
      for (const u of SEED_USERS) {
        await User.create({
          name: u.name,
          email: u.email,
          password: "password123",
          phone: u.phone,
          role: u.role as "ADMIN" | "MANAGER" | "EMPLOYEE",
          department: u.department,
          designation: u.designation,
          avatar: u.avatar,
          managerId: u.managerId,
          managerName: u.managerName,
          status: u.status as "ACTIVE" | "INACTIVE",
          isActive: u.status === "ACTIVE",
          joinedDate: u.joinedDate,
        });
      }
      logger.info(`Seeded ${SEED_USERS.length} users successfully.`);
    }

    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      logger.info("Initializing system settings...");
      await Settings.create({
        officeLatitude: 22.7196,
        officeLongitude: 75.8577,
        allowedRadiusMeters: 100,
        officeName: "Tech Park Corporate HQ",
        standardShiftHours: 8,
        gracePeriodMinutes: 15,
        geofenceEnabled: true,
        overtimeMinimumMinutes: 30,
        requireSelfieValidation: true,
        missedPunchAlertThresholdHours: 12,
      });
      logger.info("System settings initialized.");
    }

    const attendanceCount = await Attendance.countDocuments();
    if (attendanceCount === 0) {
      logger.info("Seeding realistic attendance history...");
      const users = await User.find({ role: "EMPLOYEE" });
      const today = new Date();

      // Seed past 7 days of attendance for employees
      for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
        const d = new Date(today);
        d.setDate(today.getDate() - dayOffset);
        const dateStr = getAttendanceDateString(d);

        for (const emp of users) {
          const punchInTime = new Date(`${dateStr}T09:00:00.000Z`).toISOString();
          const punchOutTime = new Date(`${dateStr}T17:30:00.000Z`).toISOString();
          const workingMinutes = 510; // 8.5 hours

          try {
            await Attendance.create({
              employeeId: emp.id,
              employeeName: emp.name,
              employeeEmail: emp.email,
              employeeDepartment: emp.department,
              employeeAvatar: emp.avatar,
              date: dateStr,
              punchIn: punchInTime,
              punchOut: punchOutTime,
              punchInSelfie: emp.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
              punchOutSelfie: emp.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
              punchInLocation: {
                latitude: 22.7196,
                longitude: 75.8577,
                address: "Tech Park Corporate HQ",
                isWithinGeofence: true,
                distanceMeters: 10,
              },
              punchOutLocation: {
                latitude: 22.7196,
                longitude: 75.8577,
                address: "Tech Park Corporate HQ",
                isWithinGeofence: true,
                distanceMeters: 14,
              },
              totalWorkingMinutes: workingMinutes,
              status: "COMPLETED",
              validationStatus: "VALID",
              validationRemarks: "Face detected & within geofence perimeter.",
              faceDetected: true,
              faceConfidence: 96,
              overtimeStatus: "NONE",
            });
          } catch (e) {
            // ignore duplicate keys if any
          }
        }
      }
      logger.info("Historical attendance records seeded.");
    }

    const overtimeCount = await OvertimeRequest.countDocuments();
    if (overtimeCount === 0) {
      logger.info("Seeding sample overtime requests...");
      const emp = await User.findOne({ role: "EMPLOYEE" });
      if (emp) {
        await OvertimeRequest.create([
          {
            employeeId: emp.id,
            employeeName: emp.name,
            employeeDepartment: emp.department,
            employeeAvatar: emp.avatar,
            date: getAttendanceDateString(),
            startTime: "18:00",
            endTime: "20:30",
            requestedHours: 2.5,
            reason: "Critical database indexing & migration deployment for quarterly release.",
            status: "PENDING",
          },
        ]);
      }
      logger.info("Sample overtime requests seeded.");
    }

    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      const emp = await User.findOne({ role: "EMPLOYEE" });
      if (emp) {
        await Notification.create([
          {
            userId: emp.id,
            title: "Welcome to Enterprise AMS",
            message: "Your attendance and overtime can now be managed with biometric facial and geofence verification.",
            type: "SYSTEM",
            isRead: false,
          },
        ]);
      }
    }
  } catch (error) {
    logger.error("Error during database seed:", { error });
  }
}
