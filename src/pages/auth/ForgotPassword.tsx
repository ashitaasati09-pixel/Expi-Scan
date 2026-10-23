import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-200">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Expi<span className="text-teal-600">Scan</span></h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm mb-6">
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
              </p>
              <Link to="/login" className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-center transition-all">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Forgot password?</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading || !email}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</> : "Send Reset Link"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Remember your password?{" "}
                <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
