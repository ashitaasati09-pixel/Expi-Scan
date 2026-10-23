import { Link } from "react-router-dom";
import { Pill, AlertTriangle, XCircle, RefreshCw, PlusCircle, FileText, BellRing, MapPin, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMedicines } from "../hooks/useMedicines";
import { useNotifications } from "../hooks/useNotifications";
import { useReminders } from "../hooks/useReminders";
import { getPendingRefillCount } from "../services/refillService";
import StatusBadge from "../components/StatusBadge";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = { safe: "#22c55e", "expiring-soon": "#f59e0b", expired: "#ef4444" };

export default function Dashboard() {
  const { user } = useAuth();
  const { medicines, stats, loading } = useMedicines();
  const { notifications, unreadCount } = useNotifications();
  const { reminders } = useReminders();
  const pendingRefills = user ? getPendingRefillCount(user._id) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const urgentNotifs = notifications.filter(n => !n.read && n.severity === "danger");
  const expiringMeds = medicines.filter(m => m.status === "expiring-soon" || m.status === "expired");

  const pieData = [
    { name: "Safe", value: stats?.safe ?? 0, color: COLORS.safe },
    { name: "Expiring Soon", value: stats?.expiringSoon ?? 0, color: COLORS["expiring-soon"] },
    { name: "Expired", value: stats?.expired ?? 0, color: COLORS.expired },
  ].filter(d => d.value > 0);

  const summaryCards = [
    { label: "Total Medicines", value: stats?.total ?? 0, icon: Pill, bg: "bg-teal-50", iconBg: "bg-teal-100", iconColor: "text-teal-600", border: "border-teal-100" },
    { label: "Expiring Soon", value: stats?.expiringSoon ?? 0, icon: AlertTriangle, bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600", border: "border-amber-100" },
    { label: "Expired", value: stats?.expired ?? 0, icon: XCircle, bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600", border: "border-red-100" },
    { label: "Refills Needed", value: pendingRefills, icon: RefreshCw, bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600", border: "border-blue-100" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user?.name.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Stay on top of your medicines and never miss an expiry date.</p>
        </div>
        <Link to="/add-medicine"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm">
          <PlusCircle size={16} /> Add Medicine
        </Link>
      </div>

      {urgentNotifs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">{urgentNotifs.length} urgent medicine alert{urgentNotifs.length !== 1 ? "s" : ""} require attention</p>
            <p className="text-sm text-red-600 truncate">{urgentNotifs[0]?.message}</p>
          </div>
          <Link to="/notifications" className="text-red-600 hover:text-red-700 text-xs font-semibold flex-shrink-0">View →</Link>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4 sm:p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.iconBg} p-2 rounded-xl`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
              <TrendingUp size={14} className="text-slate-300" />
            </div>
            {loading ? (
              <div className="h-8 w-10 bg-slate-200 animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Expiry overview chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Expiry Overview</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={112} height={112}>
                <Pie data={pieData} innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} medicines`, ""]} />
              </PieChart>
              <div className="space-y-2 flex-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-slate-400">
              <Pill size={28} className="mb-2 opacity-40" />
              <p className="text-xs">No medicines yet</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: PlusCircle, label: "Add Medicine", to: "/add-medicine", color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
              { icon: FileText, label: "Upload Rx", to: "/prescriptions", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { icon: BellRing, label: "Set Reminder", to: "/reminders", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
              { icon: MapPin, label: "Find Store", to: "/medical-stores", color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className={`${a.color} flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all`}>
                <a.icon size={20} />
                <span className="text-xs font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's reminders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Today's Reminders</h3>
            <Link to="/reminders" className="text-xs text-teal-600 font-medium hover:text-teal-700">View all</Link>
          </div>
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <BellRing size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No reminders set</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.slice(0, 3).map(r => (
                <div key={r._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.medicineName}</p>
                    <p className="text-xs text-slate-500">{r.time} · {r.type}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${r.enabled ? "bg-emerald-400" : "bg-slate-300"}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Medicines requiring attention */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Medicines Requiring Attention</h3>
            <p className="text-xs text-slate-500 mt-0.5">Expired and expiring soon</p>
          </div>
          <Link to="/medicines" className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
          </div>
        ) : expiringMeds.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Pill size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">All medicines are safe</p>
            <p className="text-xs mt-0.5">No medicines expiring within 30 days</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {expiringMeds.slice(0, 5).map(med => (
              <div key={med._id} className="px-5 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${med.status === "expired" ? "bg-red-100" : "bg-amber-100"}`}>
                  <Pill size={18} className={med.status === "expired" ? "text-red-600" : "text-amber-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                    <StatusBadge status={med.status} />
                  </div>
                  <p className="text-xs text-slate-500">{med.strength} · {med.type} · {med.quantity} {med.unit}</p>
                  <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${med.status === "expired" ? "bg-red-500" : "bg-amber-500"}`}
                      style={{ width: `${Math.max(2, Math.min(100, (med.daysRemaining / 365) * 100))}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${med.daysRemaining < 0 ? "text-red-600" : "text-amber-600"}`}>
                    {med.daysRemaining < 0 ? `${Math.abs(med.daysRemaining)}d ago` : `${med.daysRemaining}d left`}
                  </p>
                  <Link to={`/medicines/${med._id}`}
                    className="inline-block mt-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium">
                    Refill →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
