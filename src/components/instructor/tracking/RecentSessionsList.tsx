import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clock, MapPin, Play, RotateCcw, Camera, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { pupilAvatarColor, pupilAvatarInitial } from "@/lib/pupilAvatarColor";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

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
      {/* Recent Trips trigger card — premium tile */}
      <div
        style={{
          background: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <CollapsibleTrigger className="w-full" style={{ background: "transparent", border: "none" }}>
          <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#F2F2F4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <RotateCcw size={22} strokeWidth={2} color="#6E6E73" />
            </div>
            <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#000000",
                  letterSpacing: -0.2,
                  fontFamily: FONT_STACK,
                  lineHeight: 1.25,
                }}
              >
                Recent trips
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6E6E73",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  fontFamily: FONT_STACK,
                  marginTop: 3,
                }}
              >
                {sessions.length} recent {sessions.length === 1 ? "session" : "sessions"}
              </div>
            </div>
            <ChevronRight
              style={{
                width: 16,
                height: 16,
                color: "#C7C7CC",
                transition: "transform 0.2s",
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                style={{
                  padding: "0 12px 12px",
                  borderTop: "0.5px solid #E5E5EA",
                  paddingTop: 10,
                }}
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {sessions.map((session, index) => {
                  const avatarBg = session.pupilName
                    ? pupilAvatarColor(session.pupilName)
                    : "#B8801F";
                  return (
                    <motion.button
                      key={session.id}
                      className="w-full"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 10,
                        background: "#FFFFFF",
                        border: "0.5px solid #E5E5EA",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        fontFamily: FONT_STACK,
                      }}
                      onClick={() => navigate(`/instructor/trip-replay/${session.id}`)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: avatarBg,
                          flexShrink: 0,
                        }}
                      >
                        {session.pupilName ? (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#FFFFFF",
                              fontFamily: FONT_STACK,
                            }}
                          >
                            {pupilAvatarInitial(session.pupilName)}
                          </span>
                        ) : (
                          <MapPin size={16} strokeWidth={2} color="#FFFFFF" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#000000",
                            letterSpacing: -0.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {session.pupilName || "Test route"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6E6E73",
                            marginTop: 2,
                          }}
                        >
                          {formatDistanceToNow(session.startedAt, { addSuffix: true })}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#000000",
                            letterSpacing: -0.2,
                          }}
                        >
                          {formatDistance(session.distanceKm)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6E6E73",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            justifyContent: "flex-end",
                            marginTop: 2,
                          }}
                        >
                          <Clock style={{ width: 11, height: 11 }} />
                          {formatDuration(session.durationMinutes)}
                        </div>
                      </div>
                      <Play
                        style={{ width: 14, height: 14, color: "#C7C7CC", flexShrink: 0 }}
                      />
                    </motion.button>
                  );
                })}

                {/* Dashcam Portal Link */}
                <button
                  onClick={() =>
                    window.open(
                      "https://www.kinesisfleetpro.com/#/login;next=%2Fstatus",
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: 10,
                    borderRadius: 10,
                    background: "#FFFFFF",
                    border: "0.5px solid #E5E5EA",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#6E6E73",
                    fontFamily: FONT_STACK,
                  }}
                >
                  <Camera style={{ width: 14, height: 14 }} />
                  <span>View dashcam footage</span>
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
