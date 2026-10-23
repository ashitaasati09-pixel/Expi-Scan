import type { MedicineStatus } from "./types";

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Password hashing via Web Crypto ──────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return (await hashPassword(plain)) === hash;
}

// ── Session token ─────────────────────────────────────────────────────────────

export function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Expiry calculations ───────────────────────────────────────────────────────

export function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}

export function computeStatus(daysRemaining: number): MedicineStatus {
  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= 30) return "expiring-soon";
  return "safe";
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Simulated AI prescription extraction ─────────────────────────────────────

const fakeMeds = [
  { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", duration: "3 months", quantity: 90, confidence: 0.97 },
  { name: "Metformin", dosage: "500mg", frequency: "Twice daily with meals", duration: "Ongoing", quantity: 60, confidence: 0.95 },
  { name: "Atorvastatin", dosage: "20mg", frequency: "Once at bedtime", duration: "Ongoing", quantity: 30, confidence: 0.93 },
  { name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", duration: "7 days", quantity: 21, confidence: 0.99 },
  { name: "Omeprazole", dosage: "20mg", frequency: "Once before breakfast", duration: "4 weeks", quantity: 28, confidence: 0.91 },
  { name: "Aspirin", dosage: "81mg", frequency: "Once daily", duration: "Ongoing", quantity: 30, confidence: 0.98 },
  { name: "Pantoprazole", dosage: "40mg", frequency: "Once daily", duration: "8 weeks", quantity: 56, confidence: 0.88 },
];

export async function extractPrescriptionData(fileName: string) {
  await new Promise(r => setTimeout(r, 2500));
  const count = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...fakeMeds].sort(() => Math.random() - 0.5);
  return {
    doctorName: "Dr. " + ["James Harrison", "Priya Sharma", "Robert Chen", "Maria Lopez"][Math.floor(Math.random() * 4)],
    clinicName: ["Boston Medical Center", "Cityview Clinic", "Downtown Health Hub", "Harbor Health"][Math.floor(Math.random() * 4)],
    prescriptionDate: todayStr(),
    extractedMedicines: shuffled.slice(0, count),
  };
}
