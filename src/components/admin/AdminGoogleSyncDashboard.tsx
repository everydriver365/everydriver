import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GoogleSyncAlertsPanel } from "@/components/admin/GoogleSyncAlertsPanel";
import { CredentialBrokenBanner } from "@/components/admin/CredentialBrokenBanner";
import { CheckCircle2, AlertTriangle, Plug, RefreshCw, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface InstructorRow {
  instructor_id: string;
  name: string;
  last_sync: string | null;
  webhook_expires_at: string | null;
  pending: number;
  failed: number;
}

function webhookBadge(expires: string | null) {
  if (!expires) return <Badge variant="outline" className="bg-muted text-muted-foreground">None</Badge>;
  const t = new Date(expires).getTime();
  const now = Date.now();
  if (t < now) return <Badge className="bg-red-600 text-white hover:bg-red-600">Expired</Badge>;
  if (t - now < 24 * 60 * 60 * 1000) return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Expiring</Badge>;
  return <Badge className="bg-green-600 text-white hover:bg-green-600">Active</Badge>;
}

export function AdminGoogleSyncDashboard() {
  const qc = useQueryClient();
  const [busyInstructor, setBusyInstructor] = useState<string | null>(null);
  const [forcing, setForcing] = useState(false);

  const stats = useQuery({
    queryKey: ["admin-gcal-stats"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [connected, synced, failed, alerts] = await Promise.all([
        supabase.from("instructor_google_service_calendar")
          .select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("calendar_sync_status", "synced").gt("updated_at", since),
        supabase.from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("calendar_sync_status", "failed").gt("updated_at", since),
        supabase.from("google_sync_alerts")
          .select("id", { count: "exact", head: true }).is("resolved_at", null),
      ]);
      return {
        connected: connected.count ?? 0,
        synced: synced.count ?? 0,
        failed: failed.count ?? 0,
        alerts: alerts.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  const rows = useQuery({
    queryKey: ["admin-gcal-instructor-health"],
    queryFn: async (): Promise<InstructorRow[]> => {
      const { data: conns, error } = await supabase
        .from("instructor_google_service_calendar")
        .select("instructor_id, last_sync, webhook_expires_at, is_active")
        .eq("is_active", true);
      if (error) throw error;
      const ids = (conns ?? []).map((c) => c.instructor_id);
      if (ids.length === 0) return [];

      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", ids);
      const nameMap = new Map((instructors ?? []).map((i: any) => [i.id, i.name as string]));

      const nowIso = new Date().toISOString();
      const counts = await Promise.all(
        ids.map(async (id) => {
          const [p, f] = await Promise.all([
            supabase.from("scheduled_lessons")
              .select("id", { count: "exact", head: true })
              .eq("instructor_id", id)
              .eq("calendar_sync_status", "pending")
              .is("deleted_at", null)
              .gt("start_time", nowIso),
            supabase.from("scheduled_lessons")
              .select("id", { count: "exact", head: true })
              .eq("instructor_id", id)
              .eq("calendar_sync_status", "failed")
              .is("deleted_at", null)
              .gt("start_time", nowIso),
          ]);
          return { id, pending: p.count ?? 0, failed: f.count ?? 0 };
        }),
      );
      const countMap = new Map(counts.map((c) => [c.id, c]));

      return (conns ?? []).map((c) => ({
        instructor_id: c.instructor_id,
        name: nameMap.get(c.instructor_id) ?? "Unknown",
        last_sync: c.last_sync,
        webhook_expires_at: c.webhook_expires_at,
        pending: countMap.get(c.instructor_id)?.pending ?? 0,
        failed: countMap.get(c.instructor_id)?.failed ?? 0,
      })).sort((a, b) => (b.failed + b.pending) - (a.failed + a.pending));
    },
    refetchInterval: 60000,
  });

  const requeueForInstructor = async (instructorId: string, name: string) => {
    setBusyInstructor(instructorId);
    try {
      const nowIso = new Date().toISOString();
      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select("id, instructor_id")
        .eq("instructor_id", instructorId)
        .in("calendar_sync_status", ["pending", "failed"])
        .is("deleted_at", null)
        .gt("start_time", nowIso);
      if (error) throw error;
      if (!lessons || lessons.length === 0) {
        toast.info(`No lessons to re-sync for ${name}`);
        return;
      }
      const queueRows = lessons.map((l) => ({
        instructor_id: l.instructor_id,
        lesson_id: l.id,
        action: "syncLesson" as const,
      }));
      const { error: insErr } = await supabase.from("calendar_sync_queue").insert(queueRows);
      if (insErr) throw insErr;
      toast.success(`Re-queued ${lessons.length} lessons for ${name}`);
      qc.invalidateQueries({ queryKey: ["admin-gcal-instructor-health"] });
      qc.invalidateQueries({ queryKey: ["admin-gcal-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Re-sync failed");
    } finally {
      setBusyInstructor(null);
    }
  };

  const forceResyncAll = async () => {
    setForcing(true);
    try {
      const nowIso = new Date().toISOString();
      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select("id, instructor_id")
        .in("calendar_sync_status", ["pending", "failed"])
        .is("deleted_at", null)
        .gt("start_time", nowIso);
      if (error) throw error;
      const count = lessons?.length ?? 0;
      if (count === 0) {
        toast.info("No lessons need re-syncing");
        return;
      }
      const queueRows = lessons!.map((l) => ({
        instructor_id: l.instructor_id,
        lesson_id: l.id,
        action: "syncLesson" as const,
      }));
      const { error: insErr } = await supabase.from("calendar_sync_queue").insert(queueRows);
      if (insErr) throw insErr;

      // Audit trail via raise_google_sync_alert RPC
      await supabase.rpc("raise_google_sync_alert" as any, {
        p_severity: "medium",
        p_category: "other",
        p_title: "Admin force re-sync triggered",
        p_message: `Admin re-queued ${count} lessons for Google Calendar sync.`,
        p_metadata: { count, source: "admin_dashboard" },
        p_instructor_id: null,
        p_lesson_id: null,
      });

      toast.success(`Re-queued ${count} lessons across all instructors`);
      qc.invalidateQueries({ queryKey: ["admin-gcal-instructor-health"] });
      qc.invalidateQueries({ queryKey: ["admin-gcal-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Force re-sync failed");
    } finally {
      setForcing(false);
    }
  };

  const s = stats.data;
  const pendingTotal = rows.data?.reduce((a, r) => a + r.pending + r.failed, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Top — Credential broken banner (only shows when service-account key is rejected) */}
      <CredentialBrokenBanner />

      {/* Section 1 — Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Connected instructors" value={s?.connected} tone="blue" icon={<Plug className="h-5 w-5" />} />
        <StatCard label="Synced last 24h" value={s?.synced} tone="green" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Failed last 24h" value={s?.failed} tone="red" icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Unresolved alerts" value={s?.alerts} tone="red" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {/* Section 2 — Alerts panel */}
      <GoogleSyncAlertsPanel />

      {/* Section 3 — Per-instructor health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Per-instructor sync health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : (rows.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No connected instructors.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Last sync</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.data!.map((r) => (
                    <TableRow key={r.instructor_id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.last_sync ? `${formatDistanceToNow(new Date(r.last_sync))} ago` : "Never"}
                      </TableCell>
                      <TableCell className="text-right">{r.pending}</TableCell>
                      <TableCell className="text-right">
                        <span className={r.failed > 0 ? "text-red-600 font-semibold" : ""}>{r.failed}</span>
                      </TableCell>
                      <TableCell>{webhookBadge(r.webhook_expires_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyInstructor === r.instructor_id || (r.pending + r.failed === 0)}
                          onClick={() => requeueForInstructor(r.instructor_id, r.name)}
                        >
                          {busyInstructor === r.instructor_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>Re-sync</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Force re-sync all */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full" variant="destructive" disabled={forcing}>
            {forcing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Force re-sync all instructors
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force re-sync all instructors?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-queue {pendingTotal} future lesson{pendingTotal === 1 ? "" : "s"} (pending or failed)
              into the calendar sync queue. An audit alert will be recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={forceResyncAll}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label, value, tone, icon,
}: { label: string; value: number | undefined; tone: "green" | "red" | "blue"; icon: React.ReactNode }) {
  const toneClass = tone === "green"
    ? "text-green-600"
    : tone === "red"
    ? "text-red-600"
    : "text-blue-600";
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center gap-2 ${toneClass}`}>{icon}<span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span></div>
        <div className={`text-3xl font-bold mt-2 ${toneClass}`}>{value ?? "—"}</div>
      </CardContent>
    </Card>
  );
}
