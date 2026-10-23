import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
