import { Smartphone, Wifi, WifiOff, ExternalLink, Gauge, MapPin, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMph } from "@/lib/utils";

interface GPSConnectionStatusCardProps {
  deviceName: string | null;
  isConnected: boolean;
  lastSeenLabel: string;
  speedKmh: number | null;
  roadName: string | null;
  isReconnecting?: boolean;
  retryCount?: number;
  onManualReconnect?: () => void;
}

// Open GPSgate Tracker app with fallback to app store
const openTrackerApp = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const deepLink = "gpsgate://";
  const appStoreLink = isIOS 
    ? "https://apps.apple.com/app/gpsgate-tracker/id434645675"
    : "https://play.google.com/store/apps/details?id=com.gpsgate.tracker";
  
  // Attempt deep link first
  window.location.href = deepLink;
  
  // Fallback to app store after delay (if deep link didn't work)
  setTimeout(() => {
    window.location.href = appStoreLink;
  }, 1500);
};

export function GPSConnectionStatusCard({
  deviceName,
  isConnected,
  lastSeenLabel,
  speedKmh,
  roadName,
  isReconnecting = false,
  retryCount = 0,
  onManualReconnect,
}: GPSConnectionStatusCardProps) {
  // Determine display state
  const showReconnecting = isReconnecting && !isConnected;
  
  return (
    <div className={`rounded-2xl border-2 backdrop-blur shadow-lg ${
      showReconnecting
        ? "bg-blue-50/95 border-blue-300 dark:bg-blue-950/80 dark:border-blue-700"
        : isConnected 
          ? "bg-emerald-50/95 border-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-700" 
          : "bg-amber-50/95 border-amber-300 dark:bg-amber-950/80 dark:border-amber-700"
    }`}>
      <div className="p-4 space-y-3">
        {/* Header with icon and device name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              showReconnecting
                ? "bg-blue-100 dark:bg-blue-900/50"
                : isConnected 
                  ? "bg-emerald-100 dark:bg-emerald-900/50" 
                  : "bg-amber-100 dark:bg-amber-900/50"
            }`}>
              <Smartphone className={`h-5 w-5 ${
                showReconnecting
                  ? "text-blue-600 dark:text-blue-400"
                  : isConnected 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-amber-600 dark:text-amber-400"
              }`} />
            </div>
            <div>
              <h3 className={`font-semibold ${
                showReconnecting
                  ? "text-blue-900 dark:text-blue-100"
                  : isConnected 
                    ? "text-emerald-900 dark:text-emerald-100" 
                    : "text-amber-900 dark:text-amber-100"
              }`}>
                GPSgate Tracker
              </h3>
              <p className="text-xs text-muted-foreground">
                {deviceName || "Mobile Tracker"}
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {showReconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <span className="relative flex h-3 w-3">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected 
                    ? "bg-emerald-500" 
                    : "bg-amber-500"
                }`}></span>
              </span>
            )}
          </div>
        </div>
        
        {/* Connection details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            {showReconnecting ? (
              <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
            ) : isConnected ? (
              <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className={`font-medium ${
              showReconnecting
                ? "text-blue-700 dark:text-blue-300"
                : isConnected 
                  ? "text-emerald-700 dark:text-emerald-300" 
                  : "text-amber-700 dark:text-amber-300"
            }`}>
              {showReconnecting 
                ? `Reconnecting... (${retryCount}/5)`
                : isConnected 
                  ? "Connected" 
                  : "Offline"}
            </span>
          </div>
          <span className="text-muted-foreground">
            {isConnected ? `Updated ${lastSeenLabel}` : `Last seen ${lastSeenLabel}`}
          </span>
        </div>
        
        {/* Live data when connected */}
        {isConnected && (
          <div className="flex items-center gap-4 text-sm pt-1 border-t border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <Gauge className="h-4 w-4" />
              <span className="font-medium">{speedKmh != null ? formatMph(speedKmh) : "0 mph"}</span>
            </div>
            {roadName ? (
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 min-w-0">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{roadName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Awaiting location...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Action buttons when offline or reconnecting */}
        {!isConnected && (
          <div className="flex gap-2">
            {onManualReconnect && !showReconnecting && (
              <Button 
                onClick={onManualReconnect}
                variant="outline"
                className="flex-1 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            <Button 
              onClick={openTrackerApp} 
              className={`flex-1 ${onManualReconnect && !showReconnecting ? '' : 'w-full'} bg-amber-600 hover:bg-amber-700 text-white`}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open GPSgate Tracker
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
