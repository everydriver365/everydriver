import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Check, 
  Copy, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useGoogleServiceCalendar } from "@/hooks/useGoogleServiceCalendar";
import { CalendarResyncRangePanel } from "@/components/instructor/CalendarResyncRangePanel";
import { CalendarSyncPreview } from "@/components/instructor/CalendarSyncPreview";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GoogleServiceAccountSetupProps {
  instructorId: string;
}

export function GoogleServiceAccountSetup({ instructorId }: GoogleServiceAccountSetupProps) {
  const [calendarId, setCalendarId] = useState("");
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const {
    isConnecting,
    isTesting,
    isChecking,
    isSyncing,
    status,
    config,
    fetchConfig,
    checkConnection,
    testConnection,
    saveConnection,
    disconnect,
    syncExternalEvents,
  } = useGoogleServiceCalendar(instructorId);

  useEffect(() => {
    fetchConfig();
    checkConnection();
  }, [fetchConfig, checkConnection]);

  const handleCopyEmail = async () => {
    if (config?.serviceAccountEmail) {
      await navigator.clipboard.writeText(config.serviceAccountEmail);
      setCopied(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestConnection = async () => {
    if (!calendarId.trim()) {
      toast.error("Please enter your Calendar ID");
      return;
    }
    const result = await testConnection(calendarId.trim());
    setTestResult(result);
  };

  const handleConnect = async () => {
    if (!calendarId.trim()) {
      toast.error("Please enter your Calendar ID");
      return;
    }
    await saveConnection(calendarId.trim());
    setCalendarId("");
    setTestResult(null);
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

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking connection...</span>
      </div>
    );
  }

  // Connected state
  if (status?.connected) {
    return (
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Connected</span>
            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              Google Calendar
            </Badge>
          </div>
        </div>

        {/* Calendar Info */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Calendar ID:</span> {status.calendarId}
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            <span className="font-medium">Last synced:</span> {formatLastSync(status.lastSync)}
          </div>
          {status.externalEventCount !== undefined && (
            <Badge variant="secondary">
              {status.externalEventCount} busy blocks
            </Badge>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Syncing busy times and pushing lessons to your Google Calendar.</span>
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

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDisconnecting}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reconnect Google Calendar?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears your saved calendar link so you can re-share a calendar and enter a new Calendar ID. Existing synced lessons stay on your calendar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>Reconnect</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isDisconnecting} className="text-destructive hover:text-destructive">
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Lessons will stop syncing both ways. Events already on your calendar are kept. You can reconnect at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Manual range re-sync */}
        <CalendarResyncRangePanel instructorId={instructorId} />
      </div>
    );
  }

  // Not configured state - admin hasn't set up secrets
  if (!config?.configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Calendar sync not available</span>
        </div>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          The Google Calendar integration is being set up. Please try again later.
        </p>
      </div>
    );
  }

  // Setup flow - instructor needs to share calendar
  return (
    <div className="space-y-5 rounded-2xl border bg-card p-4">
      {/* Step 1: Copy Email - Most prominent */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            1
          </div>
          <Label className="font-medium">Share your calendar with this email</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-mono">
            {config.serviceAccountEmail}
          </div>
          <Button
            variant={copied ? "default" : "outline"}
            size="sm"
            onClick={handleCopyEmail}
            className="shrink-0 min-w-[80px]"
          >
            {copied ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        
        <div className="rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground space-y-1.5">
          <p>In Google Calendar:</p>
          <ol className="list-decimal ml-4 space-y-0.5">
            <li>Go to Settings → your calendar → "Share with specific people"</li>
            <li>Add the email above with <strong>"Make changes to events"</strong> permission</li>
          </ol>
        </div>
        
        <Button
          variant="link"
          size="sm"
          className="px-0 h-auto text-primary"
          onClick={() => window.open("https://calendar.google.com/calendar/r/settings", "_blank")}
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Open Google Calendar Settings
        </Button>
      </div>

      {/* Step 2: Enter Calendar ID */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            2
          </div>
          <Label className="font-medium">Enter your Calendar ID</Label>
        </div>
        
        <Input
          placeholder="your-email@gmail.com"
          value={calendarId}
          onChange={(e) => {
            setCalendarId(e.target.value);
            setTestResult(null);
          }}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Usually your Gmail address. Find it in Calendar settings → "Integrate calendar" if unsure.
        </p>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-2xl p-3 ${
          testResult.success 
            ? "bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800" 
            : "bg-destructive/10 border border-destructive/30"
        }`}>
          <div className="flex items-start gap-2">
            {testResult.success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Connection successful!
                  </span>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    Click "Connect Calendar" below to finish setup.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-destructive">
                    Connection failed
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {testResult.error || "Make sure you've shared your calendar with the email above."}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={!calendarId.trim() || isTesting}
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Test Connection
        </Button>
        <Button
          onClick={handleConnect}
          disabled={!calendarId.trim() || isConnecting || !testResult?.success}
        >
          {isConnecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="mr-2 h-4 w-4" />
          )}
          Connect Calendar
        </Button>
      </div>
    </div>
  );
}