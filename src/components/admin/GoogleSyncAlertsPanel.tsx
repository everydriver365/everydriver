import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Loader2, Eye, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Severity = "critical" | "high" | "medium";
type Category =
  | "key_decode" | "auth_401" | "rate_limit_429" | "webhook"
  | "orphan_lesson" | "queue_stuck" | "service_account_missing" | "other";

interface SyncAlert {
  id: string;
  instructor_id: string | null;
  lesson_id: string | null;
  severity: Severity;
  category: Category;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  created_at: string;
}

const severityStyles: Record<Severity, { badge: string; bar: string; label: string }> = {
  critical: { badge: "bg-red-600 text-white", bar: "border-l-red-600", label: "CRITICAL" },
  high:     { badge: "bg-orange-500 text-white", bar: "border-l-orange-500", label: "HIGH" },
  medium:   { badge: "bg-amber-400 text-amber-950", bar: "border-l-amber-400", label: "MEDIUM" },
};

const categoryLabels: Record<Category, string> = {
  key_decode: "Key decode",
  auth_401: "Auth 401",
  rate_limit_429: "Rate limit 429",
  webhook: "Webhook",
  orphan_lesson: "Orphan lesson",
  queue_stuck: "Queue stuck",
  service_account_missing: "Service account",
  other: "Other",
};

export function GoogleSyncAlertsPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"unresolved" | "all" | Severity>("unresolved");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["google-sync-alerts", filter],
    queryFn: async (): Promise<SyncAlert[]> => {
      let q = supabase
        .from("google_sync_alerts" as never)
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(200);

      if (filter === "unresolved") q = q.is("resolved_at", null);
      else if (filter !== "all") q = q.eq("severity", filter).is("resolved_at", null);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SyncAlert[];
    },
    refetchInterval: 30_000,
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("google-sync-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "google_sync_alerts" }, () => {
        qc.invalidateQueries({ queryKey: ["google-sync-alerts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("google_sync_alerts" as never)
        .update({ resolved_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-sync-alerts"] });
      toast.success("Alert resolved");
    },
  });

  const resolveAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("google_sync_alerts" as never)
        .update({ resolved_at: new Date().toISOString() } as never)
        .is("resolved_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-sync-alerts"] });
      toast.success("All alerts resolved");
    },
  });

  const unresolvedCount = alerts.filter(a => !a.resolved_at).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Google Calendar Sync Alerts
            {unresolvedCount > 0 && (
              <Badge className="bg-red-600 text-white ml-2">{unresolvedCount} unresolved</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-raised on key decode errors, 401, 429, webhook failures, orphan lessons and stuck queue.
          </p>
        </div>
        {unresolvedCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => resolveAllMutation.mutate()} disabled={resolveAllMutation.isPending}>
            {resolveAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
            Resolve All
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["unresolved", "critical", "high", "medium", "all"] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="text-xs capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No alerts — Google Calendar sync is healthy.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const s = severityStyles[alert.severity];
            return (
              <Card key={alert.id} className={`border-l-4 ${s.bar} ${alert.resolved_at ? "opacity-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-[10px] ${s.badge}`}>{s.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{categoryLabels[alert.category]}</Badge>
                        {alert.occurrence_count > 1 && (
                          <Badge variant="secondary" className="text-[10px]">×{alert.occurrence_count}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          last {formatDistanceToNow(new Date(alert.last_seen_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold flex items-start gap-1.5">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                        {alert.message}
                      </p>
                      <div className="text-[11px] text-muted-foreground mt-2 flex gap-3 flex-wrap">
                        {alert.instructor_id && <span>Instructor: {alert.instructor_id.slice(0, 8)}…</span>}
                        {alert.lesson_id && <span>Lesson: {alert.lesson_id.slice(0, 8)}…</span>}
                        <span>First: {formatDistanceToNow(new Date(alert.first_seen_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {!alert.resolved_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolveMutation.isPending}
                        className="shrink-0"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
