import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export function useInstructorDirectMessages(
  instructorId: string | undefined,
  friendId: string | undefined
) {
  const queryClient = useQueryClient();
  const queryKey = ["instructor-dms", instructorId, friendId];

  const messagesQuery = useQuery({
    queryKey,
    enabled: !!instructorId && !!friendId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${instructorId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${instructorId})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as DirectMessage[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!instructorId || !friendId) return;

    const channel = supabase
      .channel(`dms-${instructorId}-${friendId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "instructor_direct_messages" },
        (payload) => {
          const msg = payload.new as DirectMessage;
          if (
            (msg.sender_id === instructorId && msg.recipient_id === friendId) ||
            (msg.sender_id === friendId && msg.recipient_id === instructorId)
          ) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, friendId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("instructor_direct_messages").insert({
        sender_id: instructorId!,
        recipient_id: friendId!,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Mark unread messages as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from("instructor_direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", friendId!)
        .eq("recipient_id", instructorId!)
        .is("read_at", null);
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage,
    markAsRead,
  };
}
