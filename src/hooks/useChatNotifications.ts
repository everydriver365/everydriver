import { useEffect, useRef, useCallback } from "react";

const NOTIFICATION_SOUND_URL = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNl+1aAAAAAAD/+1DEAAAGAAGn9AAAIwvBqvz5gBBFACIZh+oCZw+W5cvD58+D4P1Afv/g+D58HD/+sH/4Pgf/E/U/5R/E/I/1f5YfI/0Z/l/pH//1P/R/p//p//T/p/8h/l/6P//9X+X/o/y/9H+l/zn/1+t/S//5f+l/6n/K/1dZ9Dl///p6kHp6kHogICBgYGCgoKEhISIiIiMjIyQkJCYmJicnJygoKCsrKy0tLS4uLi8vLzAwMDExMTIyMjMzMzQ0NDU1NTY2Njc3Nzg4ODk5OTo6Ojs7Ozw8PD09PT4+Pj8/P0BAQEFBQUJCQkNDQ0RERGVlZQAAAAA=";

interface UseChatNotificationsOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  browserNotificationsEnabled?: boolean;
}

export function useChatNotifications(options: UseChatNotificationsOptions = {}) {
  const {
    enabled = true,
    soundEnabled = true,
    browserNotificationsEnabled = true,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPermission = useRef<boolean>(false);

  // Initialize audio element
  useEffect(() => {
    if (soundEnabled) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.volume = 0.5;
    }
    return () => {
      audioRef.current = null;
    };
  }, [soundEnabled]);

  // Request notification permission
  useEffect(() => {
    if (browserNotificationsEnabled && "Notification" in window) {
      if (Notification.permission === "granted") {
        hasPermission.current = true;
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          hasPermission.current = permission === "granted";
        });
      }
    }
  }, [browserNotificationsEnabled]);

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current && enabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Could not play notification sound:", err);
      });
    }
  }, [soundEnabled, enabled]);

  // Show browser notification
  const showBrowserNotification = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      if (
        browserNotificationsEnabled &&
        enabled &&
        hasPermission.current &&
        "Notification" in window &&
        document.hidden // Only show when tab is not focused
      ) {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.png",
          badge: "/favicon.png",
          tag: "live-chat-message",
        });

        if (onClick) {
          notification.onclick = () => {
            window.focus();
            onClick();
            notification.close();
          };
        }

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    },
    [browserNotificationsEnabled, enabled]
  );

  // Combined notification (sound + browser)
  const notify = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      playSound();
      showBrowserNotification(title, body, onClick);
    },
    [playSound, showBrowserNotification]
  );

  // Request permission manually
  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      hasPermission.current = permission === "granted";
      return permission === "granted";
    }
    return hasPermission.current;
  }, []);

  return {
    notify,
    playSound,
    showBrowserNotification,
    requestPermission,
    hasPermission: hasPermission.current,
  };
}
