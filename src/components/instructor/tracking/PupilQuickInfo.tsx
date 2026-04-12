 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { CalendarClock, Clock, CreditCard, BookOpen, Navigation, History } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { format, differenceInDays, formatDistanceToNow } from "date-fns";
 
 interface PupilStats {
   totalTrackedHours: number;
   totalTrackedMiles: number;
   upcomingTest: { date: Date; centre: string } | null;
   sessionsThisMonth: number;
   totalLessonHours: number;
   prepaidHoursRemaining: number;
   accountBalance: number;
   paymentStatus: string | null;
   lastSessionDate: Date | null;
 }
 
 interface PupilQuickInfoProps {
   pupilId: string;
   pupilName: string;
 }
 
 export function PupilQuickInfo({ pupilId, pupilName }: PupilQuickInfoProps) {
   const [stats, setStats] = useState<PupilStats | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchPupilStats = async () => {
       setIsLoading(true);
       try {
         // Fetch total tracked sessions for this pupil
         const { data: sessions } = await supabase
           .from("lesson_telematics")
           .select("started_at, ended_at, total_distance_km")
           .eq("pupil_id", pupilId)
           .not("ended_at", "is", null);
 
         let totalMinutes = 0;
         let totalDistanceKm = 0;
         const thisMonth = new Date();
         thisMonth.setDate(1);
         thisMonth.setHours(0, 0, 0, 0);
         let sessionsThisMonth = 0;
         let lastSessionDate: Date | null = null;
 
         (sessions || []).forEach((s: any) => {
           const started = new Date(s.started_at);
           const ended = new Date(s.ended_at);
           totalMinutes += (ended.getTime() - started.getTime()) / 60000;
           totalDistanceKm += s.total_distance_km || 0;
           if (started >= thisMonth) sessionsThisMonth++;
           if (!lastSessionDate || started > lastSessionDate) {
             lastSessionDate = started;
           }
         });
 
       // Fetch pupil payment info and lesson hours
       const { data: pupilData } = await supabase
         .from("pupils")
         .select("prepaid_hours, account_balance")
         .eq("id", pupilId)
         .single();
 
       // Fetch completed scheduled lessons to get total hours
       const { data: lessons } = await supabase
         .from("scheduled_lessons")
         .select("duration_hours")
         .eq("pupil_id", pupilId)
         .eq("status", "completed");
 
       const totalLessonHours = (lessons || []).reduce(
         (sum: number, l: any) => sum + (l.duration_hours || 0),
         0
       );
 
       const prepaidHours = (pupilData as any)?.prepaid_hours || 0;
 
         // Fetch upcoming driving test
         const { data: tests } = await supabase
           .from("driving_test_results")
           .select("test_date, test_centres:test_centre_id (name)")
           .eq("pupil_id", pupilId)
           .gte("test_date", new Date().toISOString().split("T")[0])
           .order("test_date", { ascending: true })
           .limit(1);
 
         let upcomingTest = null;
         if (tests && tests.length > 0) {
           upcomingTest = {
             date: new Date(tests[0].test_date),
             centre: (tests[0].test_centres as any)?.name || "Test Centre",
           };
         }
 
         setStats({
           totalTrackedHours: Math.round(totalMinutes / 60 * 10) / 10,
           totalTrackedMiles: Math.round(totalDistanceKm * 0.621371 * 10) / 10,
           upcomingTest,
           sessionsThisMonth,
         totalLessonHours,
         prepaidHoursRemaining: prepaidHours - totalLessonHours,
         accountBalance: (pupilData as any)?.account_balance || 0,
         paymentStatus: null,
           lastSessionDate,
         });
       } catch (err) {
         console.error("Error fetching pupil stats:", err);
       } finally {
         setIsLoading(false);
       }
     };
 
     if (pupilId) {
       fetchPupilStats();
     }
   }, [pupilId]);
 
   if (isLoading || !stats) return null;
 
   const daysUntilTest = stats.upcomingTest 
     ? differenceInDays(stats.upcomingTest.date, new Date())
     : null;
 
   const getPaymentStatusColor = (status: string | null, balance: number) => {
     if (balance > 0) return { bg: "bg-red-100 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400" };
     if (stats.prepaidHoursRemaining > 0) return { bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" };
     if (status === "paid") return { bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" };
     if (status === "overdue") return { bg: "bg-red-100 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400" };
     return { bg: "bg-slate-100 dark:bg-muted", text: "text-muted-foreground" };
   };
 
   const paymentColors = getPaymentStatusColor(stats.paymentStatus, stats.accountBalance);
 
   return (
     <AnimatePresence>
       <motion.div
         className="bg-slate-50 dark:bg-muted/30 rounded-2xl p-3"
         initial={{ opacity: 0, height: 0 }}
         animate={{ opacity: 1, height: "auto" }}
         exit={{ opacity: 0, height: 0 }}
         transition={{ duration: 0.2 }}
       >
         {/* Row 1: Core stats */}
         <div className="grid grid-cols-3 gap-2 mb-2">
           {/* Lesson Hours */}
           <div className="flex items-center gap-2">
             <div className="w-7 h-7 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
               <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
             </div>
             <div>
               <p className="text-[10px] text-muted-foreground">Lessons</p>
               <p className="text-sm font-semibold text-foreground">{stats.totalLessonHours}h</p>
             </div>
           </div>
 
           {/* Tracked Hours */}
           <div className="flex items-center gap-2">
             <div className="w-7 h-7 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
               <Navigation className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
             </div>
             <div>
               <p className="text-[10px] text-muted-foreground">Tracked</p>
               <p className="text-sm font-semibold text-foreground">{stats.totalTrackedHours}h</p>
             </div>
           </div>
 
           {/* Payment Status */}
           <div className="flex items-center gap-2">
             <div className={`w-7 h-7 rounded-2xl flex items-center justify-center ${paymentColors.bg}`}>
               <CreditCard className={`h-3.5 w-3.5 ${paymentColors.text}`} />
             </div>
             <div>
               <p className="text-[10px] text-muted-foreground">Balance</p>
               <p className={`text-sm font-semibold ${stats.accountBalance > 0 ? paymentColors.text : "text-foreground"}`}>
                 {stats.accountBalance > 0 ? `£${stats.accountBalance}` : "Clear"}
               </p>
             </div>
           </div>
         </div>
 
         {/* Row 2: Last session & Test date */}
         <div className="flex items-center gap-4 pt-2 border-t border-border/50">
           {/* Last Session */}
           <div className="flex items-center gap-2 flex-1">
             <div className="w-7 h-7 rounded-2xl bg-slate-200 dark:bg-muted flex items-center justify-center">
               <History className="h-3.5 w-3.5 text-muted-foreground" />
             </div>
             <div>
               <p className="text-[10px] text-muted-foreground">Last Session</p>
               <p className="text-sm font-semibold text-foreground">
                 {stats.lastSessionDate 
                   ? formatDistanceToNow(stats.lastSessionDate, { addSuffix: true })
                   : "No sessions"
                 }
               </p>
             </div>
           </div>
 
           {/* Test Date */}
           {stats.upcomingTest && daysUntilTest !== null && (
             <div className="flex items-center gap-2">
               <div className={`w-7 h-7 rounded-2xl flex items-center justify-center ${
                 daysUntilTest <= 7 
                   ? "bg-red-100 dark:bg-red-500/20" 
                   : "bg-amber-100 dark:bg-amber-500/20"
               }`}>
                 <CalendarClock className={`h-3.5 w-3.5 ${
                   daysUntilTest <= 7 
                     ? "text-red-600 dark:text-red-400" 
                     : "text-amber-600 dark:text-amber-400"
                 }`} />
               </div>
               <div>
                 <p className="text-[10px] text-muted-foreground">Test</p>
                 <p className={`text-sm font-semibold ${
                   daysUntilTest <= 7 ? "text-red-600 dark:text-red-400" : "text-foreground"
                 }`}>
                   {daysUntilTest === 0 ? "Today!" : daysUntilTest === 1 ? "Tomorrow" : `${daysUntilTest}d`}
                 </p>
               </div>
             </div>
           )}
         </div>
       </motion.div>
     </AnimatePresence>
   );
 }