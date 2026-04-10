import { motion, AnimatePresence } from "framer-motion";
import { X, Square, MapPin, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { haptics } from "@/lib/haptics";

interface GlanceableTrackingModeProps {
  isActive: boolean;
  onClose: () => void;
  onStop: () => void;
  speedMph: number;
  speedLimitMph: number | null;
  roadName: string | null;
  isConnected: boolean;
}

export function GlanceableTrackingMode({
  isActive,
  onClose,
  onStop,
  speedMph,
  speedLimitMph,
  roadName,
  isConnected,
}: GlanceableTrackingModeProps) {
  const lastSpeedingState = useRef(false);
  const lastHapticTime = useRef(0);
  
  const isSpeeding = speedLimitMph !== null && speedMph > speedLimitMph;
  
  // Haptic feedback when speeding state changes (debounced to prevent constant buzzing)
  useEffect(() => {
    if (isSpeeding && !lastSpeedingState.current) {
      const now = Date.now();
      // Only trigger haptic if at least 10 seconds since last one
      if (now - lastHapticTime.current > 10000) {
        haptics.error();
        lastHapticTime.current = now;
      }
    }
    lastSpeedingState.current = isSpeeding;
  }, [isSpeeding]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex flex-col ${
          isSpeeding ? "bg-destructive" : "bg-background"
        }`}
      >
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant={isSpeeding ? "secondary" : "outline"}
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content - centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Speed display - extra large */}
          <motion.div
            animate={{ scale: isSpeeding ? [1, 1.02, 1] : 1 }}
            transition={{ repeat: isSpeeding ? Infinity : 0, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div
              className={`text-[120px] font-bold leading-none tracking-tight ${
                isSpeeding ? "text-destructive-foreground" : "text-foreground"
              }`}
            >
              {speedMph}
            </div>
            <div
              className={`text-2xl font-medium mt-1 ${
                isSpeeding ? "text-destructive-foreground/80" : "text-muted-foreground"
              }`}
            >
              mph
            </div>
          </motion.div>

          {/* Speed limit comparison */}
          {speedLimitMph !== null && (
            <div className="flex items-center gap-4 mb-8">
              <div
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                  isSpeeding
                    ? "border-destructive-foreground/50 bg-destructive-foreground/10"
                    : "border-destructive bg-background"
                }`}
              >
                <span
                  className={`text-3xl font-bold ${
                    isSpeeding ? "text-destructive-foreground" : "text-foreground"
                  }`}
                >
                  {speedLimitMph}
                </span>
              </div>
              
              {isSpeeding && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-8 w-8 text-destructive-foreground animate-pulse" />
                  <span className="text-xl font-bold text-destructive-foreground">
                    +{speedMph - speedLimitMph}
                  </span>
                </motion.div>
              )}
            </div>
          )}

          {/* Road name */}
          <div
            className={`flex items-center gap-2 text-center px-4 py-3 rounded-none ${
              isSpeeding
                ? "bg-destructive-foreground/10"
                : "bg-muted"
            }`}
          >
            <MapPin
              className={`h-5 w-5 shrink-0 ${
                isSpeeding ? "text-destructive-foreground/70" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-xl font-medium truncate max-w-[280px] ${
                isSpeeding ? "text-destructive-foreground" : "text-foreground"
              }`}
            >
              {roadName || "Unknown road"}
            </span>
          </div>

          {/* Connection status */}
          {!isConnected && (
            <div className="mt-4 flex items-center gap-2 text-amber-500">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-medium">GPS signal lost</span>
            </div>
          )}
        </div>

        {/* Stop button - bottom */}
        <div className="px-6 pb-safe mb-6">
          <Button
            variant={isSpeeding ? "secondary" : "destructive"}
            size="lg"
            onClick={onStop}
            className="w-full h-16 text-lg font-semibold gap-3"
          >
            <Square className="h-6 w-6" />
            Stop Session
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
