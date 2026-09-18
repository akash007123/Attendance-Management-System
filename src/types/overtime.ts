export type OvertimeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OvertimeRequest {
  id: string;
  attendanceId?: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  employeeAvatar?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  requestedHours: number;
  reason: string;
  status: OvertimeRequestStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewedBy?: string;
  reviewerRemarks?: string;
  approvedHours?: number;
  createdAt: string;
  updatedAt: string;
}
