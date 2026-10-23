import type { Medicine, ApiResponse } from "../lib/types";
import { notificationService } from "./notificationService";

type MedicineInput = Omit<Medicine, "_id" | "userId" | "source" | "daysRemaining" | "status" | "createdAt" | "updatedAt">;

const BASE = "/api/medicines";

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function createMedicine(
  userId: string,
  input: MedicineInput,
  source: "manual" | "scan" = "manual"
): Promise<ApiResponse<Medicine>> {
  if (!input.name || !input.expiryDate) {
    return { success: false, error: "Medicine name and expiry date are required." };
  }
  const res = await request<Medicine>("", { method: "POST", body: JSON.stringify({ ...input, source }) });
  if (res.success && res.data) {
    if (res.data.status === "expired") notificationService.createExpiredAlert(userId, res.data);
    else if (res.data.status === "expiring-soon") notificationService.createExpiryWarning(userId, res.data);
  }
  return res;
}

export async function scanMedicineImage(imageData: string, mimeType: string): Promise<ApiResponse<any>> {
  return request<any>("/scan", { method: "POST", body: JSON.stringify({ imageData, mimeType }) });
}

export async function getMedicines(userId: string): Promise<ApiResponse<Medicine[]>> {
  const res = await request<Medicine[]>("");
  if (res.success && res.data) {
    res.data.forEach((m) => {
      if (m.status === "expired") notificationService.createExpiredAlert(userId, m);
      else if (m.status === "expiring-soon") notificationService.createExpiryWarning(userId, m);
    });
  }
  return res;
}

export async function getMedicine(userId: string, id: string): Promise<ApiResponse<Medicine>> {
  return request<Medicine>(`/${id}`);
}

export async function updateMedicine(
  userId: string,
  id: string,
  patch: Partial<MedicineInput>
): Promise<ApiResponse<Medicine>> {
  return request<Medicine>(`/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteMedicine(userId: string, id: string): Promise<ApiResponse<null>> {
  return request<null>(`/${id}`, { method: "DELETE" });
}

export async function getMedicineStats(userId: string) {
  const res = await request<{
    total: number;
    safe: number;
    expiringSoon: number;
    expired: number;
    refillNeeded: number;
  }>("/stats");
  return res.success && res.data ? res.data : { total: 0, safe: 0, expiringSoon: 0, expired: 0, refillNeeded: 0 };
}