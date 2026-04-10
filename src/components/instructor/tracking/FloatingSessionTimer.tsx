 import { motion } from "framer-motion";
 import { Clock, Route, Square } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { RefreshCw } from "lucide-react";
 
 interface FloatingSessionTimerProps {
   elapsedSeconds: number;
   distanceMiles: number;
   pupilName: string | null;
   isTestRoute: boolean;
   onStop: () => void;
   isStopping: boolean;
 }
 
 export function FloatingSessionTimer({
   elapsedSeconds,
   distanceMiles,
   pupilName,
   isTestRoute,
   onStop,
   isStopping,
 }: FloatingSessionTimerProps) {
   const formatElapsedTime = (seconds: number) => {
     const hrs = Math.floor(seconds / 3600);
     const mins = Math.floor((seconds % 3600) / 60);
     const secs = seconds % 60;
     
     if (hrs > 0) {
       return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
     }
     return `${mins}:${secs.toString().padStart(2, "0")}`;
   };
 
   return (
     <motion.div
       className="fixed bottom-[140px] left-4 right-4 z-40"
       initial={{ y: 100, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       exit={{ y: 100, opacity: 0 }}
       transition={{ type: "spring", damping: 25, stiffness: 300 }}
     >
        <div className="bg-card/95 backdrop-blur-xl rounded-none shadow-2xl border border-border px-3 py-2.5 flex items-center gap-3">
          {/* Live pulse */}
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] font-semibold text-red-500">REC</span>
          </div>

          {/* Pupil name */}
          <span className="text-sm font-semibold text-foreground truncate min-w-0">
            {pupilName || "Test Route"}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Timer */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground tabular-nums">
              {formatElapsedTime(elapsedSeconds)}
            </span>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Distance */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Route className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground tabular-nums">
              {distanceMiles.toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">mi</span>
            </span>
          </div>

          {/* Stop Button */}
          <Button
            variant="destructive"
            size="sm"
            className="h-8 px-3 rounded-none font-semibold text-xs shrink-0"
            onClick={onStop}
            disabled={isStopping}
          >
            {isStopping ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Square className="h-3.5 w-3.5 mr-1" />
                End
              </>
            )}
          </Button>
        </div>
     </motion.div>
   );
 }