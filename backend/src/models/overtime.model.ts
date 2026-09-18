import mongoose, { Schema, Document } from "mongoose";
import { OVERTIME_STATUS } from "../constants/status";

export interface IOvertimeRequest extends Document {
  id: string;
  attendanceId?: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  employeeAvatar?: string;
  date: string;
  startTime: string;
  endTime: string;
  requestedHours: number;
  approvedHours?: number;
  reason: string;
  status: (typeof OVERTIME_STATUS)[keyof typeof OVERTIME_STATUS];
  reviewerId?: string;
  reviewerName?: string;
  reviewerRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OvertimeRequestSchema: Schema<IOvertimeRequest> = new Schema(
  {
    attendanceId: { type: String, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeDepartment: { type: String, required: true, index: true },
    employeeAvatar: { type: String },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    requestedHours: { type: Number, required: true, min: 0.1 },
    approvedHours: { type: Number },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(OVERTIME_STATUS),
      default: OVERTIME_STATUS.PENDING,
      index: true,
    },
    reviewerId: { type: String },
    reviewerName: { type: String },
    reviewerRemarks: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const OvertimeRequest = mongoose.model<IOvertimeRequest>(
  "OvertimeRequest",
  OvertimeRequestSchema
);
