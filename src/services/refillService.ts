import { db } from "../lib/db";
import { generateId, nowISO } from "../lib/utils";
import type { RefillRequest, RefillStatus, ApiResponse } from "../lib/types";
import { notificationService } from "./notificationService";

interface RefillInput {
  medicineId: string;
  medicineName: string;
  storeId: string;
  storeName: string;
  quantity: number;
  unit: string;
}

// ── /api/refills POST ─────────────────────────────────────────────────────────

export function createRefillRequest(userId: string, input: RefillInput): ApiResponse<RefillRequest> {
  const now = nowISO();
  const req: RefillRequest = {
    _id: generateId(),
    userId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  db.insertOne("refill_requests", req);

  notificationService.createSystemNotification(
    userId,
    "Refill Request Submitted",
    `Your refill request for ${input.medicineName} has been sent to ${input.storeName}. We'll notify you when it's ready.`
  );

  return { success: true, data: req };
}

// ── /api/refills GET ──────────────────────────────────────────────────────────

export function getRefillRequests(userId: string): ApiResponse<RefillRequest[]> {
  const list = db
    .find<RefillRequest>("refill_requests", r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { success: true, data: list };
}

// ── /api/refills/:id PATCH (status update) ────────────────────────────────────

export function updateRefillStatus(
  userId: string,
  id: string,
  status: RefillStatus
): ApiResponse<RefillRequest> {
  const updated = db.updateOne<RefillRequest>(
    "refill_requests",
    r => r._id === id && r.userId === userId,
    { status, updatedAt: nowISO() }
  );
  if (!updated) return { success: false, error: "Refill request not found." };
  return { success: true, data: updated };
}

// ── /api/refills/:id DELETE ───────────────────────────────────────────────────

export function deleteRefillRequest(userId: string, id: string): ApiResponse<null> {
  const ok = db.deleteOne<RefillRequest>("refill_requests", r => r._id === id && r.userId === userId);
  return ok ? { success: true, data: null } : { success: false, error: "Not found." };
}

export function getPendingRefillCount(userId: string): number {
  return db.find<RefillRequest>("refill_requests", r => r.userId === userId && r.status === "pending").length;
}
