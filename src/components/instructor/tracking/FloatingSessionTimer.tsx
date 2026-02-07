 import { motion } from "framer-motion";
 import { Clock, Route, User, Square } from "lucide-react";
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
       <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden">
         {/* Session Info Header */}
         <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isTestRoute 
                ? "bg-primary/10" 
                : "bg-primary/10"
            }`}>
              {isTestRoute ? (
                <Route className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
           </div>
           <div className="flex-1 min-w-0">
             <p className="font-semibold text-foreground truncate">
               {pupilName || "Test Route"}
             </p>
             <p className="text-xs text-muted-foreground">
               {isTestRoute ? "Recording test route" : "Practice session"}
             </p>
           </div>
           
           {/* Live pulse indicator */}
           <div className="flex items-center gap-1.5">
             <motion.div
               className="w-2 h-2 rounded-full bg-red-500"
               animate={{ opacity: [1, 0.4, 1] }}
               transition={{ duration: 1.5, repeat: Infinity }}
             />
             <span className="text-xs font-medium text-red-500">REC</span>
           </div>
         </div>
 
         {/* Stats Row */}
         <div className="px-4 py-3 flex items-center justify-between">
           {/* Timer */}
           <div className="flex items-center gap-2">
             <Clock className="h-5 w-5 text-muted-foreground" />
             <span className="text-2xl font-bold text-foreground tabular-nums">
               {formatElapsedTime(elapsedSeconds)}
             </span>
           </div>
 
           {/* Divider */}
           <div className="h-8 w-px bg-border" />
 
           {/* Distance */}
           <div className="flex items-center gap-2">
             <Route className="h-5 w-5 text-muted-foreground" />
             <span className="text-2xl font-bold text-foreground tabular-nums">
               {distanceMiles.toFixed(1)}
               <span className="text-sm font-normal text-muted-foreground ml-1">mi</span>
             </span>
           </div>
 
           {/* Divider */}
           <div className="h-8 w-px bg-border" />
 
           {/* Stop Button */}
           <Button
             variant="destructive"
             size="sm"
             className="h-10 px-4 rounded-xl font-semibold"
             onClick={onStop}
             disabled={isStopping}
           >
             {isStopping ? (
               <RefreshCw className="h-4 w-4 animate-spin" />
             ) : (
               <>
                 <Square className="h-4 w-4 mr-1.5" />
                 End
               </>
             )}
           </Button>
         </div>
       </div>
     </motion.div>
   );
 }