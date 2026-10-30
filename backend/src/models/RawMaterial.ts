import mongoose, { Schema, Document } from "mongoose";

export interface IRawMaterial extends Document {
  name: string;
  category: "Mineral" | "Metal" | "Fiber" | "Agriculture" | "Recycled";
  description: string;
  standardUnit: string;
  applicableCertifications: string[];
  isDemo: boolean;
  createdAt: Date;
}

const RawMaterialSchema = new Schema<IRawMaterial>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Mineral", "Metal", "Fiber", "Agriculture", "Recycled"],
    },
    description: { type: String, required: true },
    standardUnit: { type: String, required: true },
    applicableCertifications: [{ type: String }],
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const RawMaterial = mongoose.model<IRawMaterial>("RawMaterial", RawMaterialSchema);
