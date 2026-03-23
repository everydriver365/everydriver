import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  content: string;
  direction: string;
  sender_type: string;
  created_at: string;
}

export function useWhatsAppMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as WhatsAppMessage[];
    },
    enabled: !!conversationId,
  });

  // Send manual message (instructor takeover)
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error("No conversation");
      const { error } = await supabase.from("whatsapp_messages").insert({
        conversation_id: conversationId,
        content,
        direction: "outbound",
        sender_type: "instructor",
      });
      if (error) throw error;

      // Update conversation timestamp
      await supabase.from("whatsapp_conversations").update({
        last_message_at: new Date().toISOString(),
      }).eq("id", conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
    },
  });

  // Toggle AI for conversation
  const toggleAI = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!conversationId) throw new Error("No conversation");
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ ai_enabled: enabled })
        .eq("id", conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
    },
  });

  // Realtime
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`wa-msgs-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "whatsapp_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", conversationId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    sendMessage,
    toggleAI,
  };
}
