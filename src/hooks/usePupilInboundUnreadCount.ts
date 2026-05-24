import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

/**
 * Counts messages SENT BY the instructor in this pupil's thread that the
 * pupil has not yet read — i.e. the pupil-facing "unread inbox" count.
 *
 * Sibling of usePupilUnreadCount (which counts the opposite direction —
 * pupil-sent messages unread by the instructor). Do not consolidate; the
 * other hook is consumed by instructor-side views.
 */
export function usePupilInboundUnreadCount(
  instructorId: string | undefined,
  pupilId: string | undefined,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pupil-inbound-unread-count", instructorId, pupilId],
    queryFn: async (): Promise<number> => {
      if (!instructorId || !pupilId) return 0;

      try {
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId)
          .eq("pupil_id", pupilId)
          .maybeSingle();

        if (!conversation) return 0;

        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conversation.id)
          .eq("sender_type", "instructor")
          .is("read_at", null)
          .is("deleted_at", null);

        if (error) return 0;
        return count || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!instructorId && !!pupilId,
    staleTime: 30 * 1000,
  });

  useRealtimeSubscription(
    "messages",
    "*",
    () => {
      queryClient.invalidateQueries({
        queryKey: ["pupil-inbound-unread-count", instructorId, pupilId],
      });
    },
    { enabled: !!instructorId && !!pupilId },
  );

  return query;
}
