import { db } from "../lib/db";
import { seedStores } from "../lib/seed";
import type { MedicalStore, ApiResponse } from "../lib/types";

// ── Legacy sample-data helpers (kept so nothing else breaks) ─────────────────

export function getMedicalStores(query?: string): ApiResponse<MedicalStore[]> {
  seedStores();
  let stores = db.find<MedicalStore>("medical_stores");
  if (query) {
    const q = query.toLowerCase();
    stores = stores.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  }
  return { success: true, data: stores };
}

export function getMedicalStore(id: string): ApiResponse<MedicalStore> {
  seedStores();
  const store = db.findOne<MedicalStore>("medical_stores", s => s._id === id);
  if (!store) return { success: false, error: "Store not found." };
  return { success: true, data: store };
}

// ── Live nearby search (device GPS + OpenStreetMap data, no API key) ─────────

export interface UserLocation { lat: number; lng: number; accuracy?: number }

const RADII_M = [2000, 5000, 10000, 20000];
export const NEARBY_LIMIT = 7;

export class LocationError extends Error {
  constructor(public code: "unsupported" | "insecure" | "denied" | "unavailable" | "timeout", message: string) {
    super(message);
  }
}

/** Reads the phone/laptop's live GPS position. */
export function getCurrentLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      return reject(new LocationError("unsupported", "This browser can't share your location."));
    }
    if (!window.isSecureContext) {
      return reject(new LocationError("insecure", "Location only works on https or localhost."));
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => {
        if (err.code === err.PERMISSION_DENIED) reject(new LocationError("denied", "Location permission is blocked."));
        else if (err.code === err.TIMEOUT) reject(new LocationError("timeout", "Finding your location took too long."));
        else reject(new LocationError("unavailable", "Your location isn't available right now."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

async function fetchElements(from: UserLocation, radius: number): Promise<any[]> {
  let res: Response;
  try {
    res = await fetch(`/api/stores/nearby?lat=${from.lat}&lng=${from.lng}&radius=${radius}`, { credentials: "include" });
  } catch {
    throw new Error("Can't reach the Expi-Scan server. Make sure the backend is running (cd server, npm run dev).");
  }
  let json: any = null;
  try { json = await res.json(); } catch { /* not JSON */ }
  if (!res.ok || !json?.success) {
    if (res.status === 401) throw new Error("Your session expired. Please log in again.");
    throw new Error(json?.error ?? `Store lookup failed (HTTP ${res.status}).`);
  }
  return json.data ?? [];
}

const OVERRIDES_KEY = "expi-store-overrides";
type Override = { owner?: string; phone?: string };

function readOverrides(): Record<string, Override> {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}"); } catch { return {}; }
}

/** Lets the user fill in an owner name / phone that the map data doesn't have. */
export function saveStoreOverride(id: string, patch: Override): void {
  const all = readOverrides();
  all[id] = { ...all[id], ...patch };
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all)); } catch { /* storage full or blocked */ }
}

export function applyOverrides(stores: MedicalStore[]): MedicalStore[] {
  const all = readOverrides();
  return stores.map(s => {
    const o = all[s._id];
    return o ? { ...s, owner: o.owner || s.owner, phone: o.phone || s.phone } : s;
  });
}

function toStore(el: any, from: UserLocation): MedicalStore | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const t = el.tags ?? {};
  const address = [
    [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "),
    t["addr:suburb"] || t["addr:neighbourhood"],
    t["addr:city"],
    t["addr:postcode"],
  ].filter(Boolean).join(", ");
  const distanceM = haversineM(from, { lat, lng });
  return {
    _id: `osm-${el.type}-${el.id}`,
    name: t.name || t["name:en"] || t.brand || "Medical store",
    address: address || "Address not listed",
    phone: t.phone || t["contact:phone"] || t["contact:mobile"] || t.mobile || "",
    owner: t.owner || t.operator || t["operator:name"] || "",
    latitude: lat,
    longitude: lng,
    openingHours: t.opening_hours || "Hours not listed",
    distanceM,
    distance: formatDistance(distanceM),
  };
}

/** Finds the closest medical stores around the given point, widening the radius until it has enough. */
export async function findNearbyStores(from: UserLocation, limit = NEARBY_LIMIT): Promise<MedicalStore[]> {
  for (const radius of RADII_M) {
        const elements = await fetchElements(from, radius);
    const byId = new Map<string, MedicalStore>();
    for (const el of elements) {
      const s = toStore(el, from);
      if (s) byId.set(s._id, s);
    }
    const sorted = [...byId.values()].sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
    if (sorted.length >= limit || radius === RADII_M[RADII_M.length - 1]) {
      return applyOverrides(sorted.slice(0, limit));
    }
  }
  return [];
}

// ── Last result cache, so the screen fills instantly on the next visit ───────

const CACHE_KEY = "expi-nearby-cache";
export interface NearbyCache { loc: UserLocation; stores: MedicalStore[]; ts: number }

export function readNearbyCache(): NearbyCache | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as NearbyCache | null;
    return c && Array.isArray(c.stores) ? { ...c, stores: applyOverrides(c.stores) } : null;
  } catch { return null; }
}

export function writeNearbyCache(loc: UserLocation, stores: MedicalStore[]): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ loc, stores, ts: Date.now() })); } catch { /* ignore */ }
}

export function directionsUrl(s: Pick<MedicalStore, "latitude" | "longitude">): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}&travelmode=driving`;
}

export function firstPhone(phone: string): string {
  return phone.split(/[;,/]/)[0].replace(/[^\d+]/g, "");
}