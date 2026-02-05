 import { motion, AnimatePresence } from "framer-motion";
 import { Wifi, WifiOff, MapPin, Gauge, RefreshCw, ExternalLink, Radio, Navigation } from "lucide-react";
 import { Button } from "@/components/ui/button";
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
     <div className="space-y-4">
       {/* Main Connection Status Card */}
       <motion.div 
         className="relative overflow-hidden bg-white dark:bg-card rounded-3xl shadow-xl"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4 }}
       >
         {/* Connection Status Header */}
         <div className={`relative px-6 py-8 ${
           isConnected 
             ? "bg-gradient-to-br from-emerald-500 to-emerald-600" 
             : showReconnecting 
               ? "bg-gradient-to-br from-slate-500 to-slate-600"
               : "bg-gradient-to-br from-amber-500 to-amber-600"
         }`}>
           {/* Animated background pattern */}
           <div className="absolute inset-0 overflow-hidden">
             <div className={`absolute -top-4 -right-4 w-32 h-32 rounded-full ${
               isConnected ? "bg-emerald-400/20" : showReconnecting ? "bg-slate-400/20" : "bg-amber-400/20"
             }`} />
             <div className={`absolute -bottom-8 -left-8 w-40 h-40 rounded-full ${
               isConnected ? "bg-emerald-400/10" : showReconnecting ? "bg-slate-400/10" : "bg-amber-400/10"
             }`} />
           </div>
           
           <div className="relative flex items-center justify-between">
             <div className="flex items-center gap-4">
               {/* Status Icon with Animation */}
               <div className="relative">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                   isConnected 
                     ? "bg-white/20" 
                     : showReconnecting 
                       ? "bg-white/15" 
                       : "bg-white/20"
                 }`}>
                   {isConnected ? (
                     <Radio className="h-8 w-8 text-white" />
                   ) : showReconnecting ? (
                     <RefreshCw className="h-8 w-8 text-white animate-spin" />
                   ) : (
                     <WifiOff className="h-8 w-8 text-white" />
                   )}
                 </div>
                 
                 {/* Animated pulse ring for connected state */}
                 {isConnected && (
                   <>
                     <span className="absolute inset-0 rounded-2xl animate-ping bg-white/30" style={{ animationDuration: '2s' }} />
                     <span className="absolute -top-1 -right-1 flex h-5 w-5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-5 w-5 bg-white"></span>
                     </span>
                   </>
                 )}
               </div>
               
               <div className="text-white">
                 <h2 className="text-2xl font-bold">
                   {isConnected ? "Connected" : showReconnecting ? "Reconnecting" : "Offline"}
                 </h2>
                 <p className="text-white/80 text-sm font-medium">
                   {deviceName || "GPS Tracker"}
                 </p>
               </div>
             </div>
             
             {/* Live indicator badge */}
             <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
               isConnected 
                 ? "bg-white text-emerald-600" 
                 : showReconnecting 
                   ? "bg-white/20 text-white"
                   : "bg-white text-amber-600"
             }`}>
               {isConnected ? (
                 <span className="flex items-center gap-2">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   LIVE
                 </span>
               ) : showReconnecting ? (
                 `Attempt ${retryCount + 1}`
               ) : (
                 lastSeenLabel
               )}
             </div>
           </div>
         </div>
 
         {/* Telemetry Section - Visible when connected */}
         <AnimatePresence>
           {isConnected && (
             <motion.div 
               className="p-4"
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               transition={{ duration: 0.3 }}
             >
               <div className="grid grid-cols-2 gap-3">
                 {/* Speed Card */}
                 <div className="bg-slate-50 dark:bg-muted/50 rounded-2xl p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                       <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                     </div>
                     <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Speed</span>
                   </div>
                   <p className="text-3xl font-bold text-foreground">
                     {speedKmh != null ? formatMph(speedKmh) : "0 mph"}
                   </p>
                 </div>
                 
                 {/* Location Card */}
                 <div className="bg-slate-50 dark:bg-muted/50 rounded-2xl p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                       <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                     </div>
                     <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</span>
                   </div>
                   <p className="text-sm font-semibold text-foreground truncate">
                     {roadName || "Awaiting..."}
                   </p>
                 </div>
               </div>
             </motion.div>
           )}
         </AnimatePresence>
 
         {/* Offline Actions */}
         <AnimatePresence>
           {!isConnected && !showReconnecting && (
             <motion.div 
               className="p-4 space-y-3"
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
             >
               <p className="text-sm text-muted-foreground text-center">
                 Your GPS tracker appears to be offline. Check that the tracker app is running.
               </p>
               <div className="flex gap-3">
                 {onManualReconnect && (
                   <Button 
                     variant="outline" 
                     size="lg" 
                     className="flex-1 h-12 rounded-xl"
                     onClick={onManualReconnect}
                   >
                     <RefreshCw className="h-4 w-4 mr-2" />
                     Retry
                   </Button>
                 )}
                 <Button 
                   size="lg" 
                   className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600"
                   onClick={openTrackerApp}
                 >
                   <ExternalLink className="h-4 w-4 mr-2" />
                   Open App
                 </Button>
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </motion.div>
     </div>
   );
 }
