import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ExternalLink, Loader2, RefreshCw, Unlink, Calendar, Zap, ZapOff } from "lucide-react";
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
    isSettingUpWebhook,
    calendarStatus,
    checkConnection,
    getAuthUrl,
    handleAuthCallback,
    disconnect,
    syncExternalEvents,
    setupWebhook,
    stopWebhook,
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

  const handleToggleWebhook = async () => {
    if (calendarStatus?.webhookActive) {
      await stopWebhook();
    } else {
      await setupWebhook();
    }
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
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            <span className="text-sm text-muted-foreground">
              to {calendarStatus.calendarName || "Primary Calendar"}
            </span>
          </div>
          
          {/* Real-time sync status */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Zap className={`h-4 w-4 ${calendarStatus.webhookActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
                <span className="font-medium">Real-Time Sync</span>
              </div>
              {calendarStatus.webhookActive ? (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Polling
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {calendarStatus.webhookActive 
                ? "Changes sync instantly via push notifications." 
                : "Calendar syncs every 15 minutes. Enable real-time for instant updates."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWebhook}
              disabled={isSettingUpWebhook}
              className="gap-2 w-full"
            >
              {isSettingUpWebhook ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : calendarStatus.webhookActive ? (
                <ZapOff className="h-4 w-4" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {calendarStatus.webhookActive ? "Disable Real-Time" : "Enable Real-Time"}
            </Button>
          </div>

          {/* Two-way sync info */}
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            We'll sync with your Google Calendar every 15 minutes to keep everything aligned. This includes two-way syncing, while only reading when you're busy (start and end times only).
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            We never read event titles, descriptions, or personal details.
          </p>
          <p className="text-sm text-muted-foreground">
            Simple scheduling. Full privacy. 💙
          </p>
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
            Enable Google Calendar Sync
          </Button>
        </div>
      )}
    </div>
  );
}
