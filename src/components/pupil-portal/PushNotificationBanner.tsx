import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePupilPushNotifications } from "@/hooks/usePupilPushNotifications";

interface PushNotificationBannerProps {
  pupilId: string;
  brandColour?: string | null;
}

export function PushNotificationBanner({ pupilId, brandColour }: PushNotificationBannerProps) {
  const { isSupported, isSubscribed, isLoading, toggle, permission } = usePupilPushNotifications(pupilId);

  // Don't show if not supported or already subscribed
  if (!isSupported) return null;

  const primaryColor = brandColour || '#1e3a5f';

  if (isSubscribed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-400">Notifications enabled</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggle}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show prompt to enable
  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: primaryColor }} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
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
            onClick={toggle}
            disabled={isLoading || permission === "denied"}
            style={{ backgroundColor: primaryColor }}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Enable"
            )}
          </Button>
        </div>
        {permission === "denied" && (
          <p className="text-xs text-destructive mt-2">
            Notifications blocked. Enable them in your browser settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
