import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface WhatsAppBadgeProps {
  instructorId: string | undefined;
  className?: string;
}

export function WhatsAppBadge({ instructorId, className }: WhatsAppBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!instructorId) return;

    const fetchCount = async () => {
      // Count conversations with recent inbound messages (last 24h) that may need attention
      const { count: msgCount } = await supabase
        .from("whatsapp_messages")
        .select("*, whatsapp_conversations!inner(instructor_id)", { count: "exact", head: true })
        .eq("whatsapp_conversations.instructor_id", instructorId)
        .eq("direction", "inbound")
        .eq("sender_type", "visitor")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setCount(msgCount || 0);
    };

    fetchCount();

    const channel = supabase
      .channel(`wa-badge-${instructorId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "whatsapp_messages",
      }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [instructorId]);

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className={className}>
      {count > 9 ? "9+" : count}
    </Badge>
  );
}
