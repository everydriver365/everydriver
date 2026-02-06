import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function usePupilUnreadCount(instructorId: string | undefined, pupilId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pupil-unread-count", instructorId, pupilId],
    queryFn: async (): Promise<number> => {
      if (!instructorId || !pupilId) return 0;

      try {
        // Find the conversation between this instructor and pupil
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId)
          .eq("pupil_id", pupilId)
          .maybeSingle();

        if (!conversation) return 0;

        // Count unread messages from this pupil
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conversation.id)
          .eq("sender_type", "pupil")
          .is("read_at", null);

        if (error) return 0;
        return count || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!instructorId && !!pupilId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!instructorId || !pupilId) return;

    const channel = supabase
      .channel(`pupil-unread-${pupilId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pupil-unread-count", instructorId, pupilId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, pupilId, queryClient]);

  return query;
}
