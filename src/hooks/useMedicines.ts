import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMedicines, getMedicine, createMedicine,
  updateMedicine, deleteMedicine, getMedicineStats
} from "../services/medicineService";
import type { Medicine } from "../lib/types";

export function useMedicines() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number; safe: number; expiringSoon: number; expired: number; refillNeeded: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await getMedicines(user._id);
    if (res.success) setMedicines(res.data ?? []);
    else setError(res.error ?? "Failed to load medicines.");
    setStats(await getMedicineStats(user._id));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (input: any, source: "manual" | "scan" = "manual") => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = await createMedicine(user._id, input, source);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  const update = useCallback(async (id: string, patch: any) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = await updateMedicine(user._id, id, patch);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  const remove = useCallback(async (id: string) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = await deleteMedicine(user._id, id);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  return { medicines, loading, error, refresh, add, update, remove, stats };
}

export function useMedicine(id: string) {
  const { user } = useAuth();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    setLoading(true);
    getMedicine(user._id, id).then((res) => {
      if (cancelled) return;
      if (res.success) setMedicine(res.data ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, id]);

  return { medicine, loading };
}