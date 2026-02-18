import { Smartphone, Wifi, WifiOff, Gauge, MapPin, RefreshCw, Loader2, PauseCircle } from "lucide-react";
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
  isStationary?: boolean;
  onManualReconnect?: () => void;
}

export function GPSConnectionStatusCard({
  deviceName,
  isConnected,
  lastSeenLabel,
  speedKmh,
  roadName,
  isReconnecting = false,
  retryCount = 0,
  isStationary = false,
  onManualReconnect,
}: GPSConnectionStatusCardProps) {
  const showReconnecting = isReconnecting && !isConnected;
  const showStationary = isConnected && isStationary && !showReconnecting;
  
  const getColorScheme = () => {
    if (showReconnecting) {
      return {
        bg: "bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/40",
        iconBg: "bg-primary/10 dark:bg-primary/20",
        iconColor: "text-primary",
        textColor: "text-primary dark:text-primary/80",
        statusColor: "text-primary/80 dark:text-primary/70",
      };
    }
    if (showStationary) {
      return {
        bg: "bg-sky-50/95 border-sky-300 dark:bg-sky-950/80 dark:border-sky-700",
        iconBg: "bg-sky-100 dark:bg-sky-900/50",
        iconColor: "text-sky-600 dark:text-sky-400",
        textColor: "text-sky-900 dark:text-sky-100",
        statusColor: "text-sky-700 dark:text-sky-300",
      };
    }
    if (isConnected) {
      return {
        bg: "bg-emerald-50/95 border-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-700",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        textColor: "text-emerald-900 dark:text-emerald-100",
        statusColor: "text-emerald-700 dark:text-emerald-300",
      };
    }
    return {
      bg: "bg-amber-50/95 border-amber-300 dark:bg-amber-950/80 dark:border-amber-700",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      textColor: "text-amber-900 dark:text-amber-100",
      statusColor: "text-amber-700 dark:text-amber-300",
    };
  };

  const colors = getColorScheme();
  
  const getStatusIcon = () => {
    if (showReconnecting) return <RefreshCw className={`h-4 w-4 ${colors.iconColor} animate-spin`} />;
    if (showStationary) return <PauseCircle className={`h-4 w-4 ${colors.iconColor}`} />;
    if (isConnected) return <Wifi className={`h-4 w-4 ${colors.iconColor}`} />;
    return <WifiOff className={`h-4 w-4 ${colors.iconColor}`} />;
  };

  const getStatusText = () => {
    if (showReconnecting) return `Reconnecting... (${retryCount}/5)`;
    if (showStationary) return "Connected (Stationary)";
    if (isConnected) return "Connected";
    return "Offline";
  };
  
  return (
    <div className={`rounded-2xl border-2 backdrop-blur shadow-lg ${colors.bg}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${colors.iconBg}`}>
              <Smartphone className={`h-5 w-5 ${colors.iconColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${colors.textColor}`}>
                GPS Tracker
              </h3>
              <p className="text-xs text-muted-foreground">
                {deviceName || "Vehicle Tracker"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showReconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <span className="relative flex h-3 w-3">
                {(isConnected && !showStationary) && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  showStationary ? "bg-sky-500" : isConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}></span>
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            {getStatusIcon()}
            <span className={`font-medium ${colors.statusColor}`}>{getStatusText()}</span>
          </div>
          <span className="text-muted-foreground">
            {isConnected ? `Updated ${lastSeenLabel}` : `Last seen ${lastSeenLabel}`}
          </span>
        </div>
        
        {isConnected && !showStationary && (
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
        
        {showStationary && (
          <div className="flex items-center gap-2 text-sm pt-1 border-t border-sky-200 dark:border-sky-800">
            <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 min-w-0">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{roadName || "Vehicle parked"}</span>
            </div>
          </div>
        )}
        
        {!isConnected && onManualReconnect && !showReconnecting && (
          <div className="flex gap-2">
            <Button 
              onClick={onManualReconnect}
              variant="outline"
              className="flex-1 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
