import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, ExternalLink, Loader2, RefreshCw, X } from "lucide-react";
import { useCalendarSync } from "@/hooks/useCalendarSync";

interface CalendarConnectProps {
  instructorId: string;
}

export function CalendarConnect({ instructorId }: CalendarConnectProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
  } = useCalendarSync(instructorId);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const isCallback = searchParams.get("calendar_callback");

    if (code && isCallback) {
      handleAuthCallback(code).then(() => {
        // Clean up URL after processing
        setSearchParams((prev) => {
          prev.delete("code");
          prev.delete("calendar_callback");
          prev.delete("state");
          return prev;
        });
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
    const date = new Date(timestamp);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case "google":
        return "Google Calendar";
      case "microsoft":
        return "Microsoft Outlook";
      case "icloud":
        return "Apple iCloud";
      case "ews":
        return "Exchange";
      default:
        return "Calendar";
    }
  };

  const getProviderColor = (provider?: string) => {
    switch (provider) {
      case "google":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "microsoft":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "icloud":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking calendar connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calendarStatus?.connected ? (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Connected</span>
              <Badge variant="outline" className={getProviderColor(calendarStatus.provider)}>
                {getProviderName(calendarStatus.provider)}
              </Badge>
            </div>
          </div>

          {/* Account Info */}
          {calendarStatus.email && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Account:</span> {calendarStatus.email}
            </div>
          )}

          {/* Sync Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              <span className="font-medium">Last synced:</span> {formatLastSync(calendarStatus.lastSync)}
            </div>
            {calendarStatus.externalEventCount !== undefined && (
              <Badge variant="secondary">
                {calendarStatus.externalEventCount} busy blocks
              </Badge>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Two-way sync active. We only read when you're busy—never event details.</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-destructive hover:text-destructive"
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your calendar to sync lessons and block out busy times automatically. 
            We support Google, Outlook, iCloud, and Exchange calendars.
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            We never read event titles, descriptions, or personal details—only busy times.
          </p>
          <p className="text-sm text-muted-foreground">
            Simple scheduling. Full privacy. 💙
          </p>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full sm:w-auto"
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Connect Calendar
          </Button>
        </div>
      )}
    </div>
  );
}
