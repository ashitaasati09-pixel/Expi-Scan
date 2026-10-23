import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, PlusCircle, Pill, Eye, Edit2, Trash2, BellRing, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { useMedicines } from "../hooks/useMedicines";
import StatusBadge from "../components/StatusBadge";
import type { Medicine } from "../lib/types";

type SortKey = "name" | "expiryDate" | "quantity";

export default function Medicines() {
  const { medicines, loading, remove } = useMedicines();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("expiryDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = medicines
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.genericName.toLowerCase().includes(search.toLowerCase()))
    .filter(m => statusFilter === "all" || m.status === statusFilter)
    .sort((a: Medicine, b: Medicine) => {
      const va = sortKey === "expiryDate" ? a.daysRemaining : sortKey === "quantity" ? a.quantity : a.name;
      const vb = sortKey === "expiryDate" ? b.daysRemaining : sortKey === "quantity" ? b.quantity : b.name;
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : sortAsc ? <ChevronUp size={14} className="inline ml-0.5" /> : <ChevronDown size={14} className="inline ml-0.5" />;

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await remove(deleteId);
    setDeleting(false);
    setDeleteId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Medicines</h1>
          <p className="text-slate-500 text-sm mt-0.5">{medicines.length} medicine{medicines.length !== 1 ? "s" : ""} in your cabinet</p>
        </div>
        <Link to="/add-medicine"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm">
          <PlusCircle size={16} /> Add Medicine
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 bg-white" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-slate-400" />
          {["all", "safe", "expiring-soon", "expired"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border
                ${statusFilter === s ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
              {s === "all" ? "All" : s === "expiring-soon" ? "Expiring" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="px-5 py-4 border-b border-slate-50 flex items-center gap-4">
              <div className="w-9 h-9 bg-slate-100 animate-pulse rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
                <div className="h-3 w-24 bg-slate-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">{search ? "No medicines found" : "No medicines yet"}</h3>
          <p className="text-slate-400 text-sm mb-6">
            {search ? "Try a different search term." : "Add your first medicine to get started."}
          </p>
          {!search && (
            <Link to="/add-medicine" className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700">
              <PlusCircle size={16} /> Add Your First Medicine
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {[
                    { key: "name", label: "Medicine" },
                    { key: null, label: "Dosage" },
                    { key: "quantity", label: "Qty" },
                    { key: "expiryDate", label: "Expiry" },
                    { key: null, label: "Status" },
                    { key: null, label: "Actions" },
                  ].map((col, i) => (
                    <th key={i}
                      className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide ${col.key ? "cursor-pointer hover:text-slate-800" : ""}`}
                      onClick={() => col.key && toggleSort(col.key as SortKey)}>
                      {col.label}{col.key && <SortIcon k={col.key as SortKey} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(med => (
                  <tr key={med._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                          ${med.status === "expired" ? "bg-red-100" : med.status === "expiring-soon" ? "bg-amber-100" : "bg-teal-100"}`}>
                          <Pill size={16} className={med.status === "expired" ? "text-red-600" : med.status === "expiring-soon" ? "text-amber-600" : "text-teal-600"} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{med.name}</p>
                          <p className="text-xs text-slate-400">{med.genericName} {med.source === "scan" && <span className="ml-1 bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full text-[10px]">Scanned</span>}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{med.dosage}</td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${med.quantity <= med.refillThreshold ? "text-red-600" : "text-slate-700"}`}>{med.quantity}</span>
                      <span className="text-slate-400 text-xs ml-1">{med.unit}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700">{med.expiryDate}</p>
                      <p className={`text-xs ${med.daysRemaining < 0 ? "text-red-500" : med.daysRemaining <= 30 ? "text-amber-500" : "text-slate-400"}`}>
                        {med.daysRemaining < 0 ? `Expired ${Math.abs(med.daysRemaining)}d ago` : `${med.daysRemaining}d left`}
                      </p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={med.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/medicines/${med._id}`} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="View"><Eye size={15} /></Link>
                        <Link to={`/medicines/${med._id}/edit`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit2 size={15} /></Link>
                        <Link to="/reminders" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Reminder"><BellRing size={15} /></Link>
                        <Link to="/medical-stores" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Refill"><RefreshCw size={15} /></Link>
                        <button onClick={() => setDeleteId(med._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(med => (
              <div key={med._id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${med.status === "expired" ? "bg-red-100" : med.status === "expiring-soon" ? "bg-amber-100" : "bg-teal-100"}`}>
                      <Pill size={18} className={med.status === "expired" ? "text-red-600" : med.status === "expiring-soon" ? "text-amber-600" : "text-teal-600"} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{med.name} {med.strength}</p>
                      <p className="text-xs text-slate-400">{med.genericName} · {med.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={med.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-slate-400">Qty: </span><span className={`font-medium ${med.quantity <= med.refillThreshold ? "text-red-600" : "text-slate-700"}`}>{med.quantity} {med.unit}</span></div>
                  <div><span className={`font-medium ${med.daysRemaining < 0 ? "text-red-500" : med.daysRemaining <= 30 ? "text-amber-500" : "text-emerald-600"}`}>
                    {med.daysRemaining < 0 ? `${Math.abs(med.daysRemaining)}d overdue` : `${med.daysRemaining}d remaining`}
                  </span></div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/medicines/${med._id}`} className="flex-1 text-center py-2 bg-teal-50 text-teal-700 text-xs font-medium rounded-lg hover:bg-teal-100">View</Link>
                  <Link to={`/medicines/${med._id}/edit`} className="flex-1 text-center py-2 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100">Edit</Link>
                  <Link to="/medical-stores" className="flex-1 py-2 text-center bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100">Refill</Link>
                  <button onClick={() => setDeleteId(med._id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Medicine</h3>
            <p className="text-slate-500 text-sm text-center mb-6">This will permanently remove the medicine and its associated reminders.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
