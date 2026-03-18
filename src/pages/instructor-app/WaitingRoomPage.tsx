import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, ExternalLink, Calendar, Users, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import waitingRoomPromo from "@/assets/waiting-room-promo.jpg";

interface WaitingRoomSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  title: string;
  notes: string | null;
  is_cancelled: boolean;
}

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const [zoomLink, setZoomLink] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sessions, setSessions] = useState<WaitingRoomSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [configRes, sessionsRes] = await Promise.all([
        supabase
          .from("waiting_room_config")
          .select("*")
          .eq("id", "default")
          .maybeSingle(),
        supabase
          .from("waiting_room_sessions")
          .select("*")
          .eq("is_cancelled", false)
          .gte("session_date", new Date().toISOString().split("T")[0])
          .order("session_date", { ascending: true })
          .limit(10),
      ]);

      if (configRes.data) {
        setZoomLink(configRes.data.zoom_link || "");
        setDescription(configRes.data.description || "");
        setIsActive(configRes.data.is_active ?? true);
      }
      setSessions(sessionsRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE dd MMM");
  };

  const nextSession = sessions[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">The Waiting Room</h1>
        </div>
      </div>

      {/* Hero */}
      <div className="relative">
        <img src={waitingRoomPromo} alt="The Waiting Room" className="w-full h-44 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="px-4 -mt-8 relative z-10 space-y-5 pb-8">
          {/* Title block */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">The Waiting Room</h2>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>

          {/* Join Button */}
          {zoomLink && isActive ? (
            <a href={zoomLink} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="default" size="lg" className="w-full gap-2 text-base">
                <Video className="h-5 w-5" />
                Join Zoom Meeting
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </a>
          ) : (
            <div className="rounded-xl bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {!isActive ? "The Waiting Room is currently paused." : "Zoom link coming soon — check back later!"}
              </p>
            </div>
          )}

          {/* Upcoming Sessions */}
          {sessions.length > 0 && (
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Upcoming Sessions
              </p>
              <div className="space-y-2">
                {sessions.map((s, i) => {
                  const isNext = i === 0;
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-4 ${isNext ? "bg-primary/5 border-primary/20" : "bg-card"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{s.title}</p>
                            {isNext && (
                              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold uppercase">
                                Next
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatSessionDate(s.session_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                            </span>
                          </div>
                          {s.notes && (
                            <p className="text-xs text-muted-foreground mt-1.5 italic">
                              {s.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="rounded-xl bg-secondary p-6 text-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No sessions scheduled yet</p>
              <p className="text-xs text-muted-foreground">Check back soon for upcoming dates!</p>
            </div>
          )}

          {zoomLink && (
            <p className="text-xs text-center text-muted-foreground">
              The Zoom link will open in a new tab. Make sure you have Zoom installed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
