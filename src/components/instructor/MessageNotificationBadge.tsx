import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface MessageNotificationBadgeProps {
  instructorId: string | undefined;
  className?: string;
}

export function MessageNotificationBadge({ instructorId, className }: MessageNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!instructorId) return;

    const fetchUnreadCount = async () => {
      try {
        // Get all conversations for this instructor
        const { data: conversations } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId);

        if (!conversations || conversations.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Count unread messages from pupils
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversations.map((c) => c.id))
          .eq("sender_type", "pupil")
          .is("read_at", null)
          .is("deleted_at", null);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel(`unread-messages-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
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
