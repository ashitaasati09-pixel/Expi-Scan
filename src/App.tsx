import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import AddMedicine from "./pages/AddMedicine";
import MedicineDetail from "./pages/MedicineDetail";
import Prescriptions from "./pages/Prescriptions";
import Reminders from "./pages/Reminders";
import Notifications from "./pages/Notifications";
import MedicalStores from "./pages/MedicalStores";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { usePWAUpdate } from "./hooks/usePWAUpdate"; // ← NEW

export default function App() {
  const { needsRefresh, offlineReady, update, dismissOfflineReady } = usePWAUpdate(); // ← NEW

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/medicines/:id" element={<MedicineDetail />} />
            <Route path="/medicines/:id/edit" element={<AddMedicine />} />
            <Route path="/add-medicine" element={<AddMedicine />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/medical-stores" element={<MedicalStores />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>

      {/* ── NEW: PWA update / offline-ready toasts ── */}
      {needsRefresh && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 shadow-lg flex items-center gap-3">
          <span className="text-sm">New version available</span>
          <button
            onClick={update}
            className="text-sm font-medium underline underline-offset-2"
          >
            Reload
          </button>
        </div>
      )}
      {offlineReady && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-emerald-600 text-white px-4 py-3 shadow-lg text-sm flex items-center gap-3">
          Expi-Scan is ready to work offline
          <button
            onClick={dismissOfflineReady}
            className="underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </AuthProvider>
  );
}