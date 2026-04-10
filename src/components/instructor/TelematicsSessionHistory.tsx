import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow } from "date-fns";
import { MapPin, Clock, Gauge, Route, ChevronRight, ArrowLeft } from "lucide-react";

interface TelematicsSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  pupil_name?: string;
}

interface TelematicsSessionHistoryProps {
  instructorId: string;
  onBack: () => void;
  onSelectSession?: (sessionId: string, pupilName: string) => void;
}

export function TelematicsSessionHistory({ 
  instructorId, 
  onBack,
  onSelectSession 
}: TelematicsSessionHistoryProps) {
  const [sessions, setSessions] = useState<TelematicsSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [instructorId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_telematics")
        .select("id, started_at, ended_at, total_distance_km, avg_speed_kmh, max_speed_kmh, pupil_id")
        .eq("instructor_id", instructorId)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch pupil names
      const pupilIds = (data || []).map(s => s.pupil_id).filter(Boolean) as string[];
      let pupilsMap: Record<string, string> = {};
      
      if (pupilIds.length > 0) {
        const { data: pupilsData } = await supabase
          .from("pupils")
          .select("id, name")
          .in("id", pupilIds);
        
        pupilsMap = (pupilsData || []).reduce((acc, p) => {
          acc[p.id] = p.name;
          return acc;
        }, {} as Record<string, string>);
      }

      const sessionsWithPupils: TelematicsSession[] = (data || []).map(s => ({
        id: s.id,
        started_at: s.started_at,
        ended_at: s.ended_at,
        total_distance_km: s.total_distance_km,
        avg_speed_kmh: s.avg_speed_kmh,
        max_speed_kmh: s.max_speed_kmh,
        pupil_name: s.pupil_id ? pupilsMap[s.pupil_id] : undefined
      }));

      setSessions(sessionsWithPupils);
    } catch (error) {
      console.error("Error fetching telematics sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In progress";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base">Previous Sessions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-none animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Route className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No previous sessions found</p>
            <p className="text-sm mt-1">Start tracking to record sessions</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession?.(session.id, session.pupil_name || "Pupil")}
                  className="w-full text-left p-3 bg-muted/30 hover:bg-muted/50 rounded-none transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(session.started_at), "EEE, d MMM yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.started_at), "h:mm a")} · {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {session.pupil_name && (
                      <Badge variant="secondary" className="text-xs">
                        {session.pupil_name}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.started_at, session.ended_at)}
                    </div>
                    
                    {session.total_distance_km !== null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {(session.total_distance_km * 0.621371).toFixed(1)} mi
                      </div>
                    )}
                    
                    {session.avg_speed_kmh !== null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Gauge className="h-3 w-3" />
                        Avg {Math.round(session.avg_speed_kmh * 0.621371)} mph
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}