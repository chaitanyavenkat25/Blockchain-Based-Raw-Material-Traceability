import mongoose, { Schema, Document } from "mongoose";

export interface IGenealogy extends Document {
  operationType: "SPLIT" | "MERGE";
  parentBatchIds: string[];
  childBatchIds: string[];
  records: {
    batchId: string;
    role: "PARENT" | "CHILD";
    quantity: number;
    unit: string;
  }[];
  operatorId: mongoose.Types.ObjectId;
  operatorName: string;
  reason: string;
  blockchainTxHash?: string;
  timestamp: Date;
}

const GenealogySchema = new Schema<IGenealogy>(
  {
    operationType: { type: String, enum: ["SPLIT", "MERGE"], required: true },
    parentBatchIds: [{ type: String, required: true }],
    childBatchIds: [{ type: String, required: true }],
    records: [
      {
        batchId: { type: String, required: true },
        role: { type: String, enum: ["PARENT", "CHILD"], required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    operatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    operatorName: { type: String, required: true },
    reason: { type: String, required: true },
    blockchainTxHash: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Genealogy = mongoose.model<IGenealogy>("Genealogy", GenealogySchema);
