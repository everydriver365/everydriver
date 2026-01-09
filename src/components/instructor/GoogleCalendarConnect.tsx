import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, Check, ExternalLink, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

interface GoogleCalendarConnectProps {
  instructorId: string;
}

export function GoogleCalendarConnect({ instructorId }: GoogleCalendarConnectProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    isConnecting,
    isChecking,
    calendarStatus,
    checkConnection,
    getAuthUrl,
    handleAuthCallback,
    disconnect,
  } = useGoogleCalendar(instructorId);

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const isCallback = searchParams.get("calendar_callback");

    if (code && isCallback) {
      handleAuthCallback(code).then(() => {
        // Clean up URL params
        searchParams.delete("code");
        searchParams.delete("calendar_callback");
        searchParams.delete("scope");
        setSearchParams(searchParams, { replace: true });
      });
    }
  }, [searchParams, handleAuthCallback, setSearchParams]);

  const handleConnect = async () => {
    const authUrl = await getAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    await disconnect();
    setIsDisconnecting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to automatically sync lessons and prevent double-bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isChecking ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection...
          </div>
        ) : calendarStatus?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              <span className="text-sm text-muted-foreground">
                to {calendarStatus.calendarName || "Primary Calendar"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              All new bookings will automatically appear as "Busy" in your Google Calendar.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="gap-2"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4" />
              )}
              Disconnect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Block lesson times automatically</li>
              <li>Show slots as "Busy" to prevent conflicts</li>
              <li>Get reminders for upcoming lessons</li>
            </ul>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Connect Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
