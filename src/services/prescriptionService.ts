import type { Prescription, ExtractedMedicine, ApiResponse } from "../lib/types";
import { notificationService } from "./notificationService";
import { createMedicine } from "./medicineService";

const BASE = "/api/prescriptions";

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadPrescription(userId: string, file: File): Promise<ApiResponse<Prescription>> {
  const fileType = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "image";
  const mimeType = file.type || (fileType === "pdf" ? "application/pdf" : "image/jpeg");
  const fileData = await fileToBase64(file);

  const created = await request<Prescription>("", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, fileType, mimeType, fileData }),
  });
  if (!created.success || !created.data) return created;

  const extracted = await request<Prescription>(`/${created.data._id}/extract`, { method: "POST" });

  if (extracted.success && extracted.data) {
    notificationService.createSystemNotification(
      userId,
      "Prescription Processed",
      `Your prescription from ${extracted.data.doctorName || "your doctor"} has been processed. ${extracted.data.extractedMedicines.length} medicine${extracted.data.extractedMedicines.length !== 1 ? "s" : ""} extracted.`
    );
  }
  return extracted;
}

export async function getPrescriptions(userId: string): Promise<ApiResponse<Prescription[]>> {
  return request<Prescription[]>("");
}

export async function getPrescription(userId: string, id: string): Promise<ApiResponse<Prescription>> {
  return request<Prescription>(`/${id}`);
}

export async function updatePrescription(
  userId: string,
  id: string,
  patch: Partial<Pick<Prescription, "doctorName" | "clinicName" | "prescriptionDate" | "extractedMedicines">>
): Promise<ApiResponse<Prescription>> {
  return request<Prescription>(`/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function addExtractedMedicines(
  userId: string,
  prescriptionId: string,
  meds: ExtractedMedicine[]
): Promise<ApiResponse<null>> {
  await Promise.all(
    meds.map((m) =>
      createMedicine(
        userId,
        {
          name: m.name,
          genericName: m.name,
          type: "Tablet",
          strength: m.dosage,
          dosage: `${m.frequency}${m.duration ? " for " + m.duration : ""}`,
          quantity: m.quantity,
          unit: "Tablets",
          batchNumber: "",
          manufacturingDate: "",
          expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
          refillThreshold: Math.ceil((m.quantity || 1) * 0.2),
          notes: `From prescription. Frequency: ${m.frequency}.${m.duration ? " Duration: " + m.duration + "." : ""}`,
          prescriptionRequired: true,
        },
        "scan"
      )
    )
  );
  return { success: true, data: null };
}

export async function deletePrescription(userId: string, id: string): Promise<ApiResponse<null>> {
  return request<null>(`/${id}`, { method: "DELETE" });
}