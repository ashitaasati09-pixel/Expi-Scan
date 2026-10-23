import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, CheckCircle, User, LocateFixed, AlertCircle, Pencil } from "lucide-react";
import {
  getCurrentLocation, findNearbyStores, readNearbyCache, writeNearbyCache, saveStoreOverride,
  applyOverrides, directionsUrl, firstPhone, LocationError, NEARBY_LIMIT, type UserLocation,
} from "../services/storeService";
import { useRefills } from "../hooks/useRefills";
import { useMedicines } from "../hooks/useMedicines";
import type { MedicalStore } from "../lib/types";

type RefillStep = "select-medicine" | "confirm" | "submitted";
type Status = "locating" | "searching" | "done" | "error";

function describeError(e: unknown): string {
  if (e instanceof LocationError) {
    if (e.code === "denied") return "Location is blocked. Tap the lock icon in Chrome's address bar, set Location to Allow, then scan again.";
    if (e.code === "insecure") return "Chrome only shares location on https or localhost. Open the app through your ngrok https link instead of the Wi-Fi address.";
    if (e.code === "timeout") return "Finding your location took too long. Move near a window or turn on GPS, then scan again.";
    return e.message;
  }
    return e instanceof Error && e.message ? e.message : "Couldn't load nearby stores. Please scan again.";
}

