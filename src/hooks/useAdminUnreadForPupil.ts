import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

/**
 * Counts unread admin messages for an instructor whose content mentions the
 * pupil's first name. Best-effort filter until admin_messages has a pupil_id col.
 */
export function useAdminUnreadForPupil(
  instructorId: string | undefined,
  pupilId: string | undefined,
  pupilName: string | undefined
) {
  const queryClient = useQueryClient();
  const firstName = pupilName?.trim().split(/\s+/)[0] || "";

  const query = useQuery({
    queryKey: ["admin-unread-for-pupil", instructorId, pupilId, firstName],
    queryFn: async (): Promise<number> => {
      if (!instructorId || !pupilId || !firstName) return 0;

      try {
        const { data: conv } = await supabase
          .from("admin_conversations")
          .select("id")
          .eq("instructor_id", instructorId)
          .maybeSingle();

        if (!conv) return 0;

        const { count, error } = await supabase
          .from("admin_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("sender_type", "admin")
          .is("read_at", null)
          .ilike("content", `%${firstName}%`);

        if (error) return 0;
        return count || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!instructorId && !!pupilId && !!firstName,
    staleTime: 30 * 1000,
  });

  useRealtimeSubscription(
    "admin_messages",
    "*",
    () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-unread-for-pupil", instructorId, pupilId, firstName],
      });
    },
    { enabled: !!instructorId && !!pupilId && !!firstName }
  );

  return query;
}
