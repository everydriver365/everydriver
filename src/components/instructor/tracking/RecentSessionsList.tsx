import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clock, MapPin, Play, RotateCcw, Camera, ExternalLink } from "lucide-react";
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
      {/* Recent Trips trigger card */}
      <div style={{
        background: "white",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
        border: "0.5px solid rgba(0,0,0,0.06)",
      }}>
        <CollapsibleTrigger className="w-full" style={{ background: "transparent", border: "none" }}>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f2f2f7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <RotateCcw style={{ width: 18, height: 18, color: "#8e8e93" }} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1e" }}>Recent Trips</p>
              <p style={{ fontSize: 12, color: "#8e8e93" }}>{sessions.length} recent sessions</p>
            </div>
            <ChevronRight style={{ width: 14, height: 14, color: "#c7c7cc", transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                style={{ padding: "0 12px 12px" }}
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                 {sessions.map((session, index) => (
                   <motion.button
                     key={session.id}
                     className="w-full"
                     style={{
                       display: "flex",
                       alignItems: "center",
                       gap: 12,
                       padding: 12,
                       borderRadius: 16,
                       background: "#f9f9fb",
                       border: "none",
                       cursor: "pointer",
                       textAlign: "left",
                       width: "100%",
                     }}
                     onClick={() => navigate(`/instructor/trip-replay/${session.id}`)}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: index * 0.05 }}
                   >
                     <div style={{
                       width: 36, height: 36, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                       background: session.pupilName ? "rgba(16,185,129,0.1)" : "rgba(245,166,35,0.1)",
                     }}>
                       {session.pupilName ? (
                         <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>
                           {session.pupilName.charAt(0)}
                         </span>
                       ) : (
                         <MapPin style={{ width: 16, height: 16, color: "#f5a623" }} />
                       )}
                     </div>
                     <div style={{ flex: 1, minWidth: 0 }}>
                       <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                         {session.pupilName || "Test Route"}
                       </p>
                       <p style={{ fontSize: 11, color: "#8e8e93" }}>
                         {formatDistanceToNow(session.startedAt, { addSuffix: true })}
                       </p>
                     </div>
                     <div style={{ textAlign: "right" }}>
                       <p style={{ fontSize: 12, fontWeight: 600, color: "#1c1c1e" }}>{formatDistance(session.distanceKm)}</p>
                       <p style={{ fontSize: 11, color: "#8e8e93", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                         <Clock style={{ width: 11, height: 11 }} />
                         {formatDuration(session.durationMinutes)}
                       </p>
                     </div>
                     <Play style={{ width: 14, height: 14, color: "#c7c7cc" }} />
                   </motion.button>
                 ))}

                 {/* Dashcam Portal Link */}
                 <button
                   onClick={() => window.open("https://www.kinesisfleetpro.com/#/login;next=%2Fstatus", "_blank", "noopener,noreferrer")}
                   style={{
                     width: "100%",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     gap: 8,
                     padding: 10,
                     borderRadius: 16,
                     background: "#f2f2f7",
                     border: "none",
                     cursor: "pointer",
                     fontSize: 13,
                     color: "#8e8e93",
                   }}
                 >
                   <Camera style={{ width: 14, height: 14 }} />
                   <span>View Dashcam Footage</span>
                   <ExternalLink style={{ width: 12, height: 12 }} />
                 </button>
              </motion.div>
           )}
          </AnimatePresence>
        </CollapsibleContent>

      </div>
    </Collapsible>
  );
}
