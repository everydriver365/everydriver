import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  CircleSlash,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  iwhDowToAwDow,
  mirrorAwToIwh,
  mirrorIwhToAw,
} from "@/lib/syncWeeklyHours";

type Issue = "drift_iwh_only" | "drift_aw_only" | "no_hours" | "future_from";

interface InstructorRow {
  id: string;
  name: string;
  email: string | null;
  available_from: string | null;
  iwhCount: number;
  awCount: number;
  issues: Issue[];
}

interface Stats {
  total: number;
  healthy: number;
  drift: number;
  noHours: number;
  futureFrom: number;
}

type Tab = "all_issues" | "drift" | "no_hours" | "future_from" | "healthy";

const ISSUE_LABELS: Record<Issue, { label: string; tone: "warn" | "error" | "info" }> = {
  drift_iwh_only: { label: "Drift: missing from availability_windows", tone: "warn" },
  drift_aw_only: { label: "Drift: missing from working_hours", tone: "warn" },
  no_hours: { label: "No working hours set", tone: "info" },
  future_from: { label: "Hidden by Available-from date", tone: "info" },
};

export default function AvailabilitySyncHealth() {
  const [rows, setRows] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("all_issues");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");

      // Pull all instructors. (~6k rows; one column each — fine.)
      const { data: instructors, error: iErr } = await supabase
        .from("instructors")
        .select("id, name, email, available_from")
        .order("name");
      if (iErr) throw iErr;

      // Pull every active working-hours row from both tables in parallel.
      const [iwhRes, awRes] = await Promise.all([
        supabase
          .from("instructor_working_hours")
          .select("instructor_id, day_of_week")
          .eq("is_active", true),
        supabase
          .from("availability_windows")
          .select("instructor_id, day_of_week")
          .eq("is_active", true),
      ]);
      if (iwhRes.error) throw iwhRes.error;
      if (awRes.error) throw awRes.error;

      // Build per-instructor day sets, mapping iwh dow → aw dow for direct comparison.
      const iwhDays = new Map<string, Set<number>>();
      for (const r of iwhRes.data ?? []) {
        const set = iwhDays.get(r.instructor_id) ?? new Set<number>();
        set.add(iwhDowToAwDow(r.day_of_week));
        iwhDays.set(r.instructor_id, set);
      }
      const awDays = new Map<string, Set<number>>();
      for (const r of awRes.data ?? []) {
        const set = awDays.get(r.instructor_id) ?? new Set<number>();
        set.add(r.day_of_week);
        awDays.set(r.instructor_id, set);
      }

      const built: InstructorRow[] = (instructors ?? []).map((inst: any) => {
        const iwh = iwhDays.get(inst.id) ?? new Set<number>();
        const aw = awDays.get(inst.id) ?? new Set<number>();
        const issues: Issue[] = [];

        if (iwh.size === 0 && aw.size === 0) {
          issues.push("no_hours");
        } else {
          // Drift: any day present in one table but missing from the other.
          let iwhOnly = false;
          let awOnly = false;
          iwh.forEach((d) => {
            if (!aw.has(d)) iwhOnly = true;
          });
          aw.forEach((d) => {
            if (!iwh.has(d)) awOnly = true;
          });
          if (iwhOnly) issues.push("drift_iwh_only");
          if (awOnly) issues.push("drift_aw_only");
        }

        if (inst.available_from && inst.available_from > todayStr) {
          issues.push("future_from");
        }

        return {
          id: inst.id,
          name: inst.name ?? "(unnamed)",
          email: inst.email ?? null,
          available_from: inst.available_from ?? null,
          iwhCount: iwh.size,
          awCount: aw.size,
          issues,
        };
      });

      setRows(built);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats: Stats = useMemo(() => {
    const s: Stats = { total: rows.length, healthy: 0, drift: 0, noHours: 0, futureFrom: 0 };
    for (const r of rows) {
      const driftish = r.issues.includes("drift_iwh_only") || r.issues.includes("drift_aw_only");
      if (driftish) s.drift++;
      if (r.issues.includes("no_hours")) s.noHours++;
      if (r.issues.includes("future_from")) s.futureFrom++;
      if (r.issues.length === 0) s.healthy++;
    }
    return s;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      // Tab filter
      if (tab === "healthy" && r.issues.length !== 0) return false;
      if (tab === "drift" && !r.issues.some((i) => i.startsWith("drift_"))) return false;
      if (tab === "no_hours" && !r.issues.includes("no_hours")) return false;
      if (tab === "future_from" && !r.issues.includes("future_from")) return false;
      if (tab === "all_issues" && r.issues.length === 0) return false;
      // Search
      if (q && !r.name.toLowerCase().includes(q) && !(r.email ?? "").toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [rows, tab, search]);

  const repair = async (row: InstructorRow) => {
    setBusyId(row.id);
    try {
      // If only one side has data, mirror from that side. If both have data
      // but disagree, prefer iwh → aw (iwh is the canonical editor in settings).
      if (row.iwhCount > 0 && row.awCount === 0) {
        await mirrorIwhToAw(row.id);
      } else if (row.awCount > 0 && row.iwhCount === 0) {
        await mirrorAwToIwh(row.id);
      } else {
        await mirrorIwhToAw(row.id);
      }
      toast.success(`Synced ${row.name}`);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Sync failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-1" /> Admin
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Availability Sync Health</h1>
              <p className="text-sm text-muted-foreground">
                Cross-checks <code>instructor_working_hours</code> and{" "}
                <code>availability_windows</code> for every instructor.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} icon={<CalendarClock className="w-4 h-4" />} />
          <StatCard
            label="Healthy"
            value={stats.healthy}
            icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
          />
          <StatCard
            label="Drift"
            value={stats.drift}
            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
            highlight={stats.drift > 0}
          />
          <StatCard
            label="No hours"
            value={stats.noHours}
            icon={<CircleSlash className="w-4 h-4 text-muted-foreground" />}
          />
          <StatCard
            label="Future from"
            value={stats.futureFrom}
            icon={<CalendarClock className="w-4 h-4 text-blue-600" />}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">Flagged instructors</CardTitle>
              <Input
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-2">
              <TabsList>
                <TabsTrigger value="all_issues">All issues ({stats.total - stats.healthy})</TabsTrigger>
                <TabsTrigger value="drift">Drift ({stats.drift})</TabsTrigger>
                <TabsTrigger value="no_hours">No hours ({stats.noHours})</TabsTrigger>
                <TabsTrigger value="future_from">Future from ({stats.futureFrom})</TabsTrigger>
                <TabsTrigger value="healthy">Healthy ({stats.healthy})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Nothing to show in this view.
              </div>
            ) : (
              <div className="divide-y">
                {filtered.slice(0, 500).map((r) => (
                  <div key={r.id} className="py-3 flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium truncate">{r.name}</div>
                        {r.email && (
                          <span className="text-xs text-muted-foreground truncate">{r.email}</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {r.issues.length === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Healthy
                          </Badge>
                        )}
                        {r.issues.map((iss) => {
                          const cfg = ISSUE_LABELS[iss];
                          return (
                            <Badge
                              key={iss}
                              variant={cfg.tone === "error" ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {cfg.label}
                              {iss === "future_from" && r.available_from && (
                                <> · {format(parseISO(r.available_from), "d MMM yyyy")}</>
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        IWH days: {r.iwhCount} · AW days: {r.awCount}
                      </div>
                    </div>
                    {(r.issues.includes("drift_iwh_only") || r.issues.includes("drift_aw_only")) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => repair(r)}
                        disabled={busyId === r.id}
                      >
                        {busyId === r.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wrench className="w-3 h-3 mr-1" />
                        )}
                        Sync now
                      </Button>
                    )}
                  </div>
                ))}
                {filtered.length > 500 && (
                  <div className="pt-3 text-xs text-muted-foreground text-center">
                    Showing first 500 of {filtered.length}. Refine with search.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-amber-400" : ""}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-semibold mt-1">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
