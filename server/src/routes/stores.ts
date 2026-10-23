import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const UA = "Expi-Scan/1.0 (medicine expiry tracker)";

async function timedFetch(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function viaOverpass(lat: number, lng: number, radius: number): Promise<any[]> {
  const q = `[out:json][timeout:25];(
    node["amenity"="pharmacy"](around:${radius},${lat},${lng});
    way["amenity"="pharmacy"](around:${radius},${lat},${lng});
    node["healthcare"="pharmacy"](around:${radius},${lat},${lng});
    way["healthcare"="pharmacy"](around:${radius},${lat},${lng});
  );out center tags;`;
  let lastErr: unknown = new Error("No Overpass server answered");
  for (const url of OVERPASS_URLS) {
    try {
      const res = await timedFetch(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA, Accept: "application/json" },
          body: "data=" + encodeURIComponent(q),
        },
        28000
      );
      if (!res.ok) throw new Error(`${new URL(url).host} answered HTTP ${res.status}`);
      const json: any = await res.json();
      return json.elements ?? [];
    } catch (e) {
      lastErr = e;
      console.error("[stores] overpass failed:", (e as Error).message);
    }
  }
  throw lastErr;
}

// Backup source if every Overpass server is busy: plain OpenStreetMap search.
async function viaNominatim(lat: number, lng: number, radius: number): Promise<any[]> {
  const dLat = radius / 111000;
  const dLng = radius / (111000 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  const viewbox = [lng - dLng, lat + dLat, lng + dLng, lat - dLat].join(",");
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=40&bounded=1&addressdetails=1&extratags=1&namedetails=1" +
    `&q=${encodeURIComponent("pharmacy")}&viewbox=${viewbox}`;
  const res = await timedFetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } }, 15000);
  if (!res.ok) throw new Error(`nominatim answered HTTP ${res.status}`);
  const rows: any[] = (await res.json()) as any[];
  return rows.map(r => {
    const a = r.address ?? {};
    const x = r.extratags ?? {};
    return {
      type: r.osm_type ?? "node",
      id: r.osm_id,
      lat: Number(r.lat),
      lon: Number(r.lon),
      tags: {
        name: r.namedetails?.name || r.name || String(r.display_name ?? "").split(",")[0],
        phone: x.phone || x["contact:phone"] || x["contact:mobile"],
        opening_hours: x.opening_hours,
        operator: x.operator,
        owner: x.owner,
        "addr:housenumber": a.house_number,
        "addr:street": a.road,
        "addr:suburb": a.suburb || a.neighbourhood,
        "addr:city": a.city || a.town || a.village,
        "addr:postcode": a.postcode,
      },
    };
  });
}

export async function findStoreElements(lat: number, lng: number, radius: number) {
  try {
    return { source: "overpass", elements: await viaOverpass(lat, lng, radius) };
  } catch (e1) {
    console.error("[stores] falling back to nominatim:", (e1 as Error).message);
    return { source: "nominatim", elements: await viaNominatim(lat, lng, radius) };
  }
}

router.get("/nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Math.min(Math.max(Number(req.query.radius) || 2000, 500), 20000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ success: false, error: "A valid latitude and longitude are required." });
  }
  try {
    const { source, elements } = await findStoreElements(lat, lng, radius);
    res.json({ success: true, source, data: elements });
  } catch (e) {
    console.error("[stores] all sources failed:", (e as Error).message);
    res.status(502).json({ success: false, error: "The map data service is busy right now. Please scan again in a minute." });
  }
});

export default router;