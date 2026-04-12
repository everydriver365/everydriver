import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useGeotabImpactEvents, useAcknowledgeImpact } from "@/hooks/useGeotabImpactEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Check, MapPin, Gauge } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const severityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
  medium: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
  high: { color: "text-red-600 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/30" },
  critical: { color: "text-red-800 dark:text-red-200", bg: "bg-red-200 dark:bg-red-900/50 border border-red-300 dark:border-red-700" },
};

export function GeotabImpactTab() {
  const { instructor } = useInstructorAuth();
  const { data: events, isLoading } = useGeotabImpactEvents(instructor?.id);
  const ack = useAcknowledgeImpact();

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>;

  const unacknowledged = (events || []).filter(e => !e.acknowledged);
  const history = (events || []).filter(e => e.acknowledged);

  return (
    <div className="space-y-4">
      {/* Active alerts */}
      {unacknowledged.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Active Alerts
            <Badge variant="destructive" className="text-[10px]">{unacknowledged.length}</Badge>
          </h3>
          {unacknowledged.map(ev => {
            const cfg = severityConfig[ev.severity] || severityConfig.low;
            return (
              <Card key={ev.id} className={`${cfg.bg} border-2`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${cfg.bg} ${cfg.color} text-[10px]`}>{ev.severity.toUpperCase()}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ev.event_time), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium">Impact Detected</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {ev.g_force && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {ev.g_force.toFixed(1)}g
                          </span>
                        )}
                        {ev.speed_kmh != null && (
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" /> {Math.round(ev.speed_kmh * 0.621371)} mph
                          </span>
                        )}
                        {ev.latitude && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {ev.latitude.toFixed(4)}, {ev.longitude?.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => ack.mutate(ev.id)}
                      disabled={ack.isPending}
                    >
                      <Check className="h-3 w-3 mr-1" /> Acknowledge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {unacknowledged.length === 0 && history.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No impact events detected</p>
            <p className="text-xs text-muted-foreground mt-1">High G-force events will appear here automatically</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">History</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {history.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/50 text-xs">
                  <div>
                    <p className="font-medium">
                      {ev.g_force?.toFixed(1)}g impact
                      {ev.speed_kmh != null && ` at ${Math.round(ev.speed_kmh * 0.621371)} mph`}
                    </p>
                    <p className="text-muted-foreground">
                      {formatDistanceToNow(new Date(ev.event_time), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{ev.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
