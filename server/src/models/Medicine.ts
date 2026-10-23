import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface MedicineDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  genericName: string;
  type: string;
  strength: string;
  dosage: string;
  quantity: number;
  unit: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  refillThreshold: number;
  notes: string;
  prescriptionRequired: boolean;
  source: "manual" | "scan";
}

const MedicineSchema = new Schema<MedicineDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, default: "" },
    type: { type: String, default: "" },
    strength: { type: String, default: "" },
    dosage: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    batchNumber: { type: String, default: "" },
    manufacturingDate: { type: String, default: "" },
    expiryDate: { type: String, required: true },
    refillThreshold: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    prescriptionRequired: { type: Boolean, default: false },
    source: { type: String, enum: ["manual", "scan"], default: "manual" },
  },
  { timestamps: true }
);

MedicineSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret._id = ret._id.toString();
    ret.userId = ret.userId.toString();
    ret.createdAt = ret.createdAt.toISOString();
    ret.updatedAt = ret.updatedAt.toISOString();
    delete ret.__v;
    return ret;
  },
});

export const Medicine = mongoose.model<MedicineDocument>("Medicine", MedicineSchema);