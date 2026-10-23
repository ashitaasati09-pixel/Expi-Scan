import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ExtractedMedicineSub {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  confidence: number;
}

export interface PrescriptionDocument extends Document {
  userId: Types.ObjectId;
  fileName: string;
  fileType: "image" | "pdf";
  mimeType: string;
  fileData: string;
  doctorName: string;
  clinicName: string;
  prescriptionDate: string;
  extractedMedicines: ExtractedMedicineSub[];
  processingStatus: "processing" | "processed" | "failed";
}

const ExtractedMedicineSchema = new Schema<ExtractedMedicineSub>(
  { name: String, dosage: String, frequency: String, duration: String, quantity: Number, confidence: Number },
  { _id: false }
);

const PrescriptionSchema = new Schema<PrescriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf"], required: true },
    fileData: { type: String, required: true, select: false },
    mimeType: { type: String, default: "image/jpeg" },
    doctorName: { type: String, default: "" },
    clinicName: { type: String, default: "" },
    prescriptionDate: { type: String, default: "" },
    extractedMedicines: { type: [ExtractedMedicineSchema], default: [] },
    processingStatus: { type: String, enum: ["processing", "processed", "failed"], default: "processing" },
  },
  { timestamps: true }
);

PrescriptionSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret._id = ret._id.toString();
    ret.userId = ret.userId.toString();
    ret.fileUrl = `/api/prescriptions/${ret._id}/file`;
    delete ret.fileData;
    ret.createdAt = ret.createdAt.toISOString();
    ret.updatedAt = ret.updatedAt.toISOString();
    delete ret.__v;
    return ret;
  },
});

export const Prescription = mongoose.model<PrescriptionDocument>("Prescription", PrescriptionSchema);