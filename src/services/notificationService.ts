import { db } from "../lib/db";
import { generateId, nowISO } from "../lib/utils";
import type { Notification, Medicine, NotificationType, NotificationSeverity, ApiResponse } from "../lib/types";

function create(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  severity: NotificationSeverity,
  medicineId?: string,
  medicineName?: string
): Notification {
  const notif: Notification = {
    _id: generateId(),
    userId,
    type,
    title,
    message,
    severity,
    medicineName,
    medicineId,
    read: false,
    createdAt: nowISO(),
  };
  db.insertOne("notifications", notif);
  return notif;
}

// ── Deduplication helpers ─────────────────────────────────────────────────────

function alreadyExists(userId: string, type: NotificationType, medicineId: string): boolean {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  return db.find<Notification>("notifications", n =>
    n.userId === userId &&
    n.type === type &&
    n.medicineId === medicineId &&
    new Date(n.createdAt) >= cutoff
  ).length > 0;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const notificationService = {
  createExpiryWarning(userId: string, med: Medicine): void {
    if (alreadyExists(userId, "expiry", med._id)) return;
    const d = med.daysRemaining;
    const urgency = d <= 3 ? "Urgent: " : "";
    create(
      userId, "expiry",
      `${urgency}Medicine Expiring Soon`,
      `${med.name} ${med.strength} expires in ${d} day${d !== 1 ? "s" : ""} (${med.expiryDate}). Consider refilling soon.`,
      d <= 3 ? "danger" : "warning",
      med._id, med.name
    );
  },

  createExpiredAlert(userId: string, med: Medicine): void {
    if (alreadyExists(userId, "expired", med._id)) return;
    create(
      userId, "expired",
      "Medicine Expired",
      `${med.name} ${med.strength} expired on ${med.expiryDate}. Do not consume. Please dispose safely.`,
      "danger", med._id, med.name
    );
  },

  createMedicineReminder(userId: string, med: Medicine): void {
    create(
      userId, "medicine",
      "Medicine Reminder",
      `Time to take ${med.name} ${med.strength} — ${med.dosage}.`,
      "info", med._id, med.name
    );
  },

  createRefillAlert(userId: string, med: Medicine): void {
    if (alreadyExists(userId, "refill", med._id)) return;
    create(
      userId, "refill",
      "Refill Reminder",
      `${med.name} stock is low (${med.quantity} ${med.unit} remaining). Time to request a refill.`,
      "warning", med._id, med.name
    );
  },

  createSystemNotification(userId: string, title: string, message: string): void {
    create(userId, "system", title, message, "info");
  },

  // ── /api/notifications GET ────────────────────────────────────────────────

  getAll(userId: string): ApiResponse<Notification[]> {
    const notifs = db
      .find<Notification>("notifications", n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { success: true, data: notifs };
  },

  // ── /api/notifications/:id/read PATCH ────────────────────────────────────

  markRead(userId: string, id: string): ApiResponse<null> {
    const ok = db.updateOne<Notification>(
      "notifications",
      n => n._id === id && n.userId === userId,
      { read: true }
    );
    return ok ? { success: true, data: null } : { success: false, error: "Not found." };
  },

  // ── /api/notifications/read-all PATCH ────────────────────────────────────

  markAllRead(userId: string): ApiResponse<null> {
    db.find<Notification>("notifications", n => n.userId === userId && !n.read)
      .forEach(n => db.updateOne<Notification>("notifications", x => x._id === n._id, { read: true }));
    return { success: true, data: null };
  },

  // ── /api/notifications/:id DELETE ────────────────────────────────────────

  deleteOne(userId: string, id: string): ApiResponse<null> {
    db.deleteOne<Notification>("notifications", n => n._id === id && n.userId === userId);
    return { success: true, data: null };
  },

  getUnreadCount(userId: string): number {
    return db.find<Notification>("notifications", n => n.userId === userId && !n.read).length;
  },
};
