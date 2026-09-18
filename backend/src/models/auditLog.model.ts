import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  createdAt: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetEntity: { type: String, required: true, index: true },
    targetId: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
