import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
const COOKIE_NAME = "expiscan_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

function safeUser(user: any) {
  const json = user.toJSON();
  delete json.passwordHash;
  return json;
}

router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }
  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, error: "An account with this email already exists." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: (phone ?? "").trim(),
    passwordHash,
  });
  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({ success: true, data: { user: safeUser(user), token } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required." });
  }
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(401).json({ success: false, error: "Invalid email or password." });
  if (!user.passwordHash) {
  return res.status(401).json({ success: false, error: "Invalid email or password." });
}
const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, error: "Invalid email or password." });
  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({ success: true, data: { user: safeUser(user), token } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true, data: null });
});

router.get("/profile", requireAuth, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, error: "User not found." });
  res.json({ success: true, data: safeUser(user) });
});

router.patch("/profile", requireAuth, async (req: AuthedRequest, res) => {
  const { name, phone, dob, address, profileImage } = req.body ?? {};
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { name, phone, dob, address, profileImage } },
    { new: true }
  );
  if (!user) return res.status(404).json({ success: false, error: "User not found." });
  res.json({ success: true, data: safeUser(user) });
});

router.patch("/profile/password", requireAuth, async (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, error: "User not found." });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ success: false, error: "Current password is incorrect." });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true, data: null });
});

export default router;