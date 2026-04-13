import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

export interface SchoolNotification {
  id: string;
  school_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

const TYPE_TO_PREF_KEY: Record<string, string> = {
  new_booking: "new_bookings",
  payment: "payments",
  cancellation: "cancellations",
  test_result: "test_results",
};

export function useSchoolNotifications(
  schoolId: string | undefined,
  notificationPreferences?: Record<string, boolean> | null
) {
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const isTypeEnabled = useCallback(
    (type: string) => {
      if (!notificationPreferences) return true;
      const prefKey = TYPE_TO_PREF_KEY[type];
      if (!prefKey) return true; // types without a pref mapping are always shown
      return notificationPreferences[prefKey] !== false;
    },
    [notificationPreferences]
  );

  const fetchNotifications = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data } = await supabase
      .from("school_notifications")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(
        (data as unknown as SchoolNotification[]).filter((n) => isTypeEnabled(n.type))
      );
    }
    setLoading(false);
  }, [schoolId, isTypeEnabled]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime: new notifications
  useRealtimeSubscription(
    "school_notifications",
    "INSERT",
    (payload) => {
      const newNotif = payload.new as SchoolNotification;
      if (newNotif.school_id === schoolId && isTypeEnabled(newNotif.type)) {
        setNotifications((prev) => [newNotif, ...prev]);
      }
    },
    { enabled: !!schoolId }
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAsRead = useCallback(
    async (id: string) => {
      await supabase
        .from("school_notifications")
        .update({ read_at: new Date().toISOString() } as any)
        .eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!schoolId) return;
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("school_notifications")
      .update({ read_at: new Date().toISOString() } as any)
      .in("id", unreadIds);
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    );
  }, [schoolId, notifications]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
