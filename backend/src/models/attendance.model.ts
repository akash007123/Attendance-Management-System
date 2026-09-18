import mongoose, { Schema, Document } from "mongoose";
import { ATTENDANCE_STATUS, VALIDATION_STATUS, OVERTIME_STATUS } from "../constants/status";

export interface ILocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  isWithinGeofence: boolean;
  distanceMeters?: number;
  address?: string;
}

export interface IAttendance extends Document {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeDepartment: string;
  employeeAvatar?: string;
  date: string; // YYYY-MM-DD
  attendanceDate?: string; // YYYY-MM-DD
  punchIn: string; // ISO string
  punchOut?: string | null; // ISO string
  punchInSelfie: string;
  punchOutSelfie?: string | null;
  punchInLocation: ILocationData;
  punchOutLocation?: ILocationData | null;
  totalWorkingMinutes: number;
  status: (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
  validationStatus: (typeof VALIDATION_STATUS)[keyof typeof VALIDATION_STATUS];
  validationRemarks?: string;
  validatedBy?: string;
  validatedAt?: string;
  faceDetected: boolean;
  faceConfidence: number;
  overtimeStatus: (typeof OVERTIME_STATUS)[keyof typeof OVERTIME_STATUS];
  overtimeHours?: number;
  overtimeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    isWithinGeofence: { type: Boolean, required: true, default: true },
    distanceMeters: { type: Number, default: 0 },
    address: { type: String, default: "" },
  },
  { _id: false }
);

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true, trim: true },
    employeeEmail: { type: String, required: true, trim: true },
    employeeDepartment: { type: String, required: true, trim: true, index: true },
    employeeAvatar: { type: String },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    attendanceDate: { type: String, index: true }, // Format: YYYY-MM-DD
    punchIn: { type: String, required: true },
    punchOut: { type: String, default: null },
    punchInSelfie: { type: String, required: true },
    punchOutSelfie: { type: String, default: null },
    punchInLocation: { type: LocationSchema, required: true },
    punchOutLocation: { type: LocationSchema, default: null },
    totalWorkingMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
      index: true,
    },
    validationStatus: {
      type: String,
      enum: Object.values(VALIDATION_STATUS),
      default: VALIDATION_STATUS.VALID,
      index: true,
    },
    validationRemarks: { type: String, default: "" },
    validatedBy: { type: String },
    validatedAt: { type: String },
    faceDetected: { type: Boolean, default: true },
    faceConfidence: { type: Number, default: 95 },
    overtimeStatus: {
      type: String,
      enum: Object.values(OVERTIME_STATUS),
      default: OVERTIME_STATUS.NONE,
    },
    overtimeHours: { type: Number, default: 0 },
    overtimeReason: { type: String, default: "" },
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

// Pre-validation to synchronize date and attendanceDate
AttendanceSchema.pre("validate", async function () {
  if (this.date && !this.attendanceDate) {
    this.attendanceDate = this.date;
  } else if (this.attendanceDate && !this.date) {
    this.date = this.attendanceDate;
  }
});

// Compound Unique Indexes: An employee can have strictly ONE attendance record per date
AttendanceSchema.index({ employeeId: 1, attendanceDate: 1 }, { unique: true });
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
