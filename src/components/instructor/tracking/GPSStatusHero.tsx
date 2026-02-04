import { motion } from "framer-motion";
import { Smartphone, Wifi, WifiOff, MapPin, Gauge, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatMph } from "@/lib/utils";

interface GPSStatusHeroProps {
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
  
  window.location.href = deepLink;
  setTimeout(() => {
    window.location.href = appStoreLink;
  }, 1500);
};

export function GPSStatusHero({
  deviceName,
  isConnected,
  lastSeenLabel,
  speedKmh,
  roadName,
  isReconnecting = false,
  retryCount = 0,
  onManualReconnect,
}: GPSStatusHeroProps) {
  const showReconnecting = isReconnecting && !isConnected;

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Animated glow effect when connected */}
      {isConnected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
      
      <div className="relative p-4 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Device Icon with Status Ring */}
            <div className="relative">
              <div className={`p-3 rounded-2xl ${
                isConnected 
                  ? "bg-emerald-500/20" 
                  : showReconnecting 
                    ? "bg-blue-500/20" 
                    : "bg-amber-500/20"
              }`}>
                <Smartphone className={`h-6 w-6 ${
                  isConnected 
                    ? "text-emerald-500" 
                    : showReconnecting 
                      ? "text-blue-500" 
                      : "text-amber-500"
                }`} />
              </div>
              
              {/* Animated ping for connected state */}
              {isConnected && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
                </span>
              )}
              
              {/* Spinner for reconnecting */}
              {showReconnecting && (
                <span className="absolute -top-1 -right-1">
                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                </span>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground">
                {deviceName || "GPS Tracker"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {showReconnecting 
                  ? `Reconnecting... (attempt ${retryCount + 1})`
                  : isConnected 
                    ? `Updated ${lastSeenLabel}`
                    : `Last seen ${lastSeenLabel}`
                }
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected 
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : showReconnecting 
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" 
                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
          }`}>
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : showReconnecting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {isConnected ? "Live" : showReconnecting ? "Reconnecting" : "Offline"}
            </div>
          </div>
        </div>
        
        {/* Live Telemetry Row - Only when connected */}
        {isConnected && (
          <motion.div 
            className="flex items-center gap-4 pt-3 border-t border-border/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Speed */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Gauge className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">
                  {speedKmh != null ? formatMph(speedKmh) : "0 mph"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Speed</p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-10 w-px bg-border/50" />
            
            {/* Road Name */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-tight">
                  {roadName || "Awaiting location..."}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Location</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Offline Actions */}
        {!isConnected && !showReconnecting && (
          <motion.div 
            className="flex gap-2 pt-3 border-t border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {onManualReconnect && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={onManualReconnect}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            )}
            <Button 
              size="sm" 
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={openTrackerApp}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Tracker App
            </Button>
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}
