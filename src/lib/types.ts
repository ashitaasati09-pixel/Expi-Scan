// ── MongoDB-shaped domain types ──────────────────────────────────────────────

export type MedicineStatus = "safe" | "expiring-soon" | "expired";
export type MedicineSource = "manual" | "scan";
export type PrescriptionStatus = "processing" | "processed" | "failed";
export type ReminderType = "medicine" | "expiry" | "refill";
export type ReminderFrequency = "once" | "daily" | "weekly" | "monthly";
export type NotificationType = "medicine" | "expiry" | "expired" | "refill" | "system";
export type NotificationSeverity = "info" | "warning" | "danger";
export type RefillStatus = "pending" | "contacted" | "completed";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  profileImage?: string;
  dob?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  _id: string;
  userId: string;
  name: string;
  genericName: string;
  type: string;
  strength: string;
  dosage: string;
  quantity: number;
  unit: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  refillThreshold: number;
  notes: string;
  prescriptionRequired: boolean;
  source: MedicineSource;
  createdAt: string;
  updatedAt: string;
  // computed
  daysRemaining: number;
  status: MedicineStatus;
}

export interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  confidence: number;
}

export interface Prescription {
  _id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileType: "image" | "pdf";
  doctorName: string;
  clinicName: string;
  prescriptionDate: string;
  extractedMedicines: ExtractedMedicine[];
  processingStatus: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  _id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  type: ReminderType;
  time: string;
  frequency: ReminderFrequency;
  startDate: string;
  endDate: string;
  notificationMethod: ("push" | "email")[];
  enabled: boolean;
  status: "active" | "pending" | "completed";
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  medicineName?: string;
  medicineId?: string;
  read: boolean;
  severity: NotificationSeverity;
  createdAt: string;
}

export interface RefillRequest {
  _id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  storeId: string;
  storeName: string;
  quantity: number;
  unit: string;
  status: RefillStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalStore {
  _id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
    openingHours: string;
  rating?: number;
  isOpen?: boolean;
  distance?: string;
  distanceM?: number;
  owner?: string;
  availableMedicines?: number;
}
export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  totalMedicines: number;
  safeMedicines: number;
  expiringMedicines: number;
  expiredMedicines: number;
  activePrescriptions: number;
  pendingRefills: number;
  unreadNotifications: number;
}
