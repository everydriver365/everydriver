import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Row {
  instructor_id: string;
  instructor_name: string;
  is_active: boolean;
  calendar_id: string;
  last_sync: string | null;
  last_sync_age_minutes: number | null;
  sync_error: string | null;
  webhook_channel_id: string | null;
  webhook_expires_at: string | null;
  webhook_hours_to_expiry: number | null;
  webhook_last_error: string | null;
  queue_pending: number;
  queue_failed: number;
}

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_start: string | null;
  last_run_end: string | null;
  last_status: string | null;
  last_error: string | null;
}

interface Stats {
  summary: {
    total: number;
    stale: number;
    webhook_expiring: number;
    with_error: number;
    queue_pending_total: number;
    queue_failed_total: number;
  };
  rows: Row[];
  cron: CronJob[];
  generated_at: string;
}

const statusDot = (kind: "ok" | "warn" | "bad") => {
  const color = kind === "ok" ? "bg-emerald-500" : kind === "warn" ? "bg-amber-500" : "bg-rose-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
};

export default function SyncHealthDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-health-stats");
      if (error) throw error;
      setStats(data as Stats);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load sync health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const forceSync = async (instructorId: string) => {
    setActionId(instructorId + ":sync");
    try {
      const { error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "syncCalendar", instructorId },
      });
      if (error) throw error;
      toast.success("Sync triggered");
      await load();
    } catch (e) {
      toast.error("Sync failed");
    } finally {
      setActionId(null);
    }
  };

  const renewWebhook = async (instructorId: string) => {
    setActionId(instructorId + ":hook");
    try {
      const { error } = await supabase.functions.invoke("renew-google-calendar-webhooks", {
        body: { instructorId },
      });
      if (error) throw error;
      toast.success("Webhook renewal triggered");
      await load();
    } catch (e) {
      toast.error("Renewal failed");
    } finally {
      setActionId(null);
    }
  };

  const s = stats?.summary;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Sync Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Google Calendar sync status across all connected instructors. Auto-refreshes every 60s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <SummaryTile label="Connected" value={s?.total ?? "—"} icon={CalendarIcon} tone="info" />
        <SummaryTile label="Stale (>30m)" value={s?.stale ?? "—"} icon={Clock} tone={s?.stale ? "bad" : "ok"} />
        <SummaryTile label="Webhooks <24h" value={s?.webhook_expiring ?? "—"} icon={AlertTriangle} tone={s?.webhook_expiring ? "warn" : "ok"} />
        <SummaryTile label="With errors" value={s?.with_error ?? "—"} icon={AlertTriangle} tone={s?.with_error ? "bad" : "ok"} />
        <SummaryTile label="Queue pending" value={s?.queue_pending_total ?? "—"} icon={Clock} tone={s && s.queue_pending_total > 5 ? "warn" : "ok"} />
        <SummaryTile label="Queue failed" value={s?.queue_failed_total ?? "—"} icon={AlertTriangle} tone={s?.queue_failed_total ? "bad" : "ok"} />
      </div>

      {/* Per-instructor */}
      <Card>
        <CardHeader>
          <CardTitle>Per-instructor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Last sync</TableHead>
                <TableHead>Webhook expiry</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="text-right">Queue (pend/fail)</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No connected calendars</TableCell></TableRow>
              )}
              {stats?.rows.map((r) => {
                const staleKind: "ok" | "warn" | "bad" =
                  r.last_sync_age_minutes == null ? "bad" :
                  r.last_sync_age_minutes > 60 ? "bad" :
                  r.last_sync_age_minutes > 30 ? "warn" : "ok";
                const err = r.sync_error || r.webhook_last_error;
                return (
                  <TableRow key={r.instructor_id}>
                    <TableCell>{statusDot(err ? "bad" : staleKind)}</TableCell>
                    <TableCell className="font-medium">{r.instructor_name}</TableCell>
                    <TableCell className="text-xs">
                      {r.last_sync
                        ? `${formatDistanceToNow(new Date(r.last_sync))} ago`
                        : <span className="text-rose-600">Never</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.webhook_expires_at ? (
                        <span className={
                          r.webhook_hours_to_expiry != null && r.webhook_hours_to_expiry < 0 ? "text-rose-600" :
                          r.webhook_hours_to_expiry != null && r.webhook_hours_to_expiry < 24 ? "text-amber-600" : ""
                        }>
                          {r.webhook_hours_to_expiry != null
                            ? r.webhook_hours_to_expiry < 0
                              ? `Expired ${Math.abs(r.webhook_hours_to_expiry)}h ago`
                              : `${r.webhook_hours_to_expiry}h`
                            : "—"}
                        </span>
                      ) : <span className="text-muted-foreground">No webhook</span>}
                    </TableCell>
                    <TableCell className="text-xs text-rose-600 max-w-[260px] truncate" title={err || ""}>
                      {err || ""}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      <span className={r.queue_pending > 0 ? "text-amber-600" : ""}>{r.queue_pending}</span>
                      {" / "}
                      <span className={r.queue_failed > 0 ? "text-rose-600 font-semibold" : ""}>{r.queue_failed}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" disabled={!!actionId} onClick={() => forceSync(r.instructor_id)}>
                          {actionId === r.instructor_id + ":sync" ? "…" : "Sync"}
                        </Button>
                        <Button size="sm" variant="outline" disabled={!!actionId} onClick={() => renewWebhook(r.instructor_id)}>
                          {actionId === r.instructor_id + ":hook" ? "…" : "Renew hook"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cron */}
      <Card>
        <CardHeader>
          <CardTitle>Cron jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stats?.cron ?? []).length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No cron data</TableCell></TableRow>
              )}
              {stats?.cron.map((c) => {
                const ok = c.last_status === "succeeded";
                return (
                  <TableRow key={c.jobid}>
                    <TableCell>{statusDot(!c.active ? "bad" : ok ? "ok" : c.last_status ? "bad" : "warn")}</TableCell>
                    <TableCell className="font-mono text-xs">{c.jobname}</TableCell>
                    <TableCell className="font-mono text-xs">{c.schedule}</TableCell>
                    <TableCell className="text-xs">{c.last_run_start ? `${formatDistanceToNow(new Date(c.last_run_start))} ago` : "—"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={ok ? "secondary" : "destructive"}>{c.last_status ?? "n/a"}</Badge>
                      {c.last_error && <span className="ml-2 text-rose-600 text-[10px]">{c.last_error.slice(0, 80)}</span>}
                    </TableCell>
                    <TableCell>{c.active ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-rose-500" />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {stats && (
        <p className="text-xs text-muted-foreground text-right">
          Generated {formatDistanceToNow(new Date(stats.generated_at))} ago
        </p>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: any;
  tone: "ok" | "warn" | "bad" | "info";
}) {
  const toneClass =
    tone === "bad" ? "border-rose-200 bg-rose-50 dark:bg-rose-950/30" :
    tone === "warn" ? "border-amber-200 bg-amber-50 dark:bg-amber-950/30" :
    tone === "info" ? "border-blue-200 bg-blue-50 dark:bg-blue-950/30" :
    "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30";
  const iconClass =
    tone === "bad" ? "text-rose-600" :
    tone === "warn" ? "text-amber-600" :
    tone === "info" ? "text-blue-600" :
    "text-emerald-600";
  return (
    <div className={`border rounded-xl p-3 ${toneClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
