import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to instructor presence channel to determine if they're online.
 * Falls back to checking last_active_at (within 5 minutes = online).
 */
export function useInstructorOnlineStatus(instructorId: string | undefined) {
  const [isOnline, setIsOnline] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!instructorId) return;

    // Public-safe RPC — works for anonymous chat widgets too.
    const checkLastActive = async () => {
      const { data } = await supabase
        .rpc("get_public_instructor_presence", { p_instructor_id: instructorId })
        .maybeSingle();

      if (data?.last_active_at) {
        const lastActive = new Date(data.last_active_at as string).getTime();
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        if (lastActive > fiveMinAgo) {
          setIsOnline(true);
        }
      }
    };

    checkLastActive();

    // Subscribe to presence channel
    const channel = supabase.channel(`instructor-presence:${instructorId}`, {
      config: { presence: { key: instructorId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const instructorPresent = Object.keys(state).length > 0;
        setIsOnline(instructorPresent);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [instructorId]);

  return isOnline;
}
