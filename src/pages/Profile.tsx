import { useState, useEffect } from "react";
import { User, Mail, Phone, Calendar, MapPin, Camera, Save, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", dob: "", address: "" });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone || "", dob: user.dob || "", address: user.address || "" });
  }, [user]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    const res = updateProfile(form);
    if (res.success) {
      setEditing(false);
      setMsg({ text: "Profile updated successfully.", type: "success" });
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ text: res.error ?? "Update failed.", type: "error" });
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw) { setPwMsg({ text: "All password fields are required.", type: "error" }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ text: "New passwords do not match.", type: "error" }); return; }
    if (pwForm.newPw.length < 8) { setPwMsg({ text: "New password must be at least 8 characters.", type: "error" }); return; }
    setPwLoading(true);
    const res = await changePassword(pwForm.current, pwForm.newPw);
    setPwLoading(false);
    if (res.success) {
      setPwForm({ current: "", newPw: "", confirm: "" });
      setPwMsg({ text: "Password updated successfully.", type: "success" });
    } else {
      setPwMsg({ text: res.error ?? "Failed to update password.", type: "error" });
    }
    setTimeout(() => setPwMsg(null), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your personal information</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm border ${
          msg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg.text}
        </div>
      )}

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-teal-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
              {user?.name.split(" ").map(n => n[0]).join("") ?? "?"}
            </div>
            <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50">
              <Camera size={13} className="text-slate-500" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">Member since {user?.createdAt?.split("T")[0]}</p>
          </div>
          <div className="ml-auto">
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="px-4 py-2 border border-teal-200 text-teal-700 text-sm font-medium rounded-xl hover:bg-teal-50 transition-all">
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700">
                  <Save size={14} /> Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="font-semibold text-slate-800 mb-4">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: User, label: "Full Name", key: "name", type: "text" },
            { icon: Mail, label: "Email", key: "email", type: "email", readonly: true, value: user?.email },
            { icon: Phone, label: "Phone", key: "phone", type: "tel" },
            { icon: Calendar, label: "Date of Birth", key: "dob", type: "date" },
          ].map(item => (
            <div key={item.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{item.label}</label>
              <div className="relative">
                <item.icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={item.type}
                  value={item.readonly ? (item.value ?? "") : form[item.key as keyof typeof form]}
                  onChange={e => !item.readonly && set(item.key, e.target.value)}
                  disabled={!editing || item.readonly}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all
                    ${editing && !item.readonly ? "border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100" : "border-transparent bg-slate-50 text-slate-700"}`} />
              </div>
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <textarea value={form.address} onChange={e => set("address", e.target.value)} rows={2}
                disabled={!editing}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none resize-none transition-all
                  ${editing ? "border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100" : "border-transparent bg-slate-50 text-slate-700"}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Change Password</h3>
        {pwMsg && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 text-sm border
            ${pwMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {pwMsg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {pwMsg.text}
          </div>
        )}
        <div className="space-y-4">
          {[
            { label: "Current Password", key: "current" },
            { label: "New Password", key: "newPw" },
            { label: "Confirm New Password", key: "confirm" },
          ].map(item => (
            <div key={item.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{item.label}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={pwForm[item.key as keyof typeof pwForm]}
                  onChange={e => setPwForm(f => ({ ...f, [item.key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
              </div>
            </div>
          ))}
          <button onClick={handleChangePassword} disabled={pwLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {pwLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
