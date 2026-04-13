import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

export function useUnreadMessagesCount(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-messages-count", instructorId],
    queryFn: async (): Promise<number> => {
      if (!instructorId) return 0;

      try {
        const { data: conversations, error: convError } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId);

        if (convError || !conversations || conversations.length === 0) {
          return 0;
        }

        const conversationIds = conversations.map((c) => c.id);
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .eq("sender_type", "pupil")
          .is("read_at", null);

        if (error) {
          console.error("Error fetching unread count:", error);
          return 0;
        }

        return count || 0;
      } catch (err) {
        console.error("Error in unread count query:", err);
        return 0;
      }
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000,
  });

  useRealtimeSubscription(
    "messages",
    "*",
    () => {
      queryClient.invalidateQueries({ queryKey: ["unread-messages-count", instructorId] });
    },
    { enabled: !!instructorId }
  );

  return query;
}
