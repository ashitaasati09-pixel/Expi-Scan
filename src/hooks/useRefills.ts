import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getRefillRequests, createRefillRequest, deleteRefillRequest } from "../services/refillService";
import type { RefillRequest } from "../lib/types";

export function useRefills() {
  const { user } = useAuth();
  const [refills, setRefills] = useState<RefillRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) return;
    const res = getRefillRequests(user._id);
    if (res.success) setRefills(res.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: any) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = createRefillRequest(user._id, input);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  const remove = useCallback((id: string) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = deleteRefillRequest(user._id, id);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  return { refills, loading, refresh, add, remove };
}
