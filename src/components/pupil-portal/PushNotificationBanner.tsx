import { useEffect, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePupilPushNotifications } from "@/hooks/usePupilPushNotifications";

interface PushNotificationBannerProps {
  pupilId: string;
  brandColour?: string | null;
}

const dismissKey = (pupilId: string) => `pupil-push-banner-dismissed:${pupilId}`;

export function PushNotificationBanner({ pupilId, brandColour }: PushNotificationBannerProps) {
  const { isSupported, isSubscribed, isLoading, subscribe, permission } = usePupilPushNotifications(pupilId);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem(dismissKey(pupilId)) === "1"; } catch { return false; }
  });

  // Re-evaluate dismissed flag if pupilId changes
  useEffect(() => {
    try { setDismissed(window.localStorage.getItem(dismissKey(pupilId)) === "1"); } catch {}
  }, [pupilId]);

  const handleDismiss = () => {
    try { window.localStorage.setItem(dismissKey(pupilId), "1"); } catch {}
    setDismissed(true);
  };

  // Hide if not supported, already subscribed, OS-blocked, dismissed, or still loading initial state
  if (!isSupported) return null;
  if (isLoading) return null;
  if (isSubscribed) return null;
  if (permission === "granted") return null; // notifications are on at OS/browser level
  if (permission === "denied") return null;  // no point nagging; user blocked
  if (dismissed) return null;

  const primaryColor = brandColour || '#1e3a5f';

  return (
    <Card className="overflow-hidden relative">
      <div className="h-1" style={{ backgroundColor: primaryColor }} />
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification prompt"
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 pr-6">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Bell className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Enable notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get instant alerts when slots open up and lesson reminders
            </p>
          </div>
          <Button
            size="sm"
            onClick={subscribe}
            disabled={isLoading}
            style={{ backgroundColor: primaryColor }}
            className="flex-shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
