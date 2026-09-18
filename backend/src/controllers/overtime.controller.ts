import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { OvertimeRequest } from "../models/overtime.model";
import { User } from "../models/user.model";
import { Notification } from "../models/notification.model";
import { AuditLog } from "../models/auditLog.model";

export async function createOvertimeRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.id;
    const { date, startTime, endTime, requestedHours, reason, attendanceId } = req.body;

    if (!date || !startTime || !endTime || !requestedHours || !reason) {
      return res.status(400).json({
        success: false,
        message: "Date, start time, end time, requested hours, and reason are required.",
      });
    }

    const user = await User.findOne({
      $or: [{ id: employeeId }, { email: req.user!.email }],
    });

    const newRequest = await OvertimeRequest.create({
      employeeId,
      employeeName: user?.name || req.user!.name,
      employeeDepartment: user?.department || req.user!.department || "Engineering",
      employeeAvatar: user?.avatar,
      attendanceId,
      date,
      startTime,
      endTime,
      requestedHours: Number(requestedHours),
      reason,
      status: "PENDING",
    });

    await AuditLog.create({
      userId: employeeId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: "OVERTIME_REQUEST_CREATED",
      targetEntity: "OvertimeRequest",
      targetId: newRequest.id,
      details: { requestedHours, date, reason },
    });

    return res.status(201).json({
      success: true,
      message: "Overtime request submitted successfully.",
      data: newRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOvertimeRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query: any = {};
    const { employeeId, status, department } = req.query;

    if (req.user?.role === "EMPLOYEE") {
      query.employeeId = req.user.id;
    } else if (req.user?.role === "MANAGER") {
      if (employeeId) {
        query.employeeId = String(employeeId);
      }
      query.employeeDepartment = req.user.department;
    } else {
      if (employeeId) query.employeeId = String(employeeId);
      if (department && department !== "ALL") query.employeeDepartment = String(department);
    }

    if (status && status !== "ALL") query.status = String(status);

    const requests = await OvertimeRequest.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveOvertime(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { remarks, approvedHours, reviewerName } = req.body;

    const request = await OvertimeRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Overtime request not found." });
    }

    request.status = "APPROVED";
    request.approvedHours = approvedHours !== undefined ? Number(approvedHours) : request.requestedHours;
    request.reviewerId = req.user?.id;
    request.reviewerName = reviewerName || req.user?.name || "Manager";
    request.reviewerRemarks = remarks || "";

    await request.save();

    await Notification.create({
      userId: request.employeeId,
      title: "Overtime Request Approved",
      message: `Your overtime request for ${request.requestedHours} hours on ${request.date} has been approved.`,
      type: "OVERTIME_DECISION",
    });

    return res.json({
      success: true,
      message: "Overtime request approved successfully.",
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectOvertime(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { remarks, reviewerName } = req.body;

    const request = await OvertimeRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Overtime request not found." });
    }

    request.status = "REJECTED";
    request.reviewerId = req.user?.id;
    request.reviewerName = reviewerName || req.user?.name || "Manager";
    request.reviewerRemarks = remarks || "Declined by management.";

    await request.save();

    await Notification.create({
      userId: request.employeeId,
      title: "Overtime Request Declined",
      message: `Your overtime request for ${request.requestedHours} hours on ${request.date} was rejected. Reason: ${request.reviewerRemarks}`,
      type: "OVERTIME_DECISION",
    });

    return res.json({
      success: true,
      message: "Overtime request rejected.",
      data: request,
    });
  } catch (error) {
    next(error);
  }
}
