import { useState } from "react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useGeotabDriverEvents } from "@/hooks/useGeotabDriverEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shield, Gauge, ArrowDown, ArrowUp, CornerDownRight, MapPin, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

const eventIcons: Record<string, typeof Gauge> = {
  speeding: Gauge,
  harsh_accel: ArrowUp,
  harsh_brake: ArrowDown,
  harsh_corner: CornerDownRight,
};

const eventLabels: Record<string, string> = {
  speeding: "Speeding",
  harsh_accel: "Harsh Acceleration",
  harsh_brake: "Harsh Braking",
  harsh_corner: "Sharp Cornering",
};

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  critical: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

export function GeotabDriverBehaviourTab() {
  const { instructor } = useInstructorAuth();
  const [syncing, setSyncing] = useState(false);
  const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data, isLoading, refetch } = useGeotabDriverEvents(instructor?.id, fromDate);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await supabase.functions.invoke("geotab-behaviour-sync", {
        body: { instructorId: instructor?.id, hoursBack: 168 },
      });
      await refetch();
      toast.success("Behaviour data synced");
    } catch {
      toast.error("Sync failed");
    }
    setSyncing(false);
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>;

  const scores = data?.scores || { overall: 100, speed: 100, acceleration: 100, braking: 100, cornering: 100 };
  const events = data?.events || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Last 7 Days</h3>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
          Sync Now
        </Button>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`h-16 w-16 rounded-full border-4 flex items-center justify-center ${scores.overall >= 80 ? "border-emerald-500" : scores.overall >= 60 ? "border-amber-500" : "border-red-500"}`}>
            <span className={`text-xl font-bold ${scoreColor(scores.overall)}`}>{scores.overall}</span>
          </div>
          <div>
            <p className="font-semibold">Driving Score</p>
            <p className="text-xs text-muted-foreground">{events.length} events detected</p>
          </div>
        </CardContent>
      </Card>

      {/* Sub-scores */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { key: "speed", label: "Speed", icon: Gauge },
          { key: "acceleration", label: "Acceleration", icon: ArrowUp },
          { key: "braking", label: "Braking", icon: ArrowDown },
          { key: "cornering", label: "Cornering", icon: CornerDownRight },
        ] as const).map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{label}</span>
                <span className={`text-xs font-bold ml-auto ${scoreColor(scores[key])}`}>{scores[key]}</span>
              </div>
              <Progress value={scores[key]} className={`h-1.5 [&>div]:${scoreBg(scores[key])}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <Shield className="h-8 w-8 mx-auto text-emerald-500/40 mb-2" />
              <p className="text-sm text-muted-foreground">No driving events detected — great driving!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {events.slice(0, 50).map(ev => {
                const Icon = eventIcons[ev.event_type] || Shield;
                return (
                  <div key={ev.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/50">
                    <div className="p-1.5 rounded-2xl bg-muted">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{eventLabels[ev.event_type] || ev.event_type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ev.started_at ? formatDistanceToNow(new Date(ev.started_at), { addSuffix: true }) : "Unknown time"}
                        {ev.speed_kmh ? ` · ${Math.round(ev.speed_kmh * 0.621371)} mph` : ""}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${severityColors[ev.severity] || ""}`}>{ev.severity}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
