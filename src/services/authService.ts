import type { User, ApiResponse } from "../lib/types";

const BASE = "/api/auth";

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function register(
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<ApiResponse<{ user: Omit<User, "passwordHash">; token: string }>> {
  return request("/register", { method: "POST", body: JSON.stringify({ name, email, phone, password }) });
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<{ user: Omit<User, "passwordHash">; token: string }>> {
  return request("/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function logout(): Promise<void> {
  await request("/logout", { method: "POST" });
}

export async function getProfile(): Promise<ApiResponse<Omit<User, "passwordHash">>> {
  return request("/profile");
}

export async function updateProfile(
  patch: Partial<Pick<User, "name" | "phone" | "dob" | "address" | "profileImage">>
): Promise<ApiResponse<Omit<User, "passwordHash">>> {
  return request("/profile", { method: "PATCH", body: JSON.stringify(patch) });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<null>> {
  return request("/profile/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}