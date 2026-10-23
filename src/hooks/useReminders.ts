import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getReminders, createReminder, updateReminder, deleteReminder } from "../services/reminderService";
import type { Reminder } from "../lib/types";

export function useReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) return;
    const res = getReminders(user._id);
    if (res.success) setReminders(res.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: any) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = createReminder(user._id, input);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  const update = useCallback((id: string, patch: any) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = updateReminder(user._id, id, patch);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  const remove = useCallback((id: string) => {
    if (!user) return { success: false, error: "Not authenticated." };
    const res = deleteReminder(user._id, id);
    if (res.success) refresh();
    return res;
  }, [user, refresh]);

  return { reminders, loading, refresh, add, update, remove };
}
