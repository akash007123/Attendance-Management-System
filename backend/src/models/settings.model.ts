import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  id: string;
  officeLatitude: number;
  officeLongitude: number;
  allowedRadiusMeters: number;
  officeName: string;
  standardShiftHours: number;
  gracePeriodMinutes: number;
  geofenceEnabled: boolean;
  overtimeMinimumMinutes: number;
  requireSelfieValidation: boolean;
  missedPunchAlertThresholdHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema<ISystemSettings> = new Schema(
  {
    officeLatitude: { type: Number, default: 22.7196 },
    officeLongitude: { type: Number, default: 75.8577 },
    allowedRadiusMeters: { type: Number, default: 100 },
    officeName: { type: String, default: "Tech Park Corporate HQ" },
    standardShiftHours: { type: Number, default: 8 },
    gracePeriodMinutes: { type: Number, default: 15 },
    geofenceEnabled: { type: Boolean, default: true },
    overtimeMinimumMinutes: { type: Number, default: 30 },
    requireSelfieValidation: { type: Boolean, default: true },
    missedPunchAlertThresholdHours: { type: Number, default: 12 },
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

export const Settings = mongoose.model<ISystemSettings>(
  "Settings",
  SettingsSchema
);
