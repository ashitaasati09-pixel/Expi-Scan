import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const initials = user?.name.split(" ").map(n => n[0]).join("") ?? "?";
  const firstName = user?.name.split(" ")[0] ?? "";

  const handleLogout = () => { setProfileOpen(false); logout(); navigate("/login"); };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-sm hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search medicines, prescriptions…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all" />
      </div>

      <div className="flex-1 lg:hidden" />

      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Link>

        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">{firstName}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link to="/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <User size={15} /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings size={15} /> Settings
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
