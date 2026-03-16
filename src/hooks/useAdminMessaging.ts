import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminMessage {
  id: string;
  conversation_id: string;
  sender_type: "instructor" | "admin";
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface AdminConversation {
  id: string;
  instructor_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  instructor?: {
    id: string;
    name: string;
    profile_image_url: string | null;
  };
  unread_count?: number;
}

// Hook for instructors to message admin
export function useInstructorAdminChat(instructorId: string | undefined) {
  const [conversation, setConversation] = useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversation = useCallback(async () => {
    if (!instructorId) return;

    try {
      // Get or create conversation
      let { data: existingConv, error } = await supabase
        .from("admin_conversations")
        .select("*")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) throw error;

      if (!existingConv) {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("admin_conversations")
          .insert({ instructor_id: instructorId })
          .select()
          .single();

        if (createError) throw createError;
        existingConv = newConv;
      }

      setConversation(existingConv);
      await fetchMessages(existingConv.id);
    } catch (error) {
      console.error("Error fetching admin conversation:", error);
      toast.error("Failed to load admin chat");
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("admin_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages((data || []) as AdminMessage[]);
  };

  const sendMessage = async (content: string) => {
    if (!conversation || !instructorId || !content.trim()) return false;

    setSending(true);
    try {
      const { error } = await supabase.from("admin_messages").insert({
        conversation_id: conversation.id,
        sender_type: "instructor",
        sender_id: instructorId,
        content: content.trim(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = useCallback(async () => {
    if (!conversation || !instructorId) return;

    await supabase
      .from("admin_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversation.id)
      .eq("sender_type", "admin")
      .is("read_at", null);
  }, [conversation?.id, instructorId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`admin-chat-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as AdminMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refetch: fetchConversation,
  };
}

// Hook for admin to view all instructor conversations
export function useAdminInstructorChats() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_conversations")
        .select(`
          *,
          instructor:instructors(id, name, profile_image_url)
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Get unread counts
      const withUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from("admin_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("sender_type", "instructor")
            .is("read_at", null);

          return { ...conv, unread_count: count || 0 };
        })
      );

      setConversations(withUnread);
    } catch (error) {
      console.error("Error fetching admin conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTotalUnreadCount = () => {
    return conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("admin-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_messages",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    getTotalUnreadCount,
    refetch: fetchConversations,
  };
}

// Hook for viewing a specific admin conversation (for admin side)
export function useAdminConversationMessages(conversationId: string | null, instructorId?: string) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as AdminMessage[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = async (content: string, adminId: string) => {
    if (!conversationId || !content.trim()) return false;

    setSending(true);
    try {
      const { error } = await supabase.from("admin_messages").insert({
        conversation_id: conversationId,
        sender_type: "admin",
        sender_id: adminId,
        content: content.trim(),
      });

      if (error) throw error;

      // Send push notification to instructor
      if (instructorId) {
        try {
          await supabase.functions.invoke("notify-instructor", {
            body: {
              instructorId,
              type: "admin_direct_message",
              messagePreview: content.trim(),
            },
          });
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
          // Don't fail the whole operation if notification fails
        }
      }

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    await supabase
      .from("admin_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "instructor")
      .is("read_at", null);
  }, [conversationId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`admin-conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as AdminMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}
