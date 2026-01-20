import { Calendar, CheckCircle, Loader2, LogOut, RefreshCw, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface CalendarConnectProps {
  instructorId: string;
}

export function CalendarConnect({ instructorId }: CalendarConnectProps) {
  const {
    status,
    isConnecting,
    isChecking,
    isDisconnecting,
    connect,
    disconnect,
    checkConnection,
  } = useGoogleOAuth(instructorId);

  const {
    isSyncing,
    fullSync,
    syncAllLessons,
    importBusyTimes,
  } = useGoogleCalendarSync(instructorId);

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking connection...</span>
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Connected to Google Calendar</span>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Account: <span className="font-medium">{status.email}</span></p>
          {status.lastSync && (
            <p>Last synced: {formatDistanceToNow(new Date(status.lastSync), { addSuffix: true })}</p>
          )}
          {status.isExpired && (
            <p className="text-destructive">Token expired - will refresh automatically</p>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Sync Options</p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fullSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Full Sync
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncAllLessons()}
              disabled={isSyncing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Push Lessons
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => importBusyTimes()}
              disabled={isSyncing}
            >
              <Download className="h-4 w-4 mr-2" />
              Import Busy Times
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            <strong>Full Sync:</strong> Pushes lessons to Google and imports your busy times.<br />
            <strong>Push Lessons:</strong> Only sends lessons to Google Calendar.<br />
            <strong>Import Busy Times:</strong> Only pulls events from Google to block your availability.
          </p>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={isChecking}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            disabled={isDisconnecting}
            className="text-destructive hover:text-destructive"
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Sync your Google Calendar to block busy times and add lessons automatically</span>
      </div>
      
      <Button
        onClick={connect}
        disabled={isConnecting}
        className="w-full sm:w-auto"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground">
        You'll be redirected to Google to authorize access to your calendar.
      </p>
    </div>
  );
}
