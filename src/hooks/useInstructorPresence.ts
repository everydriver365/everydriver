import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Broadcasts instructor presence via Supabase Realtime Presence.
 * Call this in the instructor dashboard so visitors can see "Online now".
 */
export function useInstructorPresence(instructorId: string | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase.channel(`instructor-presence:${instructorId}`, {
      config: { presence: { key: instructorId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    // Periodically update last_active_at as a fallback
    const updateLastActive = () => {
      supabase
        .from("instructors")
        .update({ last_active_at: new Date().toISOString() } as any)
        .eq("id", instructorId)
        .then();
    };

    updateLastActive();
    const interval = setInterval(updateLastActive, 2 * 60 * 1000); // every 2 min

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [instructorId]);
}
