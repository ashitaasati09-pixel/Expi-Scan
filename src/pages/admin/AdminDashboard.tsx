import { Link } from "react-router-dom";
import { Users, Pill, FileText, RefreshCw, MapPin, Bell, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  { label: "Total Users", value: "1,284", change: "+12%", up: true, icon: Users, color: "bg-blue-50 text-blue-600", iconBg: "bg-blue-100" },
  { label: "Total Medicines", value: "8,430", change: "+5%", up: true, icon: Pill, color: "bg-teal-50 text-teal-600", iconBg: "bg-teal-100" },
  { label: "Expiring Soon", value: "342", change: "+8%", up: false, icon: Bell, color: "bg-amber-50 text-amber-600", iconBg: "bg-amber-100" },
  { label: "Expired", value: "89", change: "-3%", up: true, icon: Pill, color: "bg-red-50 text-red-600", iconBg: "bg-red-100" },
  { label: "Prescriptions", value: "2,156", change: "+20%", up: true, icon: FileText, color: "bg-violet-50 text-violet-600", iconBg: "bg-violet-100" },
  { label: "Refill Requests", value: "634", change: "+15%", up: true, icon: RefreshCw, color: "bg-emerald-50 text-emerald-600", iconBg: "bg-emerald-100" },
];

const weeklyData = [
  { day: "Mon", prescriptions: 42, refills: 18, users: 8 },
  { day: "Tue", prescriptions: 58, refills: 24, users: 12 },
  { day: "Wed", prescriptions: 35, refills: 15, users: 6 },
  { day: "Thu", prescriptions: 71, refills: 31, users: 15 },
  { day: "Fri", prescriptions: 64, refills: 28, users: 11 },
  { day: "Sat", prescriptions: 28, refills: 10, users: 4 },
  { day: "Sun", prescriptions: 22, refills: 8, users: 3 },
];

const recentUsers = [
  { name: "James Harper", email: "james@email.com", medicines: 5, joined: "2024-09-07" },
  { name: "Maria Santos", email: "maria@email.com", medicines: 8, joined: "2024-09-06" },
  { name: "Kevin Liu", email: "kevin@email.com", medicines: 3, joined: "2024-09-05" },
  { name: "Priya Nair", email: "priya@email.com", medicines: 12, joined: "2024-09-04" },
  { name: "Tom Wilson", email: "tom@email.com", medicines: 6, joined: "2024-09-03" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">Admin Panel</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">ExpiScan system overview · Sep 8, 2024</p>
          </div>
          <Link to="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 hover:bg-slate-100 rounded-xl">
            <ArrowLeft size={15} /> User View
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-slate-100`}>
              <div className={`w-8 h-8 ${s.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={15} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {s.change}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          {/* Weekly activity */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Weekly Activity</h3>
            <div className="w-full" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="prescriptions" fill="#0d9488" radius={[4, 4, 0, 0]} name="Prescriptions" />
                  <Bar dataKey="refills" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Refills" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent users */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Recent Users</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {recentUsers.map(u => (
                <div key={u.email} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
                    {u.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-teal-600">{u.medicines} meds</p>
                    <p className="text-xs text-slate-400">{u.joined}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Users", icon: Users, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { label: "Medicines", icon: Pill, color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
            { label: "Prescriptions", icon: FileText, color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
            { label: "Medical Stores", icon: MapPin, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
            { label: "Refill Requests", icon: RefreshCw, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
            { label: "Notifications", icon: Bell, color: "bg-red-50 text-red-700 hover:bg-red-100" },
          ].map(item => (
            <button key={item.label}
              className={`${item.color} flex flex-col items-center gap-2 p-4 rounded-2xl text-sm font-medium transition-all`}>
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
