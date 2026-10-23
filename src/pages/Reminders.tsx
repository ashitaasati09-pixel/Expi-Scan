import { useState } from "react";
import { BellRing, Pill, Clock, AlertTriangle, RefreshCw, Plus, X, Trash2, Edit2 } from "lucide-react";
import { useReminders } from "../hooks/useReminders";
import { useMedicines } from "../hooks/useMedicines";
import type { ReminderType } from "../lib/types";
import { todayStr } from "../lib/utils";

type Tab = "medicine" | "expiry" | "refill";

export default function Reminders() {
  const { reminders, add, update, remove } = useReminders();
  const { medicines } = useMedicines();
  const [tab, setTab] = useState<Tab>("medicine");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    medicineId: "", type: "medicine" as ReminderType,
    time: "08:00", frequency: "daily" as any,
    startDate: todayStr(), endDate: "",
    notificationMethod: ["push"] as ("push" | "email")[],
  });

  const filtered = reminders.filter(r => r.type === tab);
  const tabIcon = (t: Tab) => t === "medicine" ? <Pill size={14} /> : t === "expiry" ? <AlertTriangle size={14} /> : <RefreshCw size={14} />;
  const typeColor = (t: string) => t === "medicine" ? "bg-teal-100 text-teal-700" : t === "expiry" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700";

  const handleAdd = () => {
    if (!form.medicineId && medicines.length > 0) {
      form.medicineId = medicines[0]._id;
    }
    const med = medicines.find(m => m._id === form.medicineId) || medicines[0];
    add({
      ...form,
      medicineId: form.medicineId || medicines[0]?._id || "",
      medicineName: medicines.find(m => m._id === form.medicineId)?.name || medicines[0]?.name || "Unknown",
    });
    setShowAdd(false);
  };

  const toggleNotifMethod = (m: "push" | "email") => {
    setForm(f => ({
      ...f,
      notificationMethod: f.notificationMethod.includes(m)
        ? f.notificationMethod.filter(x => x !== m)
        : [...f.notificationMethod, m],
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
          <p className="text-slate-500 text-sm mt-0.5">{reminders.filter(r => r.enabled).length} active reminder{reminders.filter(r => r.enabled).length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
          <Plus size={16} /> Add Reminder
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {(["medicine", "expiry", "refill"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {tabIcon(t)} {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BellRing size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No {tab} reminders</h3>
          <p className="text-slate-400 text-sm mb-4">Add a reminder to stay on track.</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-teal-700">
            <Plus size={16} /> Add Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r._id} className={`bg-white rounded-2xl border transition-all ${r.enabled ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
              <div className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor(r.type)}`}>
                  {tabIcon(tab)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-800">{r.medicineName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${typeColor(r.type)}`}>{r.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={12} /> {r.time}</span>
                    <span className="capitalize">{r.frequency}</span>
                    {r.startDate && <span>{r.startDate}{r.endDate ? ` → ${r.endDate}` : ""}</span>}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {r.notificationMethod.map(m => (
                      <span key={m} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{m === "push" ? "📱 Push" : "📧 Email"}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => remove(r._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  <button onClick={() => update(r._id, { enabled: !r.enabled })}
                    className={`relative w-10 h-6 rounded-full transition-all ${r.enabled ? "bg-teal-600" : "bg-slate-200"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${r.enabled ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Add Reminder</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Medicine</label>
                {medicines.length === 0 ? (
                  <p className="text-sm text-slate-400 bg-slate-50 rounded-xl px-3 py-2.5">No medicines added yet. Add a medicine first.</p>
                ) : (
                  <select value={form.medicineId} onChange={e => setForm(f => ({ ...f, medicineId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-400">
                    <option value="">Select medicine…</option>
                    {medicines.map(m => <option key={m._id} value={m._id}>{m.name} {m.strength}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reminder Type</label>
                <div className="flex gap-2">
                  {(["medicine", "expiry", "refill"] as ReminderType[]).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize border transition-all
                        ${form.type === t ? "bg-teal-600 text-white border-teal-600" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-400">
                    {["once", "daily", "weekly", "monthly"].map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notification Method</label>
                <div className="flex gap-3">
                  {(["push", "email"] as const).map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.notificationMethod.includes(m)} onChange={() => toggleNotifMethod(m)} className="accent-teal-600" />
                      <span className="text-sm text-slate-700">{m === "push" ? "📱 Push" : "📧 Email"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={medicines.length === 0}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
