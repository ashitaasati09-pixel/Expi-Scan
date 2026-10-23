import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import medicineRoutes from "./routes/medicines.js";
import storeRoutes from "./routes/stores.js";

const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000", credentials: true }));

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/stores", storeRoutes);
import prescriptionRoutes from "./routes/prescriptions.js";
// ...
app.use("/api/prescriptions", prescriptionRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
});