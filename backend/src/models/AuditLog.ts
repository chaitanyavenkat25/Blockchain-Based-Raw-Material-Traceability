import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  actorId?: mongoose.Types.ObjectId;
  actorEmail?: string;
  actorRole?: string;
  targetResource: string;
  targetId: string;
  details: Record<string, any>;
  severity: "INFO" | "WARNING" | "CRITICAL";
  isTamperAlert: boolean;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String },
    actorRole: { type: String },
    targetResource: { type: String, required: true },
    targetId: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL"],
      default: "INFO",
    },
    isTamperAlert: { type: Boolean, default: false },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
