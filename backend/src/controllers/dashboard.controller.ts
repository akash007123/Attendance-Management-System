import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Attendance } from "../models/attendance.model";
import { User } from "../models/user.model";
import { OvertimeRequest } from "../models/overtime.model";
import { getAttendanceDateString } from "../utils/date";

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const todayStr = getAttendanceDateString();
    const userRole = req.user?.role;
    const userDept = req.user?.department;

    const deptFilter: any = {};
    if (userRole === "MANAGER" && userDept) {
      deptFilter.department = userDept;
    }

    const totalEmployees = await User.countDocuments({
      role: "EMPLOYEE",
      status: "ACTIVE",
      ...deptFilter,
    });

    const attendanceFilter: any = { date: todayStr };
    if (userRole === "MANAGER" && userDept) {
      attendanceFilter.employeeDepartment = userDept;
    }

    const todayRecords = await Attendance.find(attendanceFilter);

    const presentToday = todayRecords.length;
    const completedToday = todayRecords.filter((r) => r.status === "COMPLETED").length;
    const incompleteToday = todayRecords.filter((r) => r.status === "INCOMPLETE").length;
    const pendingValidations = todayRecords.filter((r) => r.validationStatus === "PENDING").length;
    const suspiciousCount = todayRecords.filter((r) => r.validationStatus === "SUSPICIOUS").length;

    const overtimeFilter: any = { status: "PENDING" };
    if (userRole === "MANAGER" && userDept) {
      overtimeFilter.employeeDepartment = userDept;
    }
    const pendingOvertime = await OvertimeRequest.countDocuments(overtimeFilter);

    return res.json({
      success: true,
      data: {
        date: todayStr,
        totalEmployees,
        presentToday,
        completedToday,
        incompleteToday,
        pendingValidations,
        suspiciousCount,
        pendingOvertime,
      },
    });
  } catch (error) {
    next(error);
  }
}