export default function MedicalStores() {
  const [stores, setStores] = useState<MedicalStore[]>([]);
  const [loc, setLoc] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<Status>("locating");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MedicalStore | null>(null);
  const [refillStep, setRefillStep] = useState<RefillStep | null>(null);
  const { medicines } = useMedicines();
  const { add: addRefill } = useRefills();
  const [selectedMedId, setSelectedMedId] = useState("");
  const [qty, setQty] = useState("30");
  const [submitting, setSubmitting] = useState(false);

  const scan = useCallback(async () => {
    setError("");
    setStatus("locating");
    try {
      const here = await getCurrentLocation();
      setLoc(here);
      setStatus("searching");
      const found = await findNearbyStores(here, NEARBY_LIMIT);
      setStores(found);
      writeNearbyCache(here, found);
      setStatus("done");
    } catch (e) {
      setError(describeError(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Show the last result immediately, then refresh from the live location.
    const cached = readNearbyCache();
    if (cached) { setLoc(cached.loc); setStores(cached.stores); }
    scan();
  }, [scan]);

  const query = search.trim().toLowerCase();
  const visible = query
    ? stores.filter(s => s.name.toLowerCase().includes(query) || s.address.toLowerCase().includes(query))
    : stores;

  const selectedMed = medicines.find(m => m._id === selectedMedId) || medicines[0];

  const handleSubmitRefill = async () => {
    if (!selected || !selectedMed) return;
    setSubmitting(true);
    addRefill({
      medicineId: selectedMed._id,
      medicineName: selectedMed.name,
      storeId: selected._id,
      storeName: selected.name,
      quantity: Number(qty),
      unit: selectedMed.unit,
    });
    setSubmitting(false);
    setRefillStep("submitted");
  };

  const refreshSelected = (id: string) => {
    const next = applyOverrides(stores).find(s => s._id === id);
    if (next) { setStores(prev => prev.map(s => (s._id === id ? next : s))); setSelected(next); }
  };

  if (refillStep) return (
    <RefillFlow
      step={refillStep}
      store={selected!}
      medicines={medicines}
      selectedMedId={selectedMedId}
      qty={qty}
      submitting={submitting}
      onMedChange={setSelectedMedId}
      onQtyChange={setQty}
      onNext={() => {
        if (refillStep === "select-medicine") setRefillStep("confirm");
        else if (refillStep === "confirm") handleSubmitRefill();
      }}
      onBack={() => {
        if (refillStep === "select-medicine") { setRefillStep(null); }
        else if (refillStep === "confirm") setRefillStep("select-medicine");
        else { setRefillStep(null); setSelected(null); }
      }}
    />
  );

  if (selected) return (
    <StoreDetail
      store={selected}
      onBack={() => setSelected(null)}
      onSaved={() => refreshSelected(selected._id)}
      onRefill={() => { setSelectedMedId(medicines[0]?._id ?? ""); setRefillStep("select-medicine"); }}
    />
  );

  const busy = status === "locating" || status === "searching";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nearby Medical Stores</h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1" aria-live="polite">
            <MapPin size={13} />
            {status === "locating" && "Finding your location…"}
            {status === "searching" && "Looking for stores around you…"}
            {status === "done" && `${stores.length} closest store${stores.length !== 1 ? "s" : ""} to your live location`}
            {status === "error" && (stores.length ? "Showing your last scan" : "Location needed")}
          </p>
        </div>
        <button onClick={scan} disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex-shrink-0">
          <LocateFixed size={16} className={busy ? "animate-spin" : ""} /> {busy ? "Scanning…" : "Scan my location"}
        </button>
      </div>

      {status === "error" && (
        <div role="alert" className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-5 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <NearbyMap loc={loc} stores={visible} activeId={activeId} onPick={id => {
        setActiveId(id);
        document.getElementById(`store-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }} />

      {stores.length > 0 && (
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter these stores by name or area…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 bg-white" />
        </div>
      )}

      {busy && stores.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {status === "done" && stores.length === 0 && (
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-10">
          <MapPin size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">No medical stores found within 20 km</p>
          <p className="text-sm text-slate-500 mt-1">The map data may be incomplete in your area. Try scanning again from a different spot.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {visible.map(store => {
          const n = stores.indexOf(store) + 1;
          const phone = firstPhone(store.phone);
          return (
            <div key={store._id} id={`store-${store._id}`}
              className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer ${activeId === store._id ? "border-teal-400 shadow-md ring-2 ring-teal-100" : "border-slate-200 hover:border-teal-200 hover:shadow-md"}`}
              onClick={() => { setActiveId(store._id); setSelected(store); }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-800 truncate">{store.name}</h3>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-0.5"><MapPin size={11} className="mt-0.5 flex-shrink-0" /> {store.address}</p>
                </div>
                <p className="text-sm font-semibold text-teal-600 flex-shrink-0">{store.distance}</p>
              </div>
              <div className="space-y-1 mb-3 text-xs text-slate-600">
                <p className="flex items-center gap-1.5"><User size={12} className="text-slate-400" /> Owner: <span className={store.owner ? "font-medium text-slate-800" : "text-slate-400"}>{store.owner || "Not listed"}</span></p>
                <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> <span className={store.phone ? "font-medium text-slate-800" : "text-slate-400"}>{store.phone || "Phone not listed"}</span></p>
                <p className="flex items-center gap-1.5 text-slate-400"><Clock size={12} /> {store.openingHours}</p>
              </div>
              <div className="flex gap-2">
                <a href={directionsUrl(store)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 text-xs font-medium rounded-xl hover:bg-teal-100 flex-1 justify-center"
                  onClick={e => e.stopPropagation()}>
                  <Navigation size={13} /> Directions
                </a>
                {phone ? (
                  <a href={`tel:${phone}`} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 text-xs font-medium rounded-xl hover:bg-blue-100 flex-1 justify-center"
                    onClick={e => e.stopPropagation()}>
                    <Phone size={13} /> Call
                  </a>
                ) : (
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-400 text-xs font-medium rounded-xl flex-1 justify-center"
                    onClick={e => { e.stopPropagation(); setSelected(store); }}>
                    <Pencil size={13} /> Add phone
                  </button>
                )}
                <button className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl hover:bg-emerald-100 flex-1 justify-center"
                  onClick={e => { e.stopPropagation(); setSelected(store); setSelectedMedId(medicines[0]?._id ?? ""); setRefillStep("select-medicine"); }}>
                  <RefreshCw size={13} /> Refill
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-6">Store details come from OpenStreetMap contributors. Phone numbers and owner names are only shown when someone has added them, so please confirm by calling before you visit.</p>
    </div>
  );
}

function NearbyMap({ loc, stores, activeId, onPick }: { loc: UserLocation | null; stores: MedicalStore[]; activeId: string | null; onPick: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([20.59, 78.96], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const points: L.LatLngExpression[] = [];
    if (loc) {
      points.push([loc.lat, loc.lng]);
      if (loc.accuracy && loc.accuracy < 2000) L.circle([loc.lat, loc.lng], { radius: loc.accuracy, color: "#2563eb", weight: 1, fillOpacity: 0.08 }).addTo(g);
      L.circleMarker([loc.lat, loc.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }).bindTooltip("You are here").addTo(g);
    }
    stores.forEach((s, i) => {
      points.push([s.latitude, s.longitude]);
      const active = s._id === activeId;
      const icon = L.divIcon({
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        html: `<div style="width:30px;height:30px;border-radius:50%;background:${active ? "#0f766e" : "#0d9488"};color:#fff;font:700 13px/26px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);${active ? "transform:scale(1.2);" : ""}">${i + 1}</div>`,
      });
      L.marker([s.latitude, s.longitude], { icon, title: s.name, keyboard: true })
        .bindTooltip(`${s.name} · ${s.distance ?? ""}`)
        .on("click", () => pick.current(s._id))
        .addTo(g);
    });
    if (points.length > 1) m.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 17 });
    else if (points.length === 1) m.setView(points[0], 16);
  }, [loc, stores, activeId]);

  return (
    <div className="relative z-0 mb-5 rounded-2xl overflow-hidden border border-slate-200" style={{ isolation: "isolate" }}>
      <div ref={box} className="h-72 sm:h-96 w-full bg-slate-100" role="application" aria-label="Map of medical stores near you" />
    </div>
  );
}

function StoreDetail({ store, onBack, onRefill, onSaved }: { store: MedicalStore; onBack: () => void; onRefill: () => void; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [owner, setOwner] = useState(store.owner ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const callable = firstPhone(store.phone);

  const save = () => {
    saveStoreOverride(store._id, { owner: owner.trim(), phone: phone.trim() });
    setEditing(false);
    onSaved();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Stores
      </button>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6">
          <h1 className="text-2xl font-bold text-white">{store.name}</h1>
          <p className="text-teal-100 text-sm mt-1 flex items-center gap-1"><MapPin size={13} /> {store.address}</p>
          <p className="text-teal-50 text-sm mt-2 font-medium">{store.distance} from you</p>
        </div>
        <div className="p-6 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Phone, label: "Mobile number", value: store.phone || "Not listed" },
            { icon: User, label: "Owner name", value: store.owner || "Not listed" },
            { icon: Clock, label: "Hours", value: store.openingHours },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-3">
              <item.icon size={16} className="text-slate-400 mb-1" />
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="text-sm font-medium text-slate-800 break-words">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-4">
          {editing ? (
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <label htmlFor="owner" className="block text-xs font-medium text-slate-600 mb-1">Owner name</label>
                <input id="owner" value={owner} onChange={e => setOwner(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-600 mb-1">Mobile number</label>
                <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={save} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg">Save details</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-slate-500 text-sm rounded-lg hover:bg-slate-100">Cancel</button>
              </div>
              <p className="text-xs text-slate-400">Saved on this device only.</p>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 font-medium">
              <Pencil size={14} /> {store.owner && store.phone ? "Edit owner and number" : "Add owner name or number"}
            </button>
          )}
        </div>

        <div className="px-6 pb-6 grid sm:grid-cols-2 gap-3">
          <a href={directionsUrl(store)} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold py-3 rounded-xl">
            <Navigation size={18} /> Get directions
          </a>
          {callable ? (
            <a href={`tel:${callable}`} className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl">
              <Phone size={18} /> Call store
            </a>
          ) : (
            <span className="flex items-center justify-center gap-2 bg-slate-50 text-slate-400 font-semibold py-3 rounded-xl">
              <Phone size={18} /> No number listed
            </span>
          )}
          <button onClick={onRefill}
            className="sm:col-span-2 w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-all">
            <RefreshCw size={18} /> Request refill from this store
          </button>
        </div>
      </div>
    </div>
  );
}

function RefillFlow({ step, store, medicines, selectedMedId, qty, submitting, onMedChange, onQtyChange, onNext, onBack }: any) {
  const med = medicines.find((m: any) => m._id === selectedMedId) || medicines[0];

  if (step === "submitted") return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Refill Requested!</h2>
        <p className="text-slate-500 text-sm mb-3">Your refill request for <strong>{med?.name}</strong> has been sent to <strong>{store?.name}</strong>.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-700 text-left">
          <p className="font-semibold mb-0.5">Status: Request Sent</p>
          <p>The store is reviewing your request. You'll receive a notification when it's ready for pickup.</p>
        </div>
        <button onClick={onBack} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl">Back to Stores</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back
      </button>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {step === "select-medicine" ? "Select Medicine" : "Confirm Refill"}
      </h1>
      <p className="text-slate-500 text-sm mb-6">{step === "select-medicine" ? `From ${store?.name}` : "Review your refill request before submitting"}</p>

      <div className="space-y-4">
        {step === "select-medicine" ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Medicine</label>
              {medicines.length === 0 ? (
                <p className="text-sm text-slate-400">No medicines to refill. Add a medicine first.</p>
              ) : (
                <select value={selectedMedId} onChange={e => onMedChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-400">
                  {medicines.map((m: any) => <option key={m._id} value={m._id}>{m.name} {m.strength}</option>)}
                </select>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
              <input type="number" value={qty} onChange={e => onQtyChange(e.target.value)} min="1"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            {[
              { label: "Medicine", value: `${med?.name} ${med?.strength}` },
              { label: "Quantity", value: `${qty} ${med?.unit}` },
              { label: "Store", value: store?.name },
              { label: "Address", value: store?.address },
              { label: "Phone", value: store?.phone || "Not listed" },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-medium text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onNext} disabled={submitting || (step === "select-medicine" && medicines.length === 0)}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {step === "select-medicine" ? "Continue" : "Submit Refill Request"}
        </button>
      </div>
    </div>
  );
}
