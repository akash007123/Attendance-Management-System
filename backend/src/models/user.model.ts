import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, UserRole } from "../constants/roles";
import { USER_STATUS } from "../constants/status";

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  department: string;
  designation: string;
  avatar?: string;
  managerId?: string;
  managerName?: string;
  status: "ACTIVE" | "INACTIVE";
  isActive: boolean;
  joinedDate: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
      index: true,
    },
    department: { type: String, required: true, trim: true, index: true },
    designation: { type: String, required: true, trim: true },
    avatar: { type: String },
    managerId: { type: String, index: true },
    managerName: { type: String },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    isActive: { type: Boolean, default: true },
    joinedDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
