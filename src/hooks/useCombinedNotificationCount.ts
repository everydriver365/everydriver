import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useQueryClient } from "@tanstack/react-query";

export function useCombinedNotificationCount(instructorId: string | undefined) {
  const { data: swapCount = 0 } = useTestSwapNotifications(instructorId);
  const [messageCount, setMessageCount] = useState(0);
  const [visitorChatCount, setVisitorChatCount] = useState(0);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  useEffect(() => {
    if (!instructorId) return;

    const fetchCounts = async () => {
      // Unread pupil messages
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .eq("instructor_id", instructorId);
      if (convos && convos.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", convos.map(c => c.id))
          .eq("sender_type", "pupil")
          .is("read_at", null);
        setMessageCount(count || 0);
      }

      // Unread visitor chats
      const { count: visitorCount } = await supabase
        .from("live_chat_messages")
        .select("*, live_chat_sessions!inner(instructor_id, status)", { count: "exact", head: true })
        .eq("live_chat_sessions.instructor_id", instructorId)
        .eq("live_chat_sessions.status", "active")
        .eq("sender_type", "visitor")
        .is("read_at", null);
      setVisitorChatCount(visitorCount || 0);

      // Pending job enquiries
      const { count: jobCount } = await supabase
        .from("course_enquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingJobsCount(jobCount || 0);
    };

    fetchCounts();

    const ch1 = supabase.channel("combined-notif-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchCounts)
      .subscribe();
    const ch2 = supabase.channel("combined-notif-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_messages" }, fetchCounts)
      .subscribe();
    const ch3 = supabase.channel("combined-notif-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "course_enquiries" }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
    };
  }, [instructorId]);

  const total = swapCount + messageCount + visitorChatCount + pendingJobsCount;

  return { total, swapCount, messageCount, visitorChatCount, pendingJobsCount };
}
