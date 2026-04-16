import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, Radio, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GPSStatusHeroProps {
  deviceName: string | null;
  isConnected: boolean;
  isParked?: boolean;
  lastSeenLabel: string;
  isReconnecting?: boolean;
  retryCount?: number;
  onManualReconnect?: () => void;
  trackingProvider?: string | null;
}
 
export function GPSStatusHero({
  deviceName,
  isConnected,
  isParked = false,
  lastSeenLabel,
  isReconnecting = false,
  retryCount = 0,
  onManualReconnect,
  trackingProvider,
}: GPSStatusHeroProps) {
   const cleanDeviceName = deviceName?.replace(/geotab/gi, "GPS").replace(/\s+/g, " ").trim() || null;
   const showReconnecting = isReconnecting && !isConnected && !isParked;
 
    return (
      <motion.div 
        style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
          border: "0.5px solid rgba(0,0,0,0.06)",
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ padding: "12px 16px" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: isConnected ? "rgba(15,158,117,0.12)" : isParked ? "rgba(245,166,35,0.12)" : "rgba(142,142,147,0.12)" }}>
                {isConnected ? (
                  <Radio className="h-4 w-4" style={{ color: "#0f9e75" }} />
                ) : isParked ? (
                  <Car className="h-4 w-4" style={{ color: "#f5a623" }} />
                ) : showReconnecting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ color: "#8e8e93" }} />
                ) : (
                  <WifiOff className="h-4 w-4" style={{ color: "#8e8e93" }} />
                )}
              </div>
              {(isConnected || isParked) && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${isParked ? "bg-amber-400" : "bg-emerald-500"}`}></span>
                </span>
              )}
            </div>
            
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1e" }}>
                {isConnected ? "Connected" : isParked ? "Parked" : showReconnecting ? "Reconnecting…" : "Offline"}
              </h2>
              {!showReconnecting && (
                <p style={{ fontSize: 12, color: "#8e8e93", fontWeight: 400 }}>
                  {trackingProvider ? (
                    <span>
                      <span style={{ textTransform: "uppercase", fontWeight: 600 }}>{trackingProvider === "radius" ? "RADIUS" : trackingProvider}</span>
                      {" · "}
                      {isParked ? (cleanDeviceName || "Ignition Off") : (cleanDeviceName || "GPS Tracker")}
                    </span>
                  ) : (
                    isParked ? (cleanDeviceName || "Ignition Off") : (cleanDeviceName || "GPS Tracker")
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gradient line */}
        <div style={{ height: 2, background: "linear-gradient(to right, #0d4fa0, #56a8f5)", borderRadius: 2 }} />

        {/* Offline Actions */}
        <AnimatePresence>
          {!isConnected && !showReconnecting && (
            <motion.div 
              className="px-4 py-2.5 space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-xs text-center" style={{ color: "#8e8e93" }}>
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
    );
  }
