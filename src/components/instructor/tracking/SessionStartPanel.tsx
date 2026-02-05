 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Play, Flag, CheckCircle, User, ChevronDown, Car, Route } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 interface Pupil {
   id: string;
   name: string;
 }
 
 type SessionType = "practice" | "test";
 
 interface SessionStartPanelProps {
   pupils: Pupil[];
   selectedPupilId: string;
   onPupilChange: (pupilId: string) => void;
   onStartSession: (type: SessionType) => void;
   onOpenDrivingTestDialog: () => void;
   isStarting: boolean;
   isConnected: boolean;
 }
 
 export function SessionStartPanel({
   pupils,
   selectedPupilId,
   onPupilChange,
   onStartSession,
   onOpenDrivingTestDialog,
   isStarting,
   isConnected,
 }: SessionStartPanelProps) {
   const [sessionType, setSessionType] = useState<SessionType>(
     selectedPupilId ? "practice" : "test"
   );
   const [showPupilList, setShowPupilList] = useState(false);
 
   // Auto-switch to test route when no pupil selected
   const effectiveSessionType = selectedPupilId ? sessionType : "test";
   const selectedPupil = pupils.find(p => p.id === selectedPupilId);
 
   const handleStartClick = () => {
     onStartSession(effectiveSessionType);
   };
 
   const handlePupilSelect = (pupilId: string) => {
     onPupilChange(pupilId);
     setShowPupilList(false);
   };
 
   return (
     <motion.div 
       className="bg-white dark:bg-card rounded-3xl shadow-xl overflow-hidden"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.4, delay: 0.1 }}
     >
       {/* Header */}
       <div className="px-5 pt-5 pb-3">
         <h3 className="text-lg font-bold text-foreground">Start Tracking</h3>
         <p className="text-sm text-muted-foreground">Select a pupil or record a test route</p>
       </div>
 
       <div className="px-5 pb-5 space-y-4">
         {/* Pupil Selector - Custom Dropdown */}
         <div className="relative">
           <button
             onClick={() => setShowPupilList(!showPupilList)}
             className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-muted/50 hover:bg-slate-100 dark:hover:bg-muted transition-colors"
           >
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
               selectedPupilId 
                 ? "bg-emerald-100 dark:bg-emerald-500/20" 
                 : "bg-slate-200 dark:bg-muted"
             }`}>
               {selectedPupilId ? (
                 <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                   {selectedPupil?.name?.charAt(0) || "?"}
                 </span>
               ) : (
                 <Route className="h-5 w-5 text-muted-foreground" />
               )}
             </div>
             <div className="flex-1 text-left">
               <p className="font-semibold text-foreground">
                 {selectedPupil?.name || "No Pupil Selected"}
               </p>
               <p className="text-xs text-muted-foreground">
                 {selectedPupilId ? "Tap to change" : "Test route mode"}
               </p>
             </div>
             <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showPupilList ? "rotate-180" : ""}`} />
           </button>
 
           {/* Pupil List Dropdown */}
           <AnimatePresence>
             {showPupilList && (
               <motion.div
                 className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-64 overflow-y-auto"
                 initial={{ opacity: 0, y: -10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: -10, scale: 0.95 }}
                 transition={{ duration: 0.2 }}
               >
                 {/* No Pupil Option */}
                 <button
                   onClick={() => handlePupilSelect("")}
                   className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors ${
                     !selectedPupilId ? "bg-slate-50 dark:bg-muted/50" : ""
                   }`}
                 >
                   <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-muted flex items-center justify-center">
                     <Route className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <div className="text-left">
                     <p className="font-medium text-foreground">No Pupil</p>
                     <p className="text-xs text-muted-foreground">Record a test route</p>
                   </div>
                   {!selectedPupilId && (
                     <CheckCircle className="h-5 w-5 text-emerald-500 ml-auto" />
                   )}
                 </button>
 
                 {/* Pupil List */}
                 {pupils
                   .filter((pupil) => pupil.id && pupil.id.trim() !== "")
                   .map((pupil) => (
                     <button
                       key={pupil.id}
                       onClick={() => handlePupilSelect(pupil.id)}
                       className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors ${
                         selectedPupilId === pupil.id ? "bg-slate-50 dark:bg-muted/50" : ""
                       }`}
                     >
                       <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                         <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                           {pupil.name?.charAt(0) || "?"}
                         </span>
                       </div>
                       <p className="font-medium text-foreground text-left flex-1">{pupil.name}</p>
                       {selectedPupilId === pupil.id && (
                         <CheckCircle className="h-5 w-5 text-emerald-500" />
                       )}
                     </button>
                   ))}
               </motion.div>
             )}
           </AnimatePresence>
         </div>
 
         {/* Session Type Toggle - Only show when pupil is selected */}
         <AnimatePresence>
           {selectedPupilId && (
             <motion.div 
               className="flex gap-2 p-1.5 bg-slate-100 dark:bg-muted/50 rounded-2xl"
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
             >
               <button
                 onClick={() => setSessionType("practice")}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                   sessionType === "practice"
                     ? "bg-white dark:bg-card shadow-md text-emerald-600 dark:text-emerald-400"
                     : "text-muted-foreground hover:text-foreground"
                 }`}
               >
                 <Car className="h-4 w-4" />
                 Practice
               </button>
               <button
                 onClick={() => setSessionType("test")}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                   sessionType === "test"
                     ? "bg-white dark:bg-card shadow-md text-amber-600 dark:text-amber-400"
                     : "text-muted-foreground hover:text-foreground"
                 }`}
               >
                 <Flag className="h-4 w-4" />
                 Test Route
               </button>
             </motion.div>
           )}
         </AnimatePresence>
 
         {/* Start Button */}
         <div className="flex gap-3">
           <Button 
             size="lg"
             className={`flex-1 h-16 text-lg font-bold rounded-2xl shadow-lg transition-all ${
               effectiveSessionType === "test" 
                 ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white" 
                 : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
             }`}
             onClick={handleStartClick}
             disabled={isStarting}
           >
             {isStarting ? (
               <motion.div
                 className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full"
                 animate={{ rotate: 360 }}
                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               />
             ) : (
               <>
                 <Play className="h-6 w-6 mr-2" />
                 {effectiveSessionType === "test" ? "Start Test Route" : "Start Session"}
               </>
             )}
           </Button>
 
           {/* Driving Test Button */}
           <Button 
             size="lg"
             variant="outline"
             className="h-16 w-16 rounded-2xl border-2 border-dashed hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
             onClick={onOpenDrivingTestDialog}
             disabled={isStarting}
             title="Record Official Driving Test"
           >
             <CheckCircle className="h-7 w-7 text-muted-foreground" />
           </Button>
         </div>
 
         {/* Helper Text */}
         <p className="text-xs text-center text-muted-foreground pt-1">
           {selectedPupilId 
             ? effectiveSessionType === "test" 
               ? "Recording test route for reference"
               : `Tracking session for ${selectedPupil?.name}`
             : "Recording without pupil assignment"
           }
         </p>
       </div>
     </motion.div>
   );
 }
