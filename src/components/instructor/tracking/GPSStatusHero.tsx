import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, Radio, Car, ExternalLink, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMph } from "@/lib/utils";

interface GPSStatusHeroProps {
  deviceName: string | null;
  isConnected: boolean;
  isParked?: boolean;
  lastSeenLabel: string;
  speedKmh: number | null;
  speedLimitKmh?: number | null;
  roadName: string | null;
  isReconnecting?: boolean;
  retryCount?: number;
  onManualReconnect?: () => void;
  trackingProvider?: string | null;
  odometerKm?: number | null;
  dailyDistanceKm?: number | null;
  ignitionOn?: boolean | null;
}
 
export function GPSStatusHero({
  deviceName,
  isConnected,
  isParked = false,
  lastSeenLabel,
  speedKmh,
  speedLimitKmh,
  roadName,
  isReconnecting = false,
  retryCount = 0,
  onManualReconnect,
  trackingProvider,
  odometerKm,
  dailyDistanceKm,
  ignitionOn,
}: GPSStatusHeroProps) {
   const cleanDeviceName = deviceName?.replace(/geotab/gi, "GPS").replace(/\s+/g, " ").trim() || null;
   const showReconnecting = isReconnecting && !isConnected && !isParked;
 
   return (
     <div className="space-y-4">
       {/* Main Connection Status Card */}
       <motion.div 
         className="relative overflow-hidden bg-white dark:bg-card rounded-2xl shadow-xl"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4 }}
       >
        {/* Connection Status Header */}
        <div className={`relative px-4 py-4 ${
          isConnected 
            ? "bg-gradient-to-br from-primary via-primary/95 to-primary/85" 
            : isParked
              ? "bg-gradient-to-br from-slate-500 to-slate-600"
              : showReconnecting 
                ? "bg-gradient-to-br from-slate-600 to-slate-700"
                : "bg-gradient-to-br from-primary/70 via-primary/55 to-primary/40"
        }`}>
          {/* Animated background pattern */}
          {!showReconnecting && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
            </div>
          )}
          
          <div className={`relative flex items-center ${showReconnecting ? "justify-center gap-2" : "justify-between"}`}>
            <div className={`flex items-center ${showReconnecting ? "gap-2" : "gap-3"}`}>
              {/* Status Icon */}
              <div className="relative">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/20">
                  {isConnected ? (
                    <Radio className="h-5 w-5 text-white" />
                  ) : isParked ? (
                    <Car className="h-5 w-5 text-white" />
                  ) : showReconnecting ? (
                    <RefreshCw className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-white" />
                  )}
                </div>
                
                {/* Green connected indicator dot */}
                {(isConnected || isParked) && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                    {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${isParked ? "bg-amber-400" : "bg-emerald-500"}`}></span>
                  </span>
                )}
              </div>
              
              <div className="text-white">
                <h2 className={`font-bold ${showReconnecting ? "text-base" : "text-lg"}`}>
                  {isConnected ? "Connected" : isParked ? "Parked" : showReconnecting ? "Reconnecting" : "Offline"}
                </h2>
                {!showReconnecting && (
                  <p className="text-white/80 text-xs font-medium">
                    {trackingProvider ? (
                      <span>
                        <span className="uppercase font-semibold">{trackingProvider === "radius" ? "Radius" : trackingProvider}</span>
                        {" · "}
                        {isParked ? (roadName || cleanDeviceName || "Ignition Off") : (cleanDeviceName || "GPS Tracker")}
                      </span>
                    ) : (
                      isParked ? (roadName || cleanDeviceName || "Ignition Off") : (cleanDeviceName || "GPS Tracker")
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
 
         {/* Telemetry Section - Always visible with last known data */}
         <AnimatePresence>
           {(isConnected || speedKmh != null || roadName) && (
          <motion.div 
             className={`px-4 py-3 ${!isConnected ? "opacity-60" : ""}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Speed</p>
                 <p className="text-2xl font-bold text-foreground">{speedKmh != null ? formatMph(speedKmh) : "0 mph"}</p>
                 {speedLimitKmh != null && speedLimitKmh > 0 && (
                   <p className="text-[10px] font-medium text-muted-foreground">
                     Limit: {formatMph(speedLimitKmh)}
                   </p>
                 )}
              </div>
               <div className="h-10 w-px bg-border mx-3" />
               <div className="flex-1 min-w-0 text-right">
                 <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Location</p>
                 <p className="text-sm font-semibold text-foreground truncate">{roadName || "Awaiting location..."}</p>
              </div>
            </div>

            {/* Enriched telemetry row */}
            {(odometerKm != null || dailyDistanceKm != null || ignitionOn != null) && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
                {ignitionOn != null && (
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${ignitionOn ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {ignitionOn ? "Engine On" : "Engine Off"}
                    </span>
                  </div>
                )}
                {dailyDistanceKm != null && dailyDistanceKm > 0 && (
                  <div className="flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Today: {Math.round(dailyDistanceKm * 0.621371)} mi
                    </span>
                  </div>
                )}
                {odometerKm != null && odometerKm > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground ml-auto">
                    ODO: {Math.round(odometerKm * 0.621371).toLocaleString()} mi
                  </span>
                )}
              </div>
            )}

          </motion.div>
           )}
         </AnimatePresence>
 
         {/* Offline Actions */}
         <AnimatePresence>
           {!isConnected && !showReconnecting && (
          <motion.div 
            className="px-4 py-3 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs text-muted-foreground text-center">
              Tracker appears offline. Check the device is powered on.
            </p>
            {onManualReconnect && (
              <Button 
                 variant="outline" 
                 size="sm" 
                 className="w-full h-8 rounded-2xl text-xs"
                onClick={onManualReconnect}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            )}
          </motion.div>
           )}
         </AnimatePresence>
       </motion.div>
     </div>
   );
 }