import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface VisitorChatBadgeProps {
  instructorId: string | undefined;
  className?: string;
}

export function VisitorChatBadge({ instructorId, className }: VisitorChatBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!instructorId) return;

    const fetchUnreadCount = async () => {
      try {
        // Count unread visitor messages in active sessions for this instructor
        const { count } = await supabase
          .from("live_chat_messages")
          .select("*, live_chat_sessions!inner(instructor_id, status)", { count: "exact", head: true })
          .eq("live_chat_sessions.instructor_id", instructorId)
          .eq("live_chat_sessions.status", "active")
          .eq("sender_type", "visitor")
          .is("read_at", null);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread visitor chat count:", error);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel("visitor-chat-unread")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_chat_messages",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  if (unreadCount === 0) return null;

  return (
    <Badge variant="destructive" className={className}>
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  );
}
