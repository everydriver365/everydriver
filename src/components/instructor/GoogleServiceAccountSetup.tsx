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
import { toast } from "sonner";

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
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
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
    );
  }

  // Not configured state
  if (!config?.configured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Google Calendar sync not configured</span>
        </div>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Contact your administrator to set up the Google Service Account integration.
        </p>
      </div>
    );
  }

  // Setup flow
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Connect your Google Calendar by sharing it with our sync service. This allows us to:
      </div>
      
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li>Block out times when you're busy</li>
        <li>Add booked lessons to your calendar</li>
        <li>Keep everything in sync automatically</li>
      </ul>

      {/* Step 1: Copy Email */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Step 1: Copy this email address
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm font-mono break-all">
            {config.serviceAccountEmail}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyEmail}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Step 2: Share Calendar */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Step 2: Share your Google Calendar
        </Label>
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm text-muted-foreground">
          <p>1. Open Google Calendar settings</p>
          <p>2. Click your calendar → "Settings and sharing"</p>
          <p>3. Under "Share with specific people", click "Add people"</p>
          <p>4. Paste the email above and select <strong>"Make changes to events"</strong></p>
          <p>5. Click "Send"</p>
        </div>
        <Button
          variant="link"
          size="sm"
          className="px-0 text-primary"
          onClick={() => window.open("https://calendar.google.com/calendar/r/settings", "_blank")}
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Open Google Calendar Settings
        </Button>
      </div>

      {/* Step 3: Enter Calendar ID */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Step 3: Enter your Calendar ID
        </Label>
        <p className="text-xs text-muted-foreground">
          Usually your Gmail address, or find it in Calendar settings → "Integrate calendar"
        </p>
        <Input
          placeholder="your-email@gmail.com"
          value={calendarId}
          onChange={(e) => {
            setCalendarId(e.target.value);
            setTestResult(null);
          }}
        />
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-lg p-3 ${
          testResult.success 
            ? "bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800" 
            : "bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Connection successful! Click "Connect Calendar" to finish.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-200">
                  {testResult.error}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
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