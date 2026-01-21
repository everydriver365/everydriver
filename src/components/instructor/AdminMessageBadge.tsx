import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export function AdminMessageBadge() {
  const { instructor } = useInstructorAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!instructor?.id) return;

    const fetchUnreadCount = async () => {
      // First get conversation id
      const { data: conv } = await supabase
        .from("admin_conversations")
        .select("id")
        .eq("instructor_id", instructor.id)
        .maybeSingle();

      if (!conv) {
        setUnreadCount(0);
        return;
      }

      // Count unread admin messages
      const { count } = await supabase
        .from("admin_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("sender_type", "admin")
        .is("read_at", null);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("admin-message-badge")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_messages",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructor?.id]);

  if (unreadCount === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs"
    >
      {unreadCount}
    </Badge>
  );
}
