import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

export interface VisitorChatItem {
  sessionId: string;
  visitorName: string | null;
  preview: string;
  createdAt: string;
}

export function useVisitorChatActionItems(instructorId: string | undefined, limit = 5) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["visitor-chat-action-items", instructorId, limit],
    queryFn: async (): Promise<VisitorChatItem[]> => {
      if (!instructorId) return [];

      const { data, error } = await supabase
        .from("live_chat_messages")
        .select(
          "id, session_id, content, created_at, live_chat_sessions!inner(id, visitor_name, instructor_id, status)"
        )
        .eq("live_chat_sessions.instructor_id", instructorId)
        .eq("live_chat_sessions.status", "active")
        .eq("sender_type", "visitor")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("visitor chat items error", error);
        return [];
      }

      const bySession = new Map<string, VisitorChatItem>();
      for (const row of data || []) {
        const s: any = (row as any).live_chat_sessions;
        if (!s || bySession.has(row.session_id)) continue;
        bySession.set(row.session_id, {
          sessionId: row.session_id,
          visitorName: s.visitor_name ?? null,
          preview: row.content ?? "",
          createdAt: row.created_at,
        });
        if (bySession.size >= limit) break;
      }
      return Array.from(bySession.values());
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000,
  });

  useRealtimeSubscription(
    "live_chat_messages",
    "*",
    () => {
      queryClient.invalidateQueries({ queryKey: ["visitor-chat-action-items", instructorId, limit] });
    },
    { enabled: !!instructorId }
  );

  return query;
}
