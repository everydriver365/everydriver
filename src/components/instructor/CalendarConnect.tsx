import { Calendar, CheckCircle, Loader2, LogOut, RefreshCw, Upload, Download, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface CalendarConnectProps {
  instructorId: string;
}

export function CalendarConnect({ instructorId }: CalendarConnectProps) {
  const [showHelp, setShowHelp] = useState(false);
  
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

      {/* Unverified App Warning Help */}
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-foreground/80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <strong>First time connecting?</strong> You may see a "Google hasn't verified this app" warning.
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p>This is normal for apps that haven't completed Google's verification process. Your data is still secure.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </AlertDescription>
      </Alert>

      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleTrigger asChild>
          <Button variant="link" size="sm" className="px-0 h-auto text-primary">
            {showHelp ? "Hide" : "Show"} how to click through the warning →
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3 text-sm">
            <p className="font-medium">When you see the warning screen:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click <strong className="text-foreground">"Advanced"</strong> (small link at bottom left)</li>
              <li>Click <strong className="text-foreground">"Go to EveryDriver (unsafe)"</strong></li>
              <li>Review the permissions and click <strong className="text-foreground">"Continue"</strong></li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              This is a one-time process. Once connected, your calendar will sync automatically.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
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
