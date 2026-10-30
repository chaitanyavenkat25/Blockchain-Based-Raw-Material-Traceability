import mongoose, { Schema, Document } from "mongoose";

export type BatchStatus =
  | "REGISTERED"
  | "IN_TRANSIT"
  | "PROCESSING"
  | "MANUFACTURED"
  | "SPLIT"
  | "MERGED"
  | "FLAGGED";

export interface IBatch extends Document {
  batchId: string;
  materialName: string;
  materialCategory: string;
  description: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  currentCustodianId: mongoose.Types.ObjectId;
  currentCustodianName: string;
  quantity: number;
  initialQuantity: number;
  unit: string;
  countryOfOrigin: string;
  regionOfOrigin: string;
  sourceLocation: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  extractionDate: Date;
  sourcingDeclarations: {
    environmentalCompliance: boolean;
    laborRightsCompliant: boolean;
    conflictFreeDeclared: boolean;
    recycledOrRenewable: boolean;
    details: string;
  };
  status: BatchStatus;
  isFlagged: boolean;
  flagReason?: string;
  initialEventHash: string;
  initialBlockchainTxHash?: string;
  blockchainStatus: "CONFIRMED" | "PENDING" | "OFFLINE";
  parentBatchIds: string[];
  childBatchIds: string[];
  isDemo: boolean;
  qrCodeDataUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    materialName: { type: String, required: true, trim: true },
    materialCategory: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    supplierName: { type: String, required: true },
    currentCustodianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currentCustodianName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    initialQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    countryOfOrigin: { type: String, required: true, trim: true },
    regionOfOrigin: { type: String, required: true, trim: true },
    sourceLocation: {
      name: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    extractionDate: { type: Date, required: true },
    sourcingDeclarations: {
      environmentalCompliance: { type: Boolean, default: false },
      laborRightsCompliant: { type: Boolean, default: false },
      conflictFreeDeclared: { type: Boolean, default: false },
      recycledOrRenewable: { type: Boolean, default: false },
      details: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["REGISTERED", "IN_TRANSIT", "PROCESSING", "MANUFACTURED", "SPLIT", "MERGED", "FLAGGED"],
      default: "REGISTERED",
    },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
    initialEventHash: { type: String, required: true },
    initialBlockchainTxHash: { type: String },
    blockchainStatus: {
      type: String,
      enum: ["CONFIRMED", "PENDING", "OFFLINE"],
      default: "PENDING",
    },
    parentBatchIds: [{ type: String }],
    childBatchIds: [{ type: String }],
    isDemo: { type: Boolean, default: false },
    qrCodeDataUrl: { type: String },
  },
  { timestamps: true }
);

export const Batch = mongoose.model<IBatch>("Batch", BatchSchema);
