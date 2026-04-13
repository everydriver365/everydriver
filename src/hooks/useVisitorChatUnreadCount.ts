import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

export function useVisitorChatUnreadCount(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["visitor-chat-unread-count", instructorId],
    queryFn: async (): Promise<number> => {
      if (!instructorId) return 0;

      try {
        const { count, error } = await supabase
          .from("live_chat_messages")
          .select("*, live_chat_sessions!inner(instructor_id, status)", { count: "exact", head: true })
          .eq("live_chat_sessions.instructor_id", instructorId)
          .eq("live_chat_sessions.status", "active")
          .eq("sender_type", "visitor")
          .is("read_at", null);

        if (error) {
          console.error("Error fetching visitor chat unread count:", error);
          return 0;
        }

        return count || 0;
      } catch (err) {
        console.error("Error in visitor chat unread count query:", err);
        return 0;
      }
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000,
  });

  useRealtimeSubscription(
    "live_chat_messages",
    "*",
    () => {
      queryClient.invalidateQueries({ queryKey: ["visitor-chat-unread-count", instructorId] });
    },
    { enabled: !!instructorId }
  );

  return query;
}
