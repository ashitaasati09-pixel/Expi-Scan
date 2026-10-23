import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPrescriptions, uploadPrescription, updatePrescription,
  deletePrescription, addExtractedMedicines
} from "../services/prescriptionService";
import type { Prescription, ExtractedMedicine } from "../lib/types";

export function usePrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const res = await getPrescriptions(user._id);
    if (res.success) setPrescriptions(res.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = useCallback(async (file: File) => {
    if (!user) return { success: false, error: "Not authenticated." };
    setLoading(true);
    const res = await uploadPrescription(user._id, file);
    await refresh();
    return res;
  }, [user, refresh]);

  const update = useCallback(async (id: string, patch: any) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = await updatePrescription(user._id, id, patch);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  const approveMedicines = useCallback(async (id: string, meds: ExtractedMedicine[]) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = await addExtractedMedicines(user._id, id, meds);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  const remove = useCallback(async (id: string) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = await deletePrescription(user._id, id);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  return { prescriptions, loading, refresh, upload, update, approveMedicines, remove };
}