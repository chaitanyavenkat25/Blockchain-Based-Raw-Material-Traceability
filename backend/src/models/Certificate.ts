import mongoose, { Schema, Document } from "mongoose";

export type CertificateStatus =
  | "SUBMITTED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "DISPUTED";

export interface ICertificate extends Document {
  batchId: string;
  materialName?: string;
  certificateType:
    | "ISO_14001"
    | "IRMA"
    | "FAIRTRADE"
    | "FSC"
    | "ASI"
    | "RJC"
    | "ORGANIC"
    | "CONFLICT_FREE"
    | "CUSTOM";
  certificateName: string;
  certificateNumber: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date;
  scope: string;
  sourcingClaims: {
    environmental: boolean;
    laborHumanRights: boolean;
    conflictFree: boolean;
    recycledRenewable: boolean;
  };
  originalFileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  documentHash: string; // SHA-256
  blockchainTxHash?: string;
  status: CertificateStatus;
  submittedById: mongoose.Types.ObjectId;
  submittedByName: string;
  reviewerId?: mongoose.Types.ObjectId;
  reviewerName?: string;
  reviewerNotes?: string;
  reviewedAt?: Date;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    batchId: { type: String, required: true, index: true },
    materialName: { type: String },
    certificateType: {
      type: String,
      required: true,
      enum: [
        "ISO_14001",
        "IRMA",
        "FAIRTRADE",
        "FSC",
        "ASI",
        "RJC",
        "ORGANIC",
        "CONFLICT_FREE",
        "CUSTOM",
      ],
    },
    certificateName: { type: String, required: true },
    certificateNumber: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    scope: { type: String, required: true },
    sourcingClaims: {
      environmental: { type: Boolean, default: false },
      laborHumanRights: { type: Boolean, default: false },
      conflictFree: { type: Boolean, default: false },
      recycledRenewable: { type: Boolean, default: false },
    },
    originalFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    mimeType: { type: String, required: true },
    documentHash: { type: String, required: true, index: true },
    blockchainTxHash: { type: String },
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "PENDING_VERIFICATION",
        "VERIFIED",
        "REJECTED",
        "EXPIRED",
        "DISPUTED",
      ],
      default: "SUBMITTED",
    },
    submittedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedByName: { type: String, required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    reviewerName: { type: String },
    reviewerNotes: { type: String },
    reviewedAt: { type: Date },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);
