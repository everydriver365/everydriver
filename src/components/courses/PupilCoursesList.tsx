/**
 * PupilCoursesList — list of pupils that have at least one scheduled lesson.
 * Each pupil row is one "course" in the new course-summaries view.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  /** Restrict to these instructors (school view passes its instructor ids). Omit for single-instructor view. */
  instructorIds?: string[];
  onSelect: (pupilId: string) => void;
};

type Row = {
  pupil_id: string;
  pupil_name: string;
  instructor_id: string;
  instructor_name: string | null;
  course_type: string | null;
  course_status: string | null;
  lesson_count: number;
  next_lesson_date: string | null;
  account_balance: number | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export function PupilCoursesList({ instructorIds, onSelect }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      // Resolve instructor scope
      let scope = instructorIds;
      if (!scope) {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (uid) {
          const { data: me } = await supabase
            .from("instructors")
            .select("id")
            .eq("auth_user_id", uid)
            .maybeSingle();
          if (me) scope = [me.id];
        }
      }
      if (!scope || scope.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data: pupilRows } = await supabase
        .from("pupils")
        .select("id,name,instructor_id,course_type,course_status,account_balance")
        .in("instructor_id", scope)
        .is("deleted_at", null);

      if (cancelled) return;
      const pupilIds = (pupilRows || []).map((p) => p.id);
      if (pupilIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const [{ data: lessonRows }, { data: instructorRows }] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("pupil_id,lesson_date")
          .in("pupil_id", pupilIds)
          .is("deleted_at", null),
        supabase.from("instructors").select("id,name").in("id", scope),
      ]);

      if (cancelled) return;
      const instructorMap = new Map<string, string>(
        (instructorRows || []).map((i) => [i.id, i.name])
      );
      const lessonStats = new Map<string, { count: number; next: string | null }>();
      const today = new Date().toISOString().slice(0, 10);
      (lessonRows || []).forEach((l) => {
        const cur = lessonStats.get(l.pupil_id) || { count: 0, next: null };
        cur.count += 1;
        if (l.lesson_date >= today && (!cur.next || l.lesson_date < cur.next)) {
          cur.next = l.lesson_date;
        }
        lessonStats.set(l.pupil_id, cur);
      });

      const out: Row[] = (pupilRows || [])
        .filter((p) => lessonStats.has(p.id))
        .map((p) => {
          const s = lessonStats.get(p.id)!;
          return {
            pupil_id: p.id,
            pupil_name: p.name,
            instructor_id: p.instructor_id,
            instructor_name: instructorMap.get(p.instructor_id) ?? null,
            course_type: p.course_type,
            course_status: p.course_status,
            lesson_count: s.count,
            next_lesson_date: s.next,
            account_balance: p.account_balance,
          };
        })
        .sort((a, b) => (a.next_lesson_date || "").localeCompare(b.next_lesson_date || ""));

      setRows(out);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [instructorIds]);

  const filtered = rows.filter(
    (r) =>
      r.pupil_name.toLowerCase().includes(query.toLowerCase()) ||
      (r.instructor_name || "").toLowerCase().includes(query.toLowerCase()) ||
      (r.course_type || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: "#F4F7F6", minHeight: "100%" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Course summaries</h1>
        <Input
          placeholder="Search by pupil, instructor or course"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardHeader className="bg-transparent pb-3">
          <CardTitle className="text-base">Pupils with scheduled lessons</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No courses found.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <button
                  key={r.pupil_id}
                  onClick={() => onSelect(r.pupil_id)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/40 rounded px-2 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.pupil_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.course_type || "Course"} ·{" "}
                      {r.instructor_name ? `with ${r.instructor_name}` : ""} ·{" "}
                      {r.lesson_count} lessons
                      {r.next_lesson_date ? ` · next ${new Date(r.next_lesson_date).toLocaleDateString("en-GB")}` : ""}
                    </div>
                  </div>
                  {(r.account_balance || 0) < 0 && (
                    <span
                      style={{
                        backgroundColor: "#FEE2E2",
                        color: "#C0271F",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {fmt(Math.abs(r.account_balance!))} owed
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
