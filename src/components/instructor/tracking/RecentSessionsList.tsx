 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { ChevronDown, Clock, MapPin, Play, RotateCcw } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { formatDistanceToNow } from "date-fns";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 
 interface RecentSession {
   id: string;
   pupilName: string | null;
   startedAt: Date;
   distanceKm: number;
   durationMinutes: number;
 }
 
 interface RecentSessionsListProps {
   instructorId: string;
 }
 
 export function RecentSessionsList({ instructorId }: RecentSessionsListProps) {
   const [sessions, setSessions] = useState<RecentSession[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const navigate = useNavigate();
 
   useEffect(() => {
     const fetchRecentSessions = async () => {
       setIsLoading(true);
       try {
        const { data, error } = await supabase
            .from("lesson_telematics")
            .select("id, started_at, ended_at, total_distance_km, pupil_id")
            .eq("instructor_id", instructorId)
            .not("ended_at", "is", null)
            .order("started_at", { ascending: false })
            .limit(5);

          if (error) throw error;

          // Fetch pupil names for sessions that have a pupil_id
          const pupilIds = [...new Set((data || []).map((s: any) => s.pupil_id).filter(Boolean))];
          let pupilMap: Record<string, string> = {};
          if (pupilIds.length > 0) {
            const { data: pupils } = await supabase
              .from("pupils")
              .select("id, name")
              .in("id", pupilIds);
            if (pupils) {
              pupilMap = Object.fromEntries(pupils.map(p => [p.id, p.name]));
            }
          }

          const formatted = (data || []).map((s: any) => {
            const startedAt = new Date(s.started_at);
            const endedAt = new Date(s.ended_at);
            const durationMinutes = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000);
            
            return {
              id: s.id,
              pupilName: s.pupil_id ? (pupilMap[s.pupil_id] || null) : null,
              startedAt,
              distanceKm: s.total_distance_km || 0,
              durationMinutes,
            };
          });
 
         setSessions(formatted);
       } catch (err) {
         console.error("Error fetching recent sessions:", err);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchRecentSessions();
   }, [instructorId]);
 
   const formatDistance = (km: number) => {
     const miles = km * 0.621371;
     return miles < 0.1 ? "< 0.1 mi" : `${miles.toFixed(1)} mi`;
   };
 
   const formatDuration = (minutes: number) => {
     if (minutes < 1) return "< 1 min";
     if (minutes < 60) return `${minutes} min`;
     const hours = Math.floor(minutes / 60);
     const mins = minutes % 60;
     return `${hours}h ${mins}m`;
   };
 
   if (isLoading || sessions.length === 0) return null;
 
   return (
     <Collapsible open={isOpen} onOpenChange={setIsOpen}>
       <motion.div
         className="bg-white dark:bg-card rounded-2xl shadow-lg overflow-hidden"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.2 }}
       >
         <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-muted/30 transition-colors">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-muted flex items-center justify-center">
               <RotateCcw className="h-5 w-5 text-muted-foreground" />
             </div>
             <div className="text-left">
               <p className="font-semibold text-foreground">Recent Trips</p>
               <p className="text-xs text-muted-foreground">{sessions.length} recent sessions</p>
             </div>
           </div>
           <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
         </CollapsibleTrigger>
 
         <CollapsibleContent>
           <AnimatePresence>
             {isOpen && (
               <motion.div
                 className="px-4 pb-4 space-y-2"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
               >
                 {sessions.map((session, index) => (
                   <motion.button
                     key={session.id}
                     className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-muted/50 hover:bg-slate-100 dark:hover:bg-muted transition-colors text-left"
                     onClick={() => navigate(`/instructor/trip-replay/${session.id}`)}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: index * 0.05 }}
                   >
                     <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                       session.pupilName 
                         ? "bg-emerald-100 dark:bg-emerald-500/20" 
                         : "bg-amber-100 dark:bg-amber-500/20"
                     }`}>
                       {session.pupilName ? (
                         <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                           {session.pupilName.charAt(0)}
                         </span>
                       ) : (
                         <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-sm text-foreground truncate">
                         {session.pupilName || "Test Route"}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {formatDistanceToNow(session.startedAt, { addSuffix: true })}
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-xs font-medium text-foreground">{formatDistance(session.distanceKm)}</p>
                       <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                         <Clock className="h-3 w-3" />
                         {formatDuration(session.durationMinutes)}
                       </p>
                     </div>
                     <Play className="h-4 w-4 text-muted-foreground" />
                   </motion.button>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
         </CollapsibleContent>
       </motion.div>
     </Collapsible>
   );
 }