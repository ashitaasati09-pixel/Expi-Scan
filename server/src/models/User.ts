import mongoose, { Schema, type Document } from "mongoose";

export interface UserDocument extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  profileImage?: string;
  dob?: string;
  address?: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    profileImage: { type: String },
    dob: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

UserSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret._id = ret._id.toString();
    ret.createdAt = ret.createdAt.toISOString();
    ret.updatedAt = ret.updatedAt.toISOString();
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model<UserDocument>("User", UserSchema);