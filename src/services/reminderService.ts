import { db } from "../lib/db";
import { generateId, nowISO } from "../lib/utils";
import type { Reminder, ReminderType, ReminderFrequency, ApiResponse } from "../lib/types";
import { notificationService } from "./notificationService";
import { getMedicine } from "./medicineService";

interface ReminderInput {
  medicineId: string;
  medicineName: string;
  type: ReminderType;
  time: string;
  frequency: ReminderFrequency;
  startDate: string;
  endDate: string;
  notificationMethod: ("push" | "email")[];
}

// ── /api/reminders POST ───────────────────────────────────────────────────────

export function createReminder(userId: string, input: ReminderInput): ApiResponse<Reminder> {
  if (!input.medicineId || !input.time)
    return { success: false, error: "Medicine and time are required." };

  const reminder: Reminder = {
    _id: generateId(),
    userId,
    status: "active",
    enabled: true,
    createdAt: nowISO(),
    ...input,
  };
  db.insertOne("reminders", reminder);

  // Generate an immediate notification for medicine reminders
  if (input.type === "medicine") {
    const medRes = getMedicine(userId, input.medicineId);
    if (medRes.data) notificationService.createMedicineReminder(userId, medRes.data);
  }

  return { success: true, data: reminder };
}

// ── /api/reminders GET ────────────────────────────────────────────────────────

export function getReminders(userId: string): ApiResponse<Reminder[]> {
  const list = db
    .find<Reminder>("reminders", r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { success: true, data: list };
}

// ── /api/reminders/:id PATCH ──────────────────────────────────────────────────

export function updateReminder(
  userId: string,
  id: string,
  patch: Partial<ReminderInput & { enabled: boolean; status: Reminder["status"] }>
): ApiResponse<Reminder> {
  const updated = db.updateOne<Reminder>(
    "reminders",
    r => r._id === id && r.userId === userId,
    patch
  );
  if (!updated) return { success: false, error: "Reminder not found." };
  return { success: true, data: updated };
}

// ── /api/reminders/:id DELETE ─────────────────────────────────────────────────

export function deleteReminder(userId: string, id: string): ApiResponse<null> {
  const ok = db.deleteOne<Reminder>("reminders", r => r._id === id && r.userId === userId);
  return ok ? { success: true, data: null } : { success: false, error: "Not found." };
}
