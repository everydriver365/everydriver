import { CheckCircle, XCircle, Cpu, Wifi, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GPSConnectionChecklistProps {
  isConnected: boolean;
  lastSeenAt: string | null;
  deviceName: string;
}

export function GPSConnectionChecklist({ 
  isConnected, 
  lastSeenAt, 
  deviceName 
}: GPSConnectionChecklistProps) {
  const navigate = useNavigate();
  
  const getLastSeenText = () => {
    if (!lastSeenAt) return "Never connected";
    
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);
    
    if (diffSeconds < 30) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return lastSeen.toLocaleDateString();
  };

  return (
    <div className="w-full space-y-3">
      {/* Connection Status Card */}
      <div className={`p-4 rounded-none border-2 ${
        isConnected 
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700" 
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            isConnected 
              ? "bg-emerald-100 dark:bg-emerald-900" 
              : "bg-amber-100 dark:bg-amber-900"
          }`}>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Cpu className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <span className={`font-semibold ${
                isConnected 
                  ? "text-emerald-700 dark:text-emerald-300" 
                  : "text-amber-700 dark:text-amber-300"
              }`}>
                {isConnected ? "Device Connected" : "Device Not Connected"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {deviceName} • Last seen: {getLastSeenText()}
            </p>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              To connect your device:
            </p>
            <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1.5 ml-4 list-decimal">
              <li>Ensure your GPS tracker is plugged into the OBD-II port</li>
              <li>Check the tracker <strong>LED is on</strong> (power from vehicle)</li>
              <li>Verify <strong>SIM card</strong> has data enabled</li>
            </ol>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 w-full border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
              onClick={() => navigate("/instructor/settings/gps-tracking")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Setup Instructions
            </Button>
          </div>
        )}
      </div>

      {/* Ready to start indicator */}
      {isConnected && (
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Ready to start tracking
        </div>
      )}
    </div>
  );
}

// Re-export with old name for backwards compatibility


