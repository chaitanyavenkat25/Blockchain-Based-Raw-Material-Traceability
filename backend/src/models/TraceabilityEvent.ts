import mongoose, { Schema, Document } from "mongoose";

export type TraceabilityEventType =
  | "EXTRACTION_REGISTRATION"
  | "INITIAL_INSPECTION"
  | "PROCESSING"
  | "CERTIFICATION_REVIEW"
  | "TRANSPORTATION"
  | "WAREHOUSE_RECEIPT"
  | "MANUFACTURING"
  | "SPLIT"
  | "MERGE"
  | "CUSTODY_TRANSFER"
  | "AUDIT_FLAG"
  | "CORRECTION";

export interface ITraceabilityEvent extends Document {
  eventId: string;
  batchId: string;
  eventType: TraceabilityEventType;
  eventIndex: number;
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  organization: string;
  location: {
    name: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  quantity?: number;
  unit?: string;
  previousEventHash: string;
  eventHash: string;
  canonicalData: Record<string, any>;
  blockchainTxHash?: string;
  blockchainBlockNumber?: number;
  blockchainStatus: "CONFIRMED" | "PENDING" | "OFFLINE";
  evidenceDocumentHashes: string[];
  verificationStatus: "VERIFIED" | "TAMPERED" | "UNVERIFIED";
  notes?: string;
  timestamp: Date;
  isDemo: boolean;
  createdAt: Date;
}

const TraceabilityEventSchema = new Schema<ITraceabilityEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    batchId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        "EXTRACTION_REGISTRATION",
        "INITIAL_INSPECTION",
        "PROCESSING",
        "CERTIFICATION_REVIEW",
        "TRANSPORTATION",
        "WAREHOUSE_RECEIPT",
        "MANUFACTURING",
        "SPLIT",
        "MERGE",
        "CUSTODY_TRANSFER",
        "AUDIT_FLAG",
        "CORRECTION",
      ],
    },
    eventIndex: { type: Number, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    organization: { type: String, required: true },
    location: {
      name: { type: String, required: true },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    quantity: { type: Number },
    unit: { type: String },
    previousEventHash: { type: String, required: true },
    eventHash: { type: String, required: true, index: true },
    canonicalData: { type: Schema.Types.Mixed, required: true },
    blockchainTxHash: { type: String },
    blockchainBlockNumber: { type: Number },
    blockchainStatus: {
      type: String,
      enum: ["CONFIRMED", "PENDING", "OFFLINE"],
      default: "PENDING",
    },
    evidenceDocumentHashes: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ["VERIFIED", "TAMPERED", "UNVERIFIED"],
      default: "UNVERIFIED",
    },
    notes: { type: String },
    timestamp: { type: Date, required: true, default: Date.now },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TraceabilityEvent = mongoose.model<ITraceabilityEvent>(
  "TraceabilityEvent",
  TraceabilityEventSchema
);
