import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, parseISO, subDays, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MessageSquare, AlertCircle, History } from "lucide-react";

type Range = "all" | "today" | "7d" | "30d";

interface AuditRow {
  id: string;
  table_name: string;
  record_id: string;
  created_at: string;
  new_values: any;
}

interface Props {
  instructorId: string;
}

/**
 * EOL audit viewer scoped to a single instructor.
 *
 * Reads `data_audit_log` filtered to this instructor and the
 * `event=eol_done` rows written by `EndLessonWizard.handleDone`.
 * Each "Done" tap writes one row per affected table (lesson_history +
 * lesson_feedback); we group by `client_completed_at` so each tap shows
 * as a single entry.
 */
export function EOLAuditLog({ instructorId }: Props) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("data_audit_log")
        .select("id, table_name, record_id, created_at, new_values")
        .eq("instructor_id", instructorId)
        .eq("action", "insert")
        .filter("new_values->>event", "eq", "eol_done")
        .order("created_at", { ascending: false })
        .limit(200);

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
      } else {
        setRows((data as any[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId, range]);

  // Group two-row pairs (lesson_history + lesson_feedback) by completion ts.
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { ts: string; created_at: string; meta: any; tables: string[] }
    >();
    for (const r of rows) {
      const key =
        r.new_values?.client_completed_at ??
        `${r.created_at}-${r.record_id}`;
      const existing = map.get(key);
      if (existing) {
        existing.tables.push(r.table_name);
      } else {
        map.set(key, {
          ts: key,
          created_at: r.created_at,
          meta: r.new_values ?? {},
          tables: [r.table_name],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          End of Lesson activity
        </CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["today", "7d", "30d", "all"] as Range[]).map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant={range === r ? "default" : "outline"}
              onClick={() => setRange(r)}
            >
              {r === "today" ? "Today" : r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "All"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No End of Lesson activity in this range.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {grouped.map((g) => {
              const m = g.meta;
              const lessonDt = m.lesson_date
                ? `${m.lesson_date}${m.start_time ? ` ${String(m.start_time).slice(0, 5)}` : ""}`
                : "—";
              const doneAt = parseISO(g.created_at);
              const hasHistory = !!m.lesson_history_id;
              const hasFeedback = !!m.lesson_feedback_id;
              const errored =
                g.tables.some((t) => {
                  const row = rows.find(
                    (r) =>
                      r.table_name === t &&
                      (r.new_values?.client_completed_at ?? "") === g.ts,
                  );
                  return !!row?.new_values?.error;
                });
              return (
                <li key={g.ts} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {m.pupil_name ?? "Unknown pupil"}
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
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {hasHistory && (
                        <Badge variant="secondary" className="text-[10px]">
                          history saved
                        </Badge>
                      )}
                      {hasFeedback && (
                        <Badge variant="secondary" className="text-[10px]">
                          <MessageSquare className="mr-1 h-3 w-3" />
                          feedback
                        </Badge>
                      )}
                      {!hasFeedback && m.feedback_skipped_reason && (
                        <Badge variant="outline" className="text-[10px]">
                          feedback off
                        </Badge>
                      )}
                      {m.voice_note_attached && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Mic className="mr-1 h-3 w-3" />
                          voice
                        </Badge>
                      )}
                      {errored && (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          error
                        </Badge>
                      )}
                    </div>
                  </div>
                  {m.lesson_history_id && (
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      #{String(m.lesson_history_id).slice(0, 8)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default EOLAuditLog;
