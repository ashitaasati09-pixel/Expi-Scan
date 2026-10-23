import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Upload, Sparkles } from "lucide-react";
import { useMedicines, useMedicine } from "../hooks/useMedicines";
import { scanMedicineImage } from "../services/medicineService";

const medicineTypes = ["Tablet", "Capsule", "Syrup", "Injection", "Softgel", "Cream", "Drops", "Inhaler", "Patch"];
const units = ["Tablets", "Capsules", "mL", "mg", "Units", "Softgels", "Puffs"];
const frequencies = ["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "Every 12 hours", "As needed", "Weekly", "Monthly"];

const defaultForm = {
  name: "", genericName: "", type: "Tablet", strength: "", dosage: "",
  quantity: "", unit: "Tablets", batchNumber: "", manufacturingDate: "",
  expiryDate: "", prescriptionRequired: false, refillThreshold: "", notes: "",
  enableReminder: false, frequency: "Once daily", reminderTime: "08:00",
  startDate: "", endDate: "",
};

function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve({ data: base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

// Moved outside the component so React treats these as stable component
// identities across re-renders (fixes the focus-loss-on-every-keystroke bug).
function FormInput({ label, name, type = "text", placeholder = "", required = false, aiMissing = false, form, errors, onChange }: any) {
  return (
    <div>
      <label className="flex items-center flex-wrap gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500">*</span>}
        {aiMissing && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Not detected
          </span>
        )}
      </label>
      <input type={type} value={form[name]}
        onChange={e => onChange(name, e.target.value)} placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all
          ${errors[name] ? "border-red-400 focus:ring-red-100" : aiMissing ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal-400 focus:ring-teal-100"}`} />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );
}

function FormSelect({ label, name, options, aiMissing = false, form, onChange }: any) {
  return (
    <div>
      <label className="flex items-center flex-wrap gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {aiMissing && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Not detected
          </span>
        )}
      </label>
      <select value={form[name]} onChange={e => onChange(name, e.target.value)}
        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 bg-white transition-all
          ${aiMissing ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal-400 focus:ring-teal-100"}`}>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function AddMedicine() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { add, update } = useMedicines();
  const { medicine } = useMedicine(id ?? "");

  const [mode, setMode] = useState<"manual" | "scan">("manual");
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [scanPreview, setScanPreview] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanApplied, setScanApplied] = useState(false);
  const [aiMissingFields, setAiMissingFields] = useState<Set<string>>(new Set());

  // Populate form when editing
  useEffect(() => {
    if (isEdit && medicine) {
      setForm({
        name: medicine.name, genericName: medicine.genericName, type: medicine.type,
        strength: medicine.strength, dosage: medicine.dosage, quantity: String(medicine.quantity),
        unit: medicine.unit, batchNumber: medicine.batchNumber,
        manufacturingDate: medicine.manufacturingDate, expiryDate: medicine.expiryDate,
        prescriptionRequired: medicine.prescriptionRequired,
        refillThreshold: String(medicine.refillThreshold), notes: medicine.notes,
        enableReminder: false, frequency: "Once daily", reminderTime: "08:00", startDate: "", endDate: "",
      });
    }
  }, [medicine, isEdit]);

  const set = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    if (aiMissingFields.has(k) && v !== "" && v !== false) {
      setAiMissingFields(prev => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
    }
  };

  const handleScanFile = async (file: File) => {
    setScanError("");
    setScanApplied(false);
    setScanning(true);
    try {
      const { data, mimeType } = await fileToBase64(file);
      setScanPreview(`data:${mimeType};base64,${data}`);

      const res = await scanMedicineImage(data, mimeType);
      if (!res.success || !res.data) {
        setScanError(res.error ?? "Couldn't detect medicine details. Please fill the form manually.");
        setScanning(false);
        return;
      }

      const d = res.data as Record<string, any>;
      const missing = new Set<string>();
      const patch: Record<string, string> = {};

      (["name", "genericName", "strength", "dosage", "batchNumber", "manufacturingDate", "expiryDate"] as const)
        .forEach((key) => {
          const val = d[key];
          if (val && String(val).trim()) patch[key] = String(val).trim();
          else missing.add(key);
        });

      if (d.type && medicineTypes.includes(d.type)) patch.type = d.type;
      else missing.add("type");

      if (d.unit && units.includes(d.unit)) patch.unit = d.unit;

      if (d.quantity !== null && d.quantity !== undefined && !isNaN(+d.quantity)) patch.quantity = String(d.quantity);
      else missing.add("quantity");

      setForm(f => ({
        ...f,
        ...patch,
        prescriptionRequired: typeof d.prescriptionRequired === "boolean" ? d.prescriptionRequired : f.prescriptionRequired,
      }));
      setAiMissingFields(missing);
      setScanApplied(true);
    } catch {
      setScanError("Couldn't read that image. Please try another photo or fill the form manually.");
    } finally {
      setScanning(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Medicine name is required.";
    if (!form.strength.trim()) e.strength = "Strength is required.";
    if (!form.quantity || isNaN(+form.quantity) || +form.quantity < 0) e.quantity = "Enter a valid quantity.";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setApiError(""); setLoading(true);

    const payload = {
      name: form.name.trim(), genericName: form.genericName.trim() || form.name.trim(),
      type: form.type, strength: form.strength.trim(), dosage: form.dosage.trim(),
      quantity: Number(form.quantity), unit: form.unit,
      batchNumber: form.batchNumber.trim(), manufacturingDate: form.manufacturingDate,
      expiryDate: form.expiryDate, prescriptionRequired: form.prescriptionRequired,
      refillThreshold: Number(form.refillThreshold) || 10,
      notes: form.notes.trim(),
    };

    const res = isEdit && id
      ? await update(id, payload)
      : await add(payload, mode === "scan" ? "scan" : "manual");

    setLoading(false);
    if (res?.success) { setSaved(true); setTimeout(() => navigate("/medicines"), 1500); }
    else setApiError(res?.error ?? "Failed to save medicine.");
  };

  if (saved) return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Medicine {isEdit ? "Updated" : "Saved"}!</h2>
        <p className="text-slate-500 text-sm">Redirecting to your medicine cabinet…</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? "Edit Medicine" : "Add Medicine"}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{isEdit ? "Update medicine details." : "Add a new medicine to your cabinet."}</p>
      </div>

      {!isEdit && (
        <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-6">
          <button type="button" onClick={() => setMode("manual")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${mode === "manual" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}>
            Manual Entry
          </button>
          <button type="button" onClick={() => setMode("scan")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${mode === "scan" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}>
            <Sparkles size={14} /> Scan / Upload
          </button>
        </div>
      )}

      {apiError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
          <AlertCircle size={16} /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isEdit && mode === "scan" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <Sparkles size={16} className="text-teal-600" /> Scan Medicine Label
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Upload a clear photo of the medicine box or label. AI will read the details and fill the form below —
              anything it can't read gets marked so you can fill it in by hand.
            </p>

            {!scanPreview ? (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-10 cursor-pointer hover:border-teal-300 hover:bg-teal-50/40 transition-all">
                <Upload size={22} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Tap to upload or take a photo</span>
                <span className="text-xs text-slate-400">A clear, focused shot of the label works best</span>
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleScanFile(f); }} />
              </label>
            ) : (
              <div className="flex items-start gap-4">
                <img src={scanPreview} alt="Medicine label" className="w-28 h-28 object-cover rounded-xl border border-slate-200" />
                <div className="flex-1">
                  {scanning && (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                      Reading label…
                    </p>
                  )}
                  {!scanning && scanApplied && (
                    <p className="text-sm text-emerald-600 flex items-center gap-2">
                      <CheckCircle size={16} /> Details filled in below — check any fields marked "Not detected."
                    </p>
                  )}
                  {!scanning && scanError && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} /> {scanError}
                    </p>
                  )}
                  <label className="inline-block mt-3 text-xs font-medium text-slate-500 hover:text-slate-700 underline cursor-pointer">
                    Use a different photo
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleScanFile(f); }} />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Medicine Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormInput label="Medicine Name" name="name" required aiMissing={aiMissingFields.has("name")} placeholder="Paracetamol" form={form} errors={errors} onChange={set} />
            <FormInput label="Generic Name" name="genericName" aiMissing={aiMissingFields.has("genericName")} placeholder="Acetaminophen" form={form} errors={errors} onChange={set} />
            <FormSelect label="Medicine Type" name="type" options={medicineTypes} aiMissing={aiMissingFields.has("type")} form={form} onChange={set} />
            <FormInput label="Strength" name="strength" required aiMissing={aiMissingFields.has("strength")} placeholder="500mg" form={form} errors={errors} onChange={set} />
            <FormInput label="Dosage Instructions" name="dosage" aiMissing={aiMissingFields.has("dosage")} placeholder="1 tablet twice daily" form={form} errors={errors} onChange={set} />
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Quantity" name="quantity" type="number" required aiMissing={aiMissingFields.has("quantity")} placeholder="30" form={form} errors={errors} onChange={set} />
              <FormSelect label="Unit" name="unit" options={units} form={form} onChange={set} />
            </div>
            <FormInput label="Batch Number" name="batchNumber" aiMissing={aiMissingFields.has("batchNumber")} placeholder="BT-20240001" form={form} errors={errors} onChange={set} />
            <FormInput label="Manufacturing Date" name="manufacturingDate" type="date" aiMissing={aiMissingFields.has("manufacturingDate")} form={form} errors={errors} onChange={set} />
            <FormInput label="Expiry Date" name="expiryDate" type="date" required aiMissing={aiMissingFields.has("expiryDate")} form={form} errors={errors} onChange={set} />
            <FormInput label="Refill Threshold" name="refillThreshold" type="number" placeholder="10" form={form} errors={errors} onChange={set} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => set("prescriptionRequired", !form.prescriptionRequired)}
              className={`relative w-10 h-6 rounded-full transition-all ${form.prescriptionRequired ? "bg-teal-600" : "bg-slate-200"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.prescriptionRequired ? "left-5" : "left-1"}`} />
            </button>
            <span className="text-sm text-slate-700">Prescription Required</span>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              placeholder="Any special instructions…"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none" />
          </div>
        </div>

        {!isEdit && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Reminder Settings</h2>
              <button type="button" onClick={() => set("enableReminder", !form.enableReminder)}
                className={`relative w-10 h-6 rounded-full transition-all ${form.enableReminder ? "bg-teal-600" : "bg-slate-200"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.enableReminder ? "left-5" : "left-1"}`} />
              </button>
            </div>
            {form.enableReminder ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect label="Frequency" name="frequency" options={frequencies} form={form} onChange={set} />
                <FormInput label="Reminder Time" name="reminderTime" type="time" form={form} errors={errors} onChange={set} />
                <FormInput label="Start Date" name="startDate" type="date" form={form} errors={errors} onChange={set} />
                <FormInput label="End Date" name="endDate" type="date" form={form} errors={errors} onChange={set} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">Enable to receive alerts when to take this medicine.</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : isEdit ? "Update Medicine" : "Save Medicine"}
          </button>
        </div>
      </form>
    </div>
  );
}