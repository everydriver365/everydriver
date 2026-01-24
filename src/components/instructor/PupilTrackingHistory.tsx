import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Route, Clock, MapPin, AlertTriangle, ChevronRight, Car } from "lucide-react";
import { format } from "date-fns";
import SessionRouteReport from "./SessionRouteReport";

interface TrackingSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  speeding_count?: number;
  harsh_braking_count?: number;
}

interface PupilTrackingHistoryProps {
  pupilId: string;
  pupilName: string;
}

export function PupilTrackingHistory({ pupilId, pupilName }: PupilTrackingHistoryProps) {
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [pupilId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_telematics")
        .select("id, started_at, ended_at, total_distance_km, avg_speed_kmh, max_speed_kmh")
        .eq("pupil_id", pupilId)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch event counts for each session
      const sessionsWithCounts = await Promise.all(
        (data || []).map(async (session) => {
          const { count: speedingCount } = await supabase
            .from("driving_behavior_events")
            .select("*", { count: "exact", head: true })
            .eq("telematics_id", session.id)
            .eq("event_type", "speeding");

          const { count: brakingCount } = await supabase
            .from("driving_behavior_events")
            .select("*", { count: "exact", head: true })
            .eq("telematics_id", session.id)
            .eq("event_type", "harsh_braking");

          return {
            ...session,
            speeding_count: speedingCount || 0,
            harsh_braking_count: brakingCount || 0,
          };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error) {
      console.error("Error fetching tracking sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt: string, endedAt: string | null) => {
    if (!endedAt) return "-";
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleViewReport = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowReport(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          Loading tracking history...
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" />
            Tracking History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-muted-foreground">
          No tracking sessions recorded for this pupil yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" />
            Tracking History
            <Badge variant="secondary" className="ml-auto">
              {sessions.length} sessions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[300px]">
            <div className="divide-y">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleViewReport(session.id)}
                  className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{format(new Date(session.started_at), "dd MMM yyyy")}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(session.started_at), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(session.started_at, session.ended_at)}
                      </span>
                      {session.total_distance_km && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.total_distance_km.toFixed(1)} km
                        </span>
                      )}
                      {(session.speeding_count || 0) + (session.harsh_braking_count || 0) > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {(session.speeding_count || 0) + (session.harsh_braking_count || 0)} alerts
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Sheet open={showReport} onOpenChange={setShowReport}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Route Report - {pupilName}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100%-4rem)]">
            {selectedSessionId && (
              <SessionRouteReport
                telematicsId={selectedSessionId}
                onClose={() => setShowReport(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
