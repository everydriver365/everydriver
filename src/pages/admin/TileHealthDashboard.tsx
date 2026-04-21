import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { RotateCw } from "lucide-react";

interface CheckRow {
  id: string;
  instructor_id: string | null;
  source: string;
  status: "ok" | "warn" | "fail";
  latency_ms: number | null;
  details: any;
  checked_at: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  ok: "text-emerald-600",
  warn: "text-amber-600",
  fail: "text-destructive",
};

export default function TileHealthDashboard() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tile_health_checks")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as CheckRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runNow = async () => {
    setRunning(true);
    try {
      await supabase.functions.invoke("tile-health-check", { body: { mode: "full" } });
      await load();
    } finally {
      setRunning(false);
    }
  };

  if (authLoading) return <div className="p-6">Loading…</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  // Group by (instructor_id, source) — keep latest
  const latest = new Map<string, CheckRow>();
  for (const r of rows) {
    const k = `${r.instructor_id ?? "global"}::${r.source}`;
    if (!latest.has(k)) latest.set(k, r);
  }
  const grouped = Array.from(latest.values());
  const failing = grouped.filter((r) => r.status !== "ok");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tile Health</h1>
          <p className="text-sm text-muted-foreground">
            Latest live-data check per instructor & source.
          </p>
        </div>
        <Button onClick={runNow} disabled={running} size="sm">
          <RotateCw className={running ? "animate-spin" : ""} />
          {running ? "Running…" : "Run check now"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-semibold">{grouped.length}</div>
          <div className="text-xs text-muted-foreground">Tracked sources</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-semibold text-emerald-600">
            {grouped.length - failing.length}
          </div>
          <div className="text-xs text-muted-foreground">Healthy</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-semibold text-destructive">{failing.length}</div>
          <div className="text-xs text-muted-foreground">Issues</div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left p-2">Instructor</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Latency</th>
                <th className="text-left p-2">Checked</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono text-xs">
                    {r.instructor_id ? r.instructor_id.slice(0, 8) : "global"}
                  </td>
                  <td className="p-2">{r.source}</td>
                  <td className={`p-2 font-medium ${SEVERITY_COLOR[r.status]}`}>
                    {r.status}
                  </td>
                  <td className="p-2">{r.latency_ms != null ? `${r.latency_ms}ms` : "—"}</td>
                  <td className="p-2 text-muted-foreground">
                    {formatDistanceToNow(new Date(r.checked_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
