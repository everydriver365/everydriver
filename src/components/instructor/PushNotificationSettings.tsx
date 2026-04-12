import { Bell, BellOff, BellRing, Loader2, AlertCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationSettingsProps {
  instructorId: string;
}

export function PushNotificationSettings({ instructorId }: PushNotificationSettingsProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    toggle,
  } = usePushNotifications(instructorId);

  if (!isSupported) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Push notifications are not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-2xl ${isSubscribed ? "bg-success/10" : "bg-muted"}`}>
              {isSubscribed ? (
                <BellRing className="h-5 w-5 text-success" />
              ) : (
                <Bell className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">Push Notifications</CardTitle>
              <CardDescription className="text-xs">
                Get alerts on your device
              </CardDescription>
            </div>
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Active" : "Off"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="push-toggle" className="text-sm font-normal">
              Enable push notifications
            </Label>
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={toggle}
              disabled={isLoading}
            />
          )}
        </div>

        {/* Permission warning */}
        {permission === "denied" && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-2xl text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-destructive">Notifications blocked</p>
              <p className="text-muted-foreground text-xs mt-1">
                Please enable notifications in your browser settings to receive alerts.
              </p>
            </div>
          </div>
        )}

        {/* What you'll receive */}
        {isSubscribed && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              You'll receive alerts for:
            </p>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                New booking requests
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lesson reminders (1 hour before)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Payment status updates
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                Cancellation notices
              </li>
            </ul>
          </div>
        )}

        {/* Enable button for initial setup */}
        {!isSubscribed && permission !== "denied" && (
          <Button
            onClick={toggle}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Enable Notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
