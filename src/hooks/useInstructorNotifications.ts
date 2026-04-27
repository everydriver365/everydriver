import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorNotification {
  id: string;
  instructor_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  snoozed_until: string | null;
}

export function useInstructorNotifications(instructorId: string | undefined) {
  const [allNotifications, setAllNotifications] = useState<InstructorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Tick every 60s so snoozed rows resurface automatically without a refetch.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!instructorId) return;
    try {
      const { data, error } = await supabase
        .from("instructor_notifications")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAllNotifications((data ?? []) as unknown as InstructorNotification[]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!instructorId) return;
    const channel = supabase
      .channel("instructor-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructor_notifications", filter: `instructor_id=eq.${instructorId}` },
        () => fetchNotifications(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [instructorId, fetchNotifications]);

  const isSnoozed = useCallback(
    (n: InstructorNotification) => !!n.snoozed_until && new Date(n.snoozed_until).getTime() > now,
    [now],
  );

  // Active list excludes currently-snoozed rows.
  const notifications = allNotifications.filter(n => !isSnoozed(n));
  const snoozed = allNotifications.filter(isSnoozed);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const snoozedCount = snoozed.length;

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase.from("instructor_notifications").update({ is_read: true }).eq("id", notificationId);
      fetchNotifications();
    } catch (error) { console.error("Error marking notification as read:", error); }
  }, [fetchNotifications]);

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      await supabase.from("instructor_notifications").update({ is_read: false }).eq("id", notificationId);
      fetchNotifications();
    } catch (error) { console.error("Error marking notification as unread:", error); }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!instructorId) return;
    try {
      await supabase
        .from("instructor_notifications")
        .update({ is_read: true })
        .eq("instructor_id", instructorId)
        .eq("is_read", false);
      fetchNotifications();
    } catch (error) { console.error("Error marking all as read:", error); }
  }, [instructorId, fetchNotifications]);

  const snoozeNotification = useCallback(async (notificationId: string, until: Date) => {
    try {
      await supabase
        .from("instructor_notifications")
        .update({ snoozed_until: until.toISOString(), is_read: true } as never)
        .eq("id", notificationId);
      fetchNotifications();
    } catch (error) { console.error("Error snoozing notification:", error); }
  }, [fetchNotifications]);

  const unsnoozeNotification = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from("instructor_notifications")
        .update({ snoozed_until: null, is_read: false } as never)
        .eq("id", notificationId);
      fetchNotifications();
    } catch (error) { console.error("Error unsnoozing notification:", error); }
  }, [fetchNotifications]);

  return {
    notifications,
    snoozed,
    unreadCount,
    snoozedCount,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    snoozeNotification,
    unsnoozeNotification,
    refetch: fetchNotifications,
  };
}
