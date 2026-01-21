import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "instructor" | "pupil";
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  instructor_id: string;
  pupil_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  pupil?: {
    id: string;
    name: string;
    phone: string | null;
  };
  unread_count?: number;
}

export function useMessaging(instructorId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    if (!instructorId) return;
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          pupil:pupils(id, name, phone)
        `)
        .eq("instructor_id", instructorId)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("sender_type", "pupil")
            .is("read_at", null);

          return {
            ...conv,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to new messages for real-time updates
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel("messages-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Refresh conversations when new message arrives
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchConversations]);

  const getOrCreateConversation = async (pupilId: string): Promise<string | null> => {
    if (!instructorId) return null;

    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("pupil_id", pupilId)
        .single();

      if (existing) return existing.id;

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
        })
        .select("id")
        .single();

      if (error) throw error;
      
      fetchConversations();
      return newConv?.id || null;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const getTotalUnreadCount = useCallback(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);

  return {
    conversations,
    loading,
    fetchConversations,
    getOrCreateConversation,
    getTotalUnreadCount,
  };
}

export function useConversationMessages(conversationId: string | null, userType: "instructor" | "pupil") {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as "instructor" | "pupil"
      })));
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription for this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as { 
              id: string; 
              conversation_id: string; 
              sender_type: string; 
              sender_id: string; 
              content: string; 
              read_at: string | null; 
              created_at: string; 
            };
            setMessages((prev) => [...prev, {
              ...newMsg,
              sender_type: newMsg.sender_type as "instructor" | "pupil"
            }]);
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as { 
              id: string; 
              conversation_id: string; 
              sender_type: string; 
              sender_id: string; 
              content: string; 
              read_at: string | null; 
              created_at: string; 
            };
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMsg.id ? {
                  ...updatedMsg,
                  sender_type: updatedMsg.sender_type as "instructor" | "pupil"
                } : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (content: string, senderId: string) => {
    if (!conversationId || !content.trim()) return false;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_type: userType,
        sender_id: senderId,
        content: content.trim(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return false;
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!conversationId) return;

    // Mark all messages from the other party as read
    const oppositeType = userType === "instructor" ? "pupil" : "instructor";
    
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("sender_type", oppositeType)
        .is("read_at", null);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    fetchMessages,
  };
}
