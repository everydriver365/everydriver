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
  delivered_at?: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  deleted_at?: string | null;
  is_urgent?: boolean;
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
    profile_image_url: string | null;
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
          pupil:pupils(id, name, phone, profile_image_url)
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
            .is("read_at", null)
            .is("deleted_at", null);

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
        .is("deleted_at", null)
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

  const sendMessage = async (
    content: string, 
    senderId: string, 
    options?: { attachmentUrl?: string; attachmentType?: string; instructorId?: string; pupilId?: string; pupilName?: string; isUrgent?: boolean }
  ) => {
    if (!conversationId || (!content.trim() && !options?.attachmentUrl)) return false;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_type: userType,
        sender_id: senderId,
        content: content.trim() || (options?.attachmentUrl ? "" : ""),
        attachment_url: options?.attachmentUrl || null,
        attachment_type: options?.attachmentType || null,
        is_urgent: options?.isUrgent || false,
      });

      if (error) throw error;

      // If pupil sends a message, notify instructor via push
      if (userType === "pupil" && options?.instructorId) {
        const prefix = options?.isUrgent ? "⚠️ URGENT: " : "";
        try {
          await supabase.functions.invoke("notify-instructor", {
            body: {
              instructorId: options.instructorId,
              type: "pupil_message",
              pupilName: options.pupilName || "Pupil",
              messagePreview: `${prefix}${content.trim()}`,
              hasAttachment: !!options?.attachmentUrl,
            },
          });
        } catch (notifyError) {
          console.error("Error sending push notification:", notifyError);
        }

        // Create in-app notification for urgent messages
        if (options?.isUrgent) {
          supabase.from("instructor_notifications").insert({
            instructor_id: options.instructorId,
            title: "⚠️ Urgent Message",
            message: `${options.pupilName || "Pupil"}: ${content.trim().slice(0, 80)}`,
            type: "warning",
            action_url: "/instructor/messages",
          }).then(({ error: e }) => { if (e) console.error("Notification error:", e); });
        }
      }

      // If instructor sends an urgent message, notify pupil via push
      if (userType === "instructor" && options?.isUrgent && options?.pupilId) {
        supabase.functions.invoke("notify-pupil", {
          body: {
            pupilId: options.pupilId,
            type: "lesson_reminder",
            title: "⚠️ Urgent Message from Instructor",
            body: content.trim().slice(0, 80),
          },
        }).catch(console.error);
      }

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

    const oppositeType = userType === "instructor" ? "pupil" : "instructor";
    
    try {
      // Mark as delivered first (if not already)
      await supabase
        .from("messages")
        .update({ delivered_at: new Date().toISOString() } as any)
        .eq("conversation_id", conversationId)
        .eq("sender_type", oppositeType)
        .is("delivered_at" as any, null)
        .is("deleted_at", null);

      // Then mark as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("sender_type", oppositeType)
        .is("read_at", null)
        .is("deleted_at", null);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const softDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      return true;
    } catch (error) {
      console.error("Error soft-deleting message:", error);
      return false;
    }
  };

  const softDeleteAllMessages = async () => {
    if (!conversationId) return false;
    try {
      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .is("deleted_at", null);

      if (error) throw error;
      setMessages([]);
      return true;
    } catch (error) {
      console.error("Error soft-deleting messages:", error);
      return false;
    }
  };

  const toggleUrgent = async (messageId: string, conversationMeta?: { instructorId?: string; pupilId?: string }) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const newVal = !msg.is_urgent;
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_urgent: newVal })
        .eq("id", messageId);

      if (error) throw error;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_urgent: newVal } : m))
      );

      // Send notification when marking as urgent
      if (newVal && conversationMeta) {
        const preview = msg.content?.slice(0, 80) || "Attachment";
        
        // Notify the other party
        if (userType === "instructor" && conversationMeta.pupilId) {
          // Instructor marked urgent → notify pupil
          supabase.functions.invoke("notify-pupil", {
            body: {
              pupilId: conversationMeta.pupilId,
              type: "lesson_reminder",
              title: "⚠️ Urgent Message",
              body: preview,
            },
          }).catch(console.error);
        } else if (userType === "pupil" && conversationMeta.instructorId) {
          // Pupil marked urgent → notify instructor
          supabase.functions.invoke("notify-instructor", {
            body: {
              instructorId: conversationMeta.instructorId,
              type: "pupil_message",
              pupilName: "Pupil",
              messagePreview: `⚠️ URGENT: ${preview}`,
            },
          }).catch(console.error);
        }

        // Also create an in-app notification for the instructor
        if (conversationMeta.instructorId && userType === "pupil") {
          supabase.from("instructor_notifications").insert({
            instructor_id: conversationMeta.instructorId,
            title: "⚠️ Urgent Message",
            message: preview,
            type: "warning",
            action_url: "/instructor/messages",
          }).then(({ error }) => { if (error) console.error("Notification insert error:", error); });
        }
      }
    } catch (error) {
      console.error("Error toggling urgent:", error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    fetchMessages,
    softDeleteMessage,
    softDeleteAllMessages,
    toggleUrgent,
  };
}
