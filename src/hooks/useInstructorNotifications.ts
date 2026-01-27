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
}

export function useInstructorNotifications(instructorId: string | undefined) {
  const [notifications, setNotifications] = useState<InstructorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

      // Cast the data to our type
      const typedData = (data || []) as unknown as InstructorNotification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel("instructor-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instructor_notifications",
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from("instructor_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
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
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [instructorId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
