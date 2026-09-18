import { Router } from "express";
import authRoutes from "./auth.routes";
import attendanceRoutes from "./attendance.routes";
import overtimeRoutes from "./overtime.routes";
import userRoutes from "./user.routes";
import notificationRoutes from "./notification.routes";
import settingsRoutes from "./settings.routes";
import dashboardRoutes from "./dashboard.routes";
import { BUSINESS_TIMEZONE, getAttendanceDateString } from "../utils/date";
import { seedDatabaseIfEmpty } from "../services/seed.service";
import { User } from "../models/user.model";
import { Attendance } from "../models/attendance.model";
import { OvertimeRequest } from "../models/overtime.model";
import { Settings } from "../models/settings.model";
import { Notification } from "../models/notification.model";

const router = Router();

// Health Check
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ams-backend",
    timezone: BUSINESS_TIMEZONE,
    currentBusinessDate: getAttendanceDateString(),
    timestamp: new Date().toISOString(),
  });
});

// Reset database back to fresh seeded state (Test/demo helper)
router.post("/system/reset-seed", async (_req, res, next) => {
  try {
    await Attendance.deleteMany({});
    await OvertimeRequest.deleteMany({});
    await Notification.deleteMany({});
    await Settings.deleteMany({});
    await User.deleteMany({});
    await seedDatabaseIfEmpty();
    res.json({
      success: true,
      message: "Database successfully reset to initial enterprise seed state.",
    });
  } catch (err) {
    next(err);
  }
});

router.use("/auth", authRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/overtime", overtimeRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/settings", settingsRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
