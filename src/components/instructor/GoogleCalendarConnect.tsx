import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ExternalLink, Loader2, RefreshCw, Unlink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { formatDistanceToNow } from "date-fns";

interface GoogleCalendarConnectProps {
  instructorId: string;
}

export function GoogleCalendarConnect({ instructorId }: GoogleCalendarConnectProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    isConnecting,
    isChecking,
    isSyncing,
    calendarStatus,
    checkConnection,
    getAuthUrl,
    handleAuthCallback,
    disconnect,
    syncExternalEvents,
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

  const handleSyncNow = async () => {
    await syncExternalEvents();
  };

  const formatLastSync = (timestamp: string | null | undefined) => {
    if (!timestamp) return "Never";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-4">
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
          
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Two-Way Sync</span>
              </div>
              {(calendarStatus.externalEventCount ?? 0) > 0 && (
                <Badge variant="outline" className="text-xs">
                  {calendarStatus.externalEventCount} events blocking
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              External calendar events are imported to block availability. Last synced: {formatLastSync(calendarStatus.lastExternalSync)}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="gap-2 w-full"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Now
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            New lessons appear as "Busy" in Google Calendar, and external events block booking slots.
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
            Connect your Google Calendar for two-way sync:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>New lessons automatically show as "Busy"</li>
            <li>External events block booking availability</li>
            <li>Prevent double-booking conflicts</li>
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
    </div>
  );
}
