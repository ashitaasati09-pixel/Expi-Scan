/**
 * Seeds read-only reference data (medical stores) on first launch.
 * Safe to call multiple times — checks if data already exists.
 */
import { db } from "./db";
import { generateId, nowISO } from "./utils";
import type { MedicalStore } from "./types";

const STORES: Omit<MedicalStore, "_id">[] = [
  {
    name: "MediCare Pharmacy",
    address: "120 Boylston Street, Boston, MA 02116",
    phone: "+1 (617) 555-0123",
    latitude: 42.3511,
    longitude: -71.0684,
    openingHours: "Mon–Sat: 8AM–10PM, Sun: 9AM–8PM",
    rating: 4.8,
    isOpen: true,
    distance: "0.3 km",
    availableMedicines: 12,
  },
  {
    name: "HealthFirst Drugstore",
    address: "45 Tremont Street, Boston, MA 02108",
    phone: "+1 (617) 555-0187",
    latitude: 42.3573,
    longitude: -71.0598,
    openingHours: "Mon–Fri: 7AM–9PM, Sat–Sun: 8AM–6PM",
    rating: 4.5,
    isOpen: true,
    distance: "0.7 km",
    availableMedicines: 8,
  },
  {
    name: "Boston Family Pharmacy",
    address: "88 Washington Street, Boston, MA 02111",
    phone: "+1 (617) 555-0244",
    latitude: 42.3558,
    longitude: -71.0614,
    openingHours: "Mon–Sat: 9AM–8PM, Sun: Closed",
    rating: 4.3,
    isOpen: false,
    distance: "1.2 km",
    availableMedicines: 15,
  },
  {
    name: "CityMed Pharmacy",
    address: "210 Commonwealth Ave, Boston, MA 02116",
    phone: "+1 (617) 555-0399",
    latitude: 42.3498,
    longitude: -71.0793,
    openingHours: "Open 24 hours",
    rating: 4.6,
    isOpen: true,
    distance: "1.8 km",
    availableMedicines: 20,
  },
];

export function seedStores(): void {
  const existing = db.find<MedicalStore>("medical_stores");
  if (existing.length > 0) return;
  STORES.forEach(s => db.insertOne("medical_stores", { _id: generateId(), ...s }));
}
