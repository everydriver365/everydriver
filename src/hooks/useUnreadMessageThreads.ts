import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

export interface UnreadThread {
  conversationId: string;
  pupilName: string | null;
  pupilId: string | null;
  preview: string;
  createdAt: string;
}

export function useUnreadMessageThreads(instructorId: string | undefined, limit = 5) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-message-threads", instructorId, limit],
    queryFn: async (): Promise<UnreadThread[]> => {
      if (!instructorId) return [];

      const { data: convs, error: cErr } = await supabase
        .from("conversations")
        .select("id, pupil_id, last_message_preview, last_message_at, pupils(name)")
        .eq("instructor_id", instructorId)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (cErr || !convs || convs.length === 0) return [];

      const convIds = convs.map((c) => c.id);
      const { data: unreadRows } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .eq("sender_type", "pupil")
        .is("read_at", null);

      const unreadSet = new Set((unreadRows || []).map((r) => r.conversation_id));

      const out: UnreadThread[] = [];
      for (const c of convs) {
        if (!unreadSet.has(c.id)) continue;
        out.push({
          conversationId: c.id,
          pupilId: c.pupil_id,
          pupilName: (c as any).pupils?.name ?? null,
          preview: c.last_message_preview ?? "",
          createdAt: c.last_message_at ?? "",
        });
        if (out.length >= limit) break;
      }
      return out;
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000,
  });

  useRealtimeSubscription(
    "messages",
    "*",
    () => {
      queryClient.invalidateQueries({ queryKey: ["unread-message-threads", instructorId, limit] });
    },
    { enabled: !!instructorId }
  );

  return query;
}
