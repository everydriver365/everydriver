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
       className="relative overflow-hidden bg-white dark:bg-card rounded-2xl shadow-sm"
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
     >
       <div className={`relative px-4 py-3 ${
         isConnected 
           ? "bg-gradient-to-br from-primary via-primary/95 to-primary/85" 
           : isParked
             ? "bg-gradient-to-br from-slate-500 to-slate-600"
             : showReconnecting 
               ? "bg-gradient-to-br from-slate-600 to-slate-700"
               : "bg-gradient-to-br from-primary/70 via-primary/55 to-primary/40"
       }`}>
         <div className={`relative flex items-center ${showReconnecting ? "justify-center gap-2" : "justify-between"}`}>
           <div className={`flex items-center ${showReconnecting ? "gap-2" : "gap-3"}`}>
             <div className="relative">
               <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20">
                 {isConnected ? (
                   <Radio className="h-4 w-4 text-white" />
                 ) : isParked ? (
                   <Car className="h-4 w-4 text-white" />
                 ) : showReconnecting ? (
                   <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
                 ) : (
                   <WifiOff className="h-4 w-4 text-white" />
                 )}
               </div>
               {(isConnected || isParked) && (
                 <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                   {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                   <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${isParked ? "bg-amber-400" : "bg-emerald-500"}`}></span>
                 </span>
               )}
             </div>
             
             <div className="text-white">
               <h2 className={`font-bold ${showReconnecting ? "text-sm" : "text-base"}`}>
                 {isConnected ? "Connected" : isParked ? "Parked" : showReconnecting ? "Reconnecting" : "Offline"}
               </h2>
               {!showReconnecting && (
                 <p className="text-white/80 text-[11px] font-medium">
                   {trackingProvider ? (
                     <span>
                       <span className="uppercase font-semibold">{trackingProvider === "radius" ? "Radius" : trackingProvider}</span>
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
       </div>

       {/* Offline Actions */}
       <AnimatePresence>
         {!isConnected && !showReconnecting && (
           <motion.div 
             className="px-4 py-2.5 space-y-2"
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
   );
 }
