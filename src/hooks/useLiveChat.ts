import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LiveChatSession {
  id: string;
  session_type: "admin" | "instructor";
  instructor_id: string | null;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
  status: "active" | "closed" | "offline_message";
  assigned_to: string | null;
  source_page: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface LiveChatMessage {
  id: string;
  session_id: string;
  sender_type: "visitor" | "admin" | "instructor";
  sender_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface TypingIndicator {
  session_id: string;
  user_type: string;
  user_id: string | null;
  is_typing: boolean;
}

interface CreateSessionParams {
  sessionType: "admin" | "instructor";
  instructorId?: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  sourcePage?: string;
  initialMessage?: string;
}

export function useLiveChat(sessionId: string | null) {
  const [session, setSession] = useState<LiveChatSession | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdate = useRef<number>(0);

  // Fetch session and messages
  const fetchSessionData = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from("live_chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData as LiveChatSession);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("live_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData as LiveChatMessage[]);
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return;

    fetchSessionData();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`live_chat_messages_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as LiveChatMessage;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`live_chat_typing_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_chat_typing",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const typing = payload.new as TypingIndicator;
          // Only show typing if it's from the other party
          if (typing.is_typing) {
            setOtherTyping(true);
            // Auto-hide after 3 seconds
            setTimeout(() => setOtherTyping(false), 3000);
          } else {
            setOtherTyping(false);
          }
        }
      )
      .subscribe();

    // Subscribe to session updates
    const sessionChannel = supabase
      .channel(`live_chat_session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_chat_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as LiveChatSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, fetchSessionData]);

  // Send message
  const sendMessage = useCallback(
    async (
      content: string,
      senderType: "visitor" | "admin" | "instructor",
      senderId?: string
    ) => {
      if (!sessionId || !content.trim()) return false;

      setSending(true);
      try {
        const { error } = await supabase.from("live_chat_messages").insert({
          session_id: sessionId,
          sender_type: senderType,
          sender_id: senderId || null,
          content: content.trim(),
        });

        if (error) throw error;

        // Clear typing indicator
        await updateTypingIndicator(false, senderType, senderId);

        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        return false;
      } finally {
        setSending(false);
      }
    },
    [sessionId]
  );

  // Update typing indicator
  const updateTypingIndicator = useCallback(
    async (
      isTyping: boolean,
      userType: "visitor" | "admin" | "instructor",
      userId?: string
    ) => {
      if (!sessionId) return;

      // Throttle typing updates
      const now = Date.now();
      if (isTyping && now - lastTypingUpdate.current < 1000) return;
      lastTypingUpdate.current = now;

      try {
        await supabase.from("live_chat_typing").upsert(
          {
            session_id: sessionId,
            user_type: userType,
            user_id: userId || null,
            is_typing: isTyping,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "session_id,user_type,user_id",
          }
        );
      } catch (error) {
        console.error("Error updating typing indicator:", error);
      }
    },
    [sessionId]
  );

  // Handle typing with debounce
  const handleTyping = useCallback(
    (userType: "visitor" | "admin" | "instructor", userId?: string) => {
      updateTypingIndicator(true, userType, userId);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to clear typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingIndicator(false, userType, userId);
      }, 2000);
    },
    [updateTypingIndicator]
  );

  // Close session
  const closeSession = useCallback(async () => {
    if (!sessionId) return false;

    try {
      const { error } = await supabase
        .from("live_chat_sessions")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error closing session:", error);
      toast.error("Failed to close chat");
      return false;
    }
  }, [sessionId]);

  // Mark messages as read
  const markAsRead = useCallback(
    async (readerType: "admin" | "instructor") => {
      if (!sessionId) return;

      try {
        const senderTypes =
          readerType === "admin" ? ["visitor"] : ["visitor"];
        await supabase
          .from("live_chat_messages")
          .update({ read_at: new Date().toISOString() })
          .eq("session_id", sessionId)
          .in("sender_type", senderTypes)
          .is("read_at", null);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    },
    [sessionId]
  );

  return {
    session,
    messages,
    loading,
    sending,
    otherTyping,
    sendMessage,
    handleTyping,
    closeSession,
    markAsRead,
    refetch: fetchSessionData,
  };
}

// Hook for creating new sessions
export function useCreateLiveChatSession() {
  const [creating, setCreating] = useState(false);

  const createSession = async (
    params: CreateSessionParams
  ): Promise<string | null> => {
    setCreating(true);
    try {
      // Check if instructor is online for instructor chats
      let isOnline = true;
      if (params.sessionType === "instructor" && params.instructorId) {
        const { data: instructor } = await supabase
          .from("instructors")
          .select("is_online")
          .eq("id", params.instructorId)
          .single();
        isOnline = instructor?.is_online ?? false;
      }

      const { data: session, error } = await supabase
        .from("live_chat_sessions")
        .insert({
          session_type: params.sessionType,
          instructor_id: params.instructorId || null,
          visitor_name: params.visitorName,
          visitor_email: params.visitorEmail,
          visitor_phone: params.visitorPhone || null,
          source_page: params.sourcePage || null,
          status: isOnline ? "active" : "offline_message",
        })
        .select()
        .single();

      if (error) throw error;

      // Send initial message if provided
      if (params.initialMessage && session) {
        await supabase.from("live_chat_messages").insert({
          session_id: session.id,
          sender_type: "visitor",
          content: params.initialMessage,
        });
      }

      return session.id;
    } catch (error) {
      console.error("Error creating chat session:", error);
      toast.error("Failed to start chat");
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createSession, creating };
}

// Hook for listing sessions (admin/instructor)
export function useLiveChatSessions(
  type: "admin" | "instructor",
  instructorId?: string
) {
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      let query = supabase
        .from("live_chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (type === "instructor" && instructorId) {
        query = query.eq("instructor_id", instructorId);
      } else if (type === "admin") {
        query = query.eq("session_type", "admin");
      }

      const { data, error } = await query;
      if (error) throw error;
      setSessions(data as LiveChatSession[]);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [type, instructorId]);

  useEffect(() => {
    fetchSessions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("live_chat_sessions_list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_chat_sessions",
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions]);

  const getUnreadCount = useCallback(async () => {
    let query = supabase
      .from("live_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_type", "visitor")
      .is("read_at", null);

    // Join with sessions to filter by type
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      query = query.in("session_id", sessionIds);
    }

    const { count } = await query;
    return count || 0;
  }, [sessions]);

  return { sessions, loading, refetch: fetchSessions, getUnreadCount };
}
