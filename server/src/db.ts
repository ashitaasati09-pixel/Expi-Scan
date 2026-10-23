import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in server/.env");
  try {
    await mongoose.connect(uri);
    console.log("[db] Connected to MongoDB Atlas");
  } catch (err) {
    console.error("[db] Connection failed:", err);
    process.exit(1);
  }
}