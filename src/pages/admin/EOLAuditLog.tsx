import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  History,
  Loader2,
  MessageSquare,
  Mic,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO, subDays, startOfDay } from "date-fns";

type Range = "today" | "7d" | "30d" | "all";

interface AuditRow {
  id: string;
  instructor_id: string;
  table_name: string;
  record_id: string;
  created_at: string;
  new_values: any;
}

interface InstructorMini {
  id: string;
  name: string | null;
}

interface GroupedEntry {
  key: string;
  created_at: string;
  instructor_id: string;
  meta: any;
  tables: string[];
  errors: string[];
}

export default function EOLAuditLog() {
  const { user, isAdmin, loading: authLoading } = useAdminAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [instructors, setInstructors] = useState<Record<string, InstructorMini>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!adminUser) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("data_audit_log")
        .select("id, instructor_id, table_name, record_id, created_at, new_values")
        .eq("action", "insert")
        .filter("new_values->>event", "eq", "eol_done")
        .order("created_at", { ascending: false })
        .limit(500);

      if (range !== "all") {
        const since =
          range === "today"
            ? startOfDay(new Date())
            : range === "7d"
              ? subDays(new Date(), 7)
              : subDays(new Date(), 30);
        q = q.gte("created_at", since.toISOString());
      }

      const { data, error } = await q;
      if (cancelled) return;
      if (error) {
        console.error("EOL audit fetch error", error);
        setRows([]);
        setLoading(false);
        return;
      }

      const auditRows = (data as AuditRow[]) ?? [];
      setRows(auditRows);

      // Resolve instructor names in one round-trip.
      const ids = Array.from(new Set(auditRows.map((r) => r.instructor_id)));
      if (ids.length > 0) {
        const { data: insRows } = await supabase
          .from("instructors")
          .select("id, name")
          .in("id", ids);
        const map: Record<string, InstructorMini> = {};
        for (const i of (insRows ?? []) as InstructorMini[]) map[i.id] = i;
        if (!cancelled) setInstructors(map);
      } else {
        setInstructors({});
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [adminUser, range]);

  // Group two-row pairs (lesson_history + lesson_feedback) by completion ts.
  const grouped: GroupedEntry[] = useMemo(() => {
    const map = new Map<string, GroupedEntry>();
    for (const r of rows) {
      const key = `${r.instructor_id}::${
        r.new_values?.client_completed_at ?? `${r.created_at}-${r.record_id}`
      }`;
      const existing = map.get(key);
      if (existing) {
        existing.tables.push(r.table_name);
        if (r.new_values?.error)
          existing.errors.push(`${r.table_name}: ${r.new_values.error}`);
      } else {
        map.set(key, {
          key,
          created_at: r.created_at,
          instructor_id: r.instructor_id,
          meta: r.new_values ?? {},
          tables: [r.table_name],
          errors: r.new_values?.error
            ? [`${r.table_name}: ${r.new_values.error}`]
            : [],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }, [rows]);

  const filtered = useMemo(() => {
    return grouped.filter((g) => {
      if (instructorFilter !== "all" && g.instructor_id !== instructorFilter)
        return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const pupil = (g.meta?.pupil_name ?? "").toString().toLowerCase();
        const ins = (instructors[g.instructor_id]?.name ?? "").toLowerCase();
        if (!pupil.includes(q) && !ins.includes(q)) return false;
      }
      return true;
    });
  }, [grouped, instructorFilter, search, instructors]);

  const instructorOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: InstructorMini[] = [];
    for (const g of grouped) {
      if (seen.has(g.instructor_id)) continue;
      seen.add(g.instructor_id);
      opts.push(
        instructors[g.instructor_id] ?? {
          id: g.instructor_id,
          name: g.instructor_id.slice(0, 8),
        },
      );
    }
    return opts.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );
  }, [grouped, instructors]);

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!adminUser) return <Navigate to="/admin/login" replace />;

  return (
    <div className="container mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> EOL Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Every End of Lesson "Done" tap, with linked history and feedback rows.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"} shown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["today", "7d", "30d", "all"] as Range[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "outline"}
                onClick={() => setRange(r)}
              >
                {r === "today"
                  ? "Today"
                  : r === "7d"
                    ? "Last 7 days"
                    : r === "30d"
                      ? "Last 30 days"
                      : "All"}
              </Button>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Select value={instructorFilter} onValueChange={setInstructorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All instructors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instructors</SelectItem>
                {instructorOptions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name ?? i.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search instructor or pupil name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No EOL activity matches these filters.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((g) => {
                const m = g.meta;
                const lessonDt = m.lesson_date
                  ? `${m.lesson_date}${m.start_time ? ` ${String(m.start_time).slice(0, 5)}` : ""}`
                  : "—";
                const doneAt = parseISO(g.created_at);
                const insName =
                  instructors[g.instructor_id]?.name ??
                  g.instructor_id.slice(0, 8);
                return (
                  <li key={g.key} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {insName}
                          <span className="mx-2 text-muted-foreground">·</span>
                          <span className="text-muted-foreground">
                            {m.pupil_name ?? "Unknown pupil"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Lesson {lessonDt} · {m.duration_minutes ?? "?"} min
                        </div>
                        <div
                          className="mt-0.5 text-xs text-muted-foreground"
                          title={format(doneAt, "PPpp")}
                        >
                          Done tapped {formatDistanceToNow(doneAt, { addSuffix: true })}
                        </div>
                        {m.lesson_history_id && (
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                            history #{String(m.lesson_history_id).slice(0, 8)}
                            {m.lesson_feedback_id
                              ? ` · feedback #${String(m.lesson_feedback_id).slice(0, 8)}`
                              : ""}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {m.lesson_history_id && (
                          <Badge variant="secondary" className="text-[10px]">
                            history
                          </Badge>
                        )}
                        {m.lesson_feedback_id ? (
                          <Badge variant="secondary" className="text-[10px]">
                            <MessageSquare className="mr-1 h-3 w-3" />
                            feedback
                          </Badge>
                        ) : m.feedback_skipped_reason ? (
                          <Badge variant="outline" className="text-[10px]">
                            feedback off
                          </Badge>
                        ) : null}
                        {m.voice_note_attached && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Mic className="mr-1 h-3 w-3" />
                            voice
                          </Badge>
                        )}
                        {g.errors.length > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            error
                          </Badge>
                        )}
                      </div>
                    </div>
                    {g.errors.length > 0 && (
                      <div className="mt-2 rounded bg-destructive/5 p-2 text-[11px] text-destructive">
                        {g.errors.join(" · ")}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
