import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pill, Edit2, Trash2, BellRing, RefreshCw, AlertTriangle, Calendar, Package, Hash, FileText } from "lucide-react";
import { useMedicine } from "../hooks/useMedicines";
import { useMedicines } from "../hooks/useMedicines";
import StatusBadge from "../components/StatusBadge";

export default function MedicineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { medicine, loading } = useMedicine(id ?? "");
  const { remove } = useMedicines();

  const handleDelete = async () => {
    if (!id) return;
    await remove(id);
    navigate("/medicines");
  };

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="h-8 w-32 bg-slate-100 animate-pulse rounded" />
        <div className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    </div>
  );

  if (!medicine) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Pill size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="font-semibold text-slate-700">Medicine not found</p>
        <Link to="/medicines" className="text-teal-600 text-sm hover:underline mt-2 block">← Back to medicines</Link>
      </div>
    </div>
  );

  const expiryPct = Math.max(2, Math.min(100, (Math.max(0, medicine.daysRemaining) / 365) * 100));
  const barColor = medicine.daysRemaining < 0 ? "bg-red-500" : medicine.daysRemaining <= 7 ? "bg-amber-500" : medicine.daysRemaining <= 30 ? "bg-yellow-400" : "bg-emerald-500";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Medicines
      </button>

      {medicine.status === "expired" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <AlertTriangle size={18} className="text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">This medicine has expired</p>
            <p className="text-xs text-red-600">Expired {Math.abs(medicine.daysRemaining)} days ago on {medicine.expiryDate}. Do not consume. Please dispose safely.</p>
          </div>
        </div>
      )}
      {medicine.status === "expiring-soon" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <AlertTriangle size={18} className="text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Expiring in {medicine.daysRemaining} day{medicine.daysRemaining !== 1 ? "s" : ""}</p>
            <p className="text-xs text-amber-600">Order a refill before {medicine.expiryDate} to avoid running out.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                ${medicine.status === "expired" ? "bg-red-100" : medicine.status === "expiring-soon" ? "bg-amber-100" : "bg-teal-100"}`}>
                <Pill size={26} className={medicine.status === "expired" ? "text-red-600" : medicine.status === "expiring-soon" ? "text-amber-600" : "text-teal-600"} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">{medicine.name}</h1>
                  <StatusBadge status={medicine.status} size="md" />
                  {medicine.source === "scan" && (
                    <span className="bg-violet-50 text-violet-600 text-xs px-2 py-0.5 rounded-full border border-violet-100">Digitally Extracted</span>
                  )}
                </div>
                <p className="text-slate-500 mt-0.5">{medicine.genericName} · {medicine.strength} · {medicine.type}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Package, label: "Dosage", value: medicine.dosage || "—" },
                { icon: Package, label: "Quantity", value: `${medicine.quantity} ${medicine.unit}` },
                { icon: Hash, label: "Batch Number", value: medicine.batchNumber || "—" },
                { icon: Calendar, label: "Manufacturing Date", value: medicine.manufacturingDate || "—" },
                { icon: Calendar, label: "Expiry Date", value: medicine.expiryDate },
                { icon: Package, label: "Refill Threshold", value: `${medicine.refillThreshold} ${medicine.unit}` },
                { icon: FileText, label: "Prescription Required", value: medicine.prescriptionRequired ? "Yes" : "No" },
                { icon: Pill, label: "Source", value: medicine.source === "scan" ? "Digitally Extracted" : "Manual Entry" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <item.icon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {medicine.notes && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 mb-1">Notes</p>
                <p className="text-sm text-blue-800">{medicine.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Expiry Status</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Manufacturing</span>
              <span>Expiry</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${expiryPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-slate-400">{medicine.manufacturingDate || "—"}</span>
              <span className={`font-semibold ${medicine.daysRemaining < 0 ? "text-red-600" : medicine.daysRemaining <= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                {medicine.daysRemaining < 0 ? `Expired ${Math.abs(medicine.daysRemaining)} days ago` : `${medicine.daysRemaining} days remaining`}
              </span>
              <span className="text-slate-400">{medicine.expiryDate}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Actions</h3>
            <div className="space-y-2">
              <Link to={`/medicines/${medicine._id}/edit`}
                className="w-full flex items-center gap-3 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-all">
                <Edit2 size={16} /> Edit Medicine
              </Link>
              <Link to="/reminders"
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-all">
                <BellRing size={16} /> Set Reminder
              </Link>
              <Link to="/medical-stores"
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-all">
                <RefreshCw size={16} /> Request Refill
              </Link>
              <button onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all">
                <Trash2 size={16} /> Delete Medicine
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Stock Status</h3>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-slate-900">{medicine.quantity}</p>
              <p className="text-sm text-slate-500">{medicine.unit} remaining</p>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${medicine.quantity <= medicine.refillThreshold ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (medicine.quantity / Math.max(medicine.refillThreshold * 3, 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Refill threshold: {medicine.refillThreshold} {medicine.unit}</p>
              {medicine.quantity <= medicine.refillThreshold && (
                <p className="text-xs text-red-600 font-medium mt-1">⚠ Refill needed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
