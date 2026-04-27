import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppConversation {
  id: string;
  instructor_id: string;
  phone_number: string;
  visitor_name: string | null;
  ai_enabled: boolean;
  last_message_at: string | null;
  created_at: string;
  muted_at?: string | null;
  last_message?: string;
  unread_count?: number;
}

export function useWhatsAppConversations(instructorId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-conversations", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get last message + unread count for each conversation
      const enriched: WhatsAppConversation[] = await Promise.all(
        (data || []).map(async (conv) => {
          const [{ data: msgs }, { count }] = await Promise.all([
            supabase
              .from("whatsapp_messages")
              .select("content")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1),
            supabase
              .from("whatsapp_messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .eq("direction", "inbound")
              .is("read_at" as any, null),
          ]);

          return {
            ...conv,
            last_message: msgs?.[0]?.content || "",
            unread_count: count || 0,
          };
        })
      );

      return enriched;
    },
    enabled: !!instructorId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel(`wa-convos-${instructorId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "whatsapp_conversations",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", instructorId] });
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "whatsapp_messages",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", instructorId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, queryClient]);

  const bulkMarkWaRead = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      try {
        const { error } = await supabase
          .from("whatsapp_messages")
          .update({ read_at: new Date().toISOString() } as any)
          .in("conversation_id", ids)
          .eq("direction", "inbound")
          .is("read_at" as any, null);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", instructorId] });
      } catch (error) {
        console.error("Error bulk marking WhatsApp as read:", error);
      }
    },
    [instructorId, queryClient]
  );

  const bulkSetWaMute = useCallback(
    async (ids: string[], muted: boolean) => {
      if (!ids.length) return;
      try {
        const { error } = await supabase
          .from("whatsapp_conversations")
          .update({ muted_at: muted ? new Date().toISOString() : null } as any)
          .in("id", ids);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", instructorId] });
      } catch (error) {
        console.error("Error bulk muting WhatsApp:", error);
      }
    },
    [instructorId, queryClient]
  );

  return {
    conversations: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    bulkMarkWaRead,
    bulkSetWaMute,
  };
}
