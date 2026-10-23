import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { register, login, logout, getProfile, updateProfile, changePassword } from "../services/authService";
import type { User, ApiResponse } from "../lib/types";
import { seedStores } from "../lib/seed";

interface AuthContextValue {
  user: Omit<User, "passwordHash"> | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<any>>;
  register: (name: string, email: string, phone: string, password: string) => Promise<ApiResponse<any>>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "name" | "phone" | "dob" | "address">>) => Promise<ApiResponse<any>>;
  changePassword: (current: string, next: string) => Promise<ApiResponse<any>>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "passwordHash"> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const res = await getProfile();
    setUser(res.success && res.data ? res.data : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    seedStores();
    loadUser();
  }, [loadUser]);

  const handleLogin = async (email: string, password: string) => {
    const res = await login(email, password);
    if (res.success && res.data) setUser(res.data.user);
    return res;
  };

  const handleRegister = async (name: string, email: string, phone: string, password: string) => {
    const res = await register(name, email, phone, password);
    if (res.success && res.data) setUser(res.data.user);
    return res;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleUpdateProfile = async (patch: Partial<Pick<User, "name" | "phone" | "dob" | "address">>) => {
    const res = await updateProfile(patch);
    if (res.success && res.data) setUser(res.data);
    return res;
  };

  const handleChangePassword = async (current: string, next: string) => {
    return changePassword(current, next);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        changePassword: handleChangePassword,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}