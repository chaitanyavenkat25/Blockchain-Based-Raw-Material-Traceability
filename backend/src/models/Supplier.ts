import mongoose, { Schema, Document } from "mongoose";

export interface ISupplier extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  registrationNumber: string;
  country: string;
  region: string;
  facilityType: string;
  sourcingCategories: string[];
  complianceStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  licenseDocumentHash?: string;
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    facilityType: { type: String, required: true, trim: true },
    sourcingCategories: [{ type: String }],
    complianceStatus: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_APPROVAL",
    },
    licenseDocumentHash: { type: String },
    reviewNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>("Supplier", SupplierSchema);
