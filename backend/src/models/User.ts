import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "ADMIN" | "SUPPLIER" | "MANUFACTURER" | "AUDITOR" | "CONSUMER";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organization: string;
  status: UserStatus;
  ethereumAddress?: string;
  phone?: string;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "SUPPLIER", "MANUFACTURER", "AUDITOR", "CONSUMER"],
      default: "CONSUMER",
    },
    organization: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_APPROVAL", "REJECTED"],
      default: function (this: any) {
        return this.role === "SUPPLIER" ? "PENDING_APPROVAL" : "ACTIVE";
      },
    },
    ethereumAddress: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
