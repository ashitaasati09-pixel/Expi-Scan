import { Bell, AlertTriangle, XCircle, RefreshCw, Pill, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationType, NotificationSeverity } from "../lib/types";

const iconMap: Record<NotificationType, React.ReactNode> = {
  expiry: <AlertTriangle size={16} />,
  expired: <XCircle size={16} />,
  refill: <RefreshCw size={16} />,
  medicine: <Pill size={16} />,
  system: <Bell size={16} />,
};

const colorMap: Record<NotificationSeverity, string> = {
  danger: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
};

const borderMap: Record<NotificationSeverity, string> = {
  danger: "border-l-4 border-red-400",
  warning: "border-l-4 border-amber-400",
  info: "border-l-4 border-blue-200",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const { notifications, loading, unreadCount, markRead, markAllRead, remove } = useNotifications();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 px-3 py-2 hover:bg-teal-50 rounded-xl transition-all">
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bell size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No notifications</h3>
          <p className="text-slate-400 text-sm">You're all caught up! Add medicines to start receiving alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n._id}
              className={`bg-white rounded-2xl border border-slate-200 p-4 transition-all ${borderMap[n.severity]} ${!n.read ? "shadow-sm" : "opacity-75"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[n.severity]}`}>
                  {iconMap[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${!n.read ? "text-slate-900" : "text-slate-700"}`}>{n.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {!n.read && (
                      <button onClick={() => markRead(n._id)} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                        Mark as read
                      </button>
                    )}
                    <button onClick={() => remove(n._id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors ml-auto">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
                {!n.read && <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
