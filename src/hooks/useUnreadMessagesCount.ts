import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useUnreadMessagesCount(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-messages-count", instructorId],
    queryFn: async (): Promise<number> => {
      if (!instructorId) return 0;

      try {
        // First get all conversations for this instructor
        const { data: conversations, error: convError } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId);

        if (convError || !conversations || conversations.length === 0) {
          return 0;
        }

        // Then count unread messages from pupils in those conversations
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

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel(`unread-messages-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-messages-count", instructorId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, queryClient]);

  return query;
}
