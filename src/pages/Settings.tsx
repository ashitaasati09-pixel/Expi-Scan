import { useState } from "react";
import { User, Bell, Globe, Palette, Shield, ChevronRight } from "lucide-react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative w-10 h-6 rounded-full transition-all ${checked ? "bg-teal-600" : "bg-slate-200"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${checked ? "left-5" : "left-1"}`} />
    </button>
  );
}

function SettingRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const [s, setS] = useState({
    medicineReminders: true,
    expiryAlerts: true,
    refillAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    darkMode: false,
    twoFactor: false,
    dataSharing: false,
  });
  const toggle = (k: keyof typeof s) => setS(prev => ({ ...prev, [k]: !prev[k] }));

  const sections = [
    {
      icon: Bell, title: "Notifications", color: "bg-amber-100 text-amber-600",
      rows: [
        { key: "medicineReminders", label: "Medicine Reminders", desc: "Daily alerts to take your medicine on time" },
        { key: "expiryAlerts", label: "Expiry Alerts", desc: "Warnings when medicines are about to expire" },
        { key: "refillAlerts", label: "Refill Reminders", desc: "Alerts when stock falls below threshold" },
        { key: "emailNotifications", label: "Email Notifications", desc: "Receive alerts via email" },
        { key: "pushNotifications", label: "Push Notifications", desc: "Browser and mobile push notifications" },
      ],
    },
    {
      icon: Palette, title: "Appearance", color: "bg-violet-100 text-violet-600",
      rows: [
        { key: "darkMode", label: "Dark Mode", desc: "Switch to a darker theme" },
      ],
    },
    {
      icon: Shield, title: "Privacy & Security", color: "bg-teal-100 text-teal-600",
      rows: [
        { key: "twoFactor", label: "Two-Factor Authentication", desc: "Add an extra layer of security" },
        { key: "dataSharing", label: "Anonymous Data Sharing", desc: "Help improve ExpiScan (no personal data)" },
      ],
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure your ExpiScan experience</p>
      </div>

      {/* Account links */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-5 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <User size={16} />
          </div>
          <span className="font-semibold text-slate-800">Account</span>
        </div>
        {[
          { label: "Edit Profile", desc: "Update your name, email, and photo" },
          { label: "Change Password", desc: "Update your account password" },
          { label: "Linked Devices", desc: "Manage devices with app access" },
          { label: "Delete Account", desc: "Permanently remove your account", danger: true },
        ].map(item => (
          <button key={item.label}
            className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${item.danger ? "text-red-600 hover:bg-red-50" : ""}`}>
            <div className="text-left">
              <p className={`text-sm font-medium ${item.danger ? "text-red-600" : "text-slate-800"}`}>{item.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            <ChevronRight size={15} className="text-slate-300" />
          </button>
        ))}
      </div>

      {sections.map(section => (
        <div key={section.title} className="bg-white rounded-2xl border border-slate-200 mb-5 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${section.color}`}>
              <section.icon size={16} />
            </div>
            <span className="font-semibold text-slate-800">{section.title}</span>
          </div>
          <div className="px-5 divide-y divide-slate-50">
            {section.rows.map(row => (
              <SettingRow
                key={row.key}
                label={row.label}
                desc={row.desc}
                checked={s[row.key as keyof typeof s]}
                onChange={() => toggle(row.key as keyof typeof s)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Language */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Globe size={16} />
          </div>
          <span className="font-semibold text-slate-800">Application</span>
        </div>
        <div className="px-5 py-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
          <select className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-400">
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">ExpiScan v1.0.0 · © 2024 All rights reserved</p>
    </div>
  );
}
