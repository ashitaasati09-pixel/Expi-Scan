import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Pill, PlusCircle, FileText, Bell,
  MapPin, BellRing, User, Settings, LogOut, X, Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/medicines", icon: Pill, label: "My Medicines" },
  { to: "/add-medicine", icon: PlusCircle, label: "Add Medicine" },
  { to: "/prescriptions", icon: FileText, label: "Prescriptions" },
  { to: "/reminders", icon: BellRing, label: "Reminders" },
  { to: "/medical-stores", icon: MapPin, label: "Medical Stores" },
  { to: "/notifications", icon: Bell, label: "Notifications", badge: true },
];

const bottomItems = [
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = () => { logout(); navigate("/login"); };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
      isActive
        ? "bg-teal-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-40 flex flex-col transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 leading-none block">Expi</span>
              <span className="text-lg font-bold text-teal-600 leading-none block -mt-0.5">Scan</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-0.5 border-t border-slate-100 pt-3">
          {bottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
              <Icon size={18} className="flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150">
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
