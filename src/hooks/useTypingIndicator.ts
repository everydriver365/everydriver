import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseTypingIndicatorOptions {
  conversationId: string | null;
  userId: string;
  userType: "instructor" | "pupil";
}

export function useTypingIndicator({ conversationId, userId, userType }: UseTypingIndicatorOptions) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherTypingUser, setOtherTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingBroadcast = useRef<number>(0);

  // Broadcast that this user is typing
  const broadcastTyping = useCallback(() => {
    if (!conversationId) return;

    const now = Date.now();
    // Throttle broadcasts to every 2 seconds
    if (now - lastTypingBroadcast.current < 2000) return;
    lastTypingBroadcast.current = now;

    const channel = supabase.channel(`typing-${conversationId}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId,
        userType,
        isTyping: true,
      },
    });
  }, [conversationId, userId, userType]);

  // Broadcast that this user stopped typing
  const broadcastStopTyping = useCallback(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing-${conversationId}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId,
        userType,
        isTyping: false,
      },
    });
  }, [conversationId, userId, userType]);

  // Handle input change - call this when user types
  const handleTyping = useCallback(() => {
    broadcastTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      broadcastStopTyping();
    }, 3000);
  }, [broadcastTyping, broadcastStopTyping]);

  // Subscribe to typing events
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId: typingUserId, userType: typingUserType, isTyping } = payload.payload;

        // Only show indicator for the other party
        if (typingUserType !== userType) {
          setIsOtherTyping(isTyping);
          setOtherTypingUser(isTyping ? typingUserId : null);

          // Auto-hide after 4 seconds if no update
          if (isTyping) {
            setTimeout(() => {
              setIsOtherTyping(false);
              setOtherTypingUser(null);
            }, 4000);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, userType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      broadcastStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [broadcastStopTyping]);

  return {
    isOtherTyping,
    otherTypingUser,
    handleTyping,
    broadcastStopTyping,
  };
}