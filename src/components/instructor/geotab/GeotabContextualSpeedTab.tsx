import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Gauge, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface SpeedingEvent {
  id: string;
  speed_kmh: number;
  speed_limit_kmh: number;
  speed_delta: number;
  severity: string;
  road_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface GeotabContextualSpeedTabProps {
  instructorId?: string;
}

export function GeotabContextualSpeedTab({ instructorId }: GeotabContextualSpeedTabProps) {
  const { instructor } = useInstructorAuth();
  const targetId = instructorId || instructor?.id;

  const { data: events, isLoading } = useQuery({
    queryKey: ["contextual-speeding", targetId],
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from("lesson_telematics")
        .select("id")
        .eq("instructor_id", targetId!)
        .order("started_at", { ascending: false })
        .limit(50);

      if (!sessions?.length) return [];

      const sessionIds = sessions.map(s => s.id);
      const { data: alerts } = await supabase
        .from("telematics_alerts")
        .select("id, speed_kmh, speed_limit_kmh, speed_delta, severity, road_name, latitude, longitude, created_at")
        .in("telematics_id", sessionIds)
        .eq("alert_type", "speeding")
        .not("speed_limit_kmh", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      return (alerts || []) as SpeedingEvent[];
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <h3 className="font-semibold text-lg">No Speeding Events</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No contextual speeding events recorded in recent trips.
          </p>
        </CardContent>
      </Card>
    );
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      default: return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {events.length} Speeding Event{events.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {events.map(event => (
        <Card key={event.id}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <Gauge className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">
                  {Math.round(event.speed_kmh * 0.621371)} mph in a {Math.round(event.speed_limit_kmh * 0.621371)} mph zone
                </p>
                <Badge variant="outline" className={`text-[10px] ${severityColor(event.severity)}`}>
                  +{Math.round(event.speed_delta * 0.621371)} mph
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {event.road_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {event.road_name}
                  </span>
                )}
                <span>{format(new Date(event.created_at), "PPp")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
