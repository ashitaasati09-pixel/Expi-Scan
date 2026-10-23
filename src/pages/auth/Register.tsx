import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Activity, Mail, Lock, User, Phone, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", terms: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.includes("@")) e.email = "Enter a valid email.";
    if (!form.phone) e.phone = "Phone number is required.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    if (!form.terms) e.terms = "You must accept the terms.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setApiError(""); setLoading(true);
    const res = await register(form.name, form.email, form.phone, form.password);
    setLoading(false);
    if (res.success) navigate("/dashboard");
    else setApiError(res.error ?? "Registration failed.");
  };

  const fieldClass = (key: string) =>
    `w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all
    ${errors[key] ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal-400 focus:ring-teal-100"}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-200">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Expi<span className="text-teal-600">Scan</span></h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create Account</h2>

          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle size={16} /> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full Name", key: "name", type: "text", Icon: User, placeholder: "Sarah Mitchell" },
              { label: "Email Address", key: "email", type: "email", Icon: Mail, placeholder: "sarah@example.com" },
              { label: "Phone Number", key: "phone", type: "tel", Icon: Phone, placeholder: "+1 (555) 234-7890" },
            ].map(({ label, key, type, Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={type} value={form[key as keyof typeof form] as string}
                    onChange={e => set(key, e.target.value)} placeholder={placeholder}
                    className={"pl-10 pr-4 " + fieldClass(key)} />
                </div>
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPw ? "text" : "password"} value={form.password}
                  onChange={e => set("password", e.target.value)} placeholder="Min. 8 characters"
                  className={"pl-10 pr-10 " + fieldClass("password")} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="Repeat password"
                  className={"pl-10 pr-4 " + fieldClass("confirm")} />
              </div>
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.terms} onChange={e => set("terms", e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-teal-600" />
                <span className="text-sm text-slate-600">I agree to the <a href="#" className="text-teal-600 hover:underline">Terms of Service</a> and <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a></span>
              </label>
              {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
