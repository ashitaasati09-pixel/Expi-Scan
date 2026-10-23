import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/notificationService";
import type { Notification } from "../lib/types";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) return;
    const res = notificationService.getAll(user._id);
    if (res.success) setNotifications(res.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const markRead = useCallback((id: string) => {
    if (!user) return;
    notificationService.markRead(user._id, id);
    refresh();
  }, [user, refresh]);

  const markAllRead = useCallback(() => {
    if (!user) return;
    notificationService.markAllRead(user._id);
    refresh();
  }, [user, refresh]);

  const remove = useCallback((id: string) => {
    if (!user) return;
    notificationService.deleteOne(user._id, id);
    refresh();
  }, [user, refresh]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, refresh, markRead, markAllRead, remove };
}
