import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActionDrawer, DrawerEmpty, DrawerError, DrawerLoading, DrawerRow } from "../ActionDrawer";

type Lesson = { id: string; start_time: string; status: string | null; pupil_id: string | null };
type CalEvent = { id: string; start_time: string; end_time: string; title: string | null };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function DiaryDrawer({ instructorId, instructorName, onClose }: { instructorId: string; instructorName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [pupilNames, setPupilNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const now = new Date();
      const end = new Date(Date.now() + 14 * 86400_000);
      const [{ data: lRows, error: lErr }, { data: eRows, error: eErr }] = await Promise.all([
        supabase.from("scheduled_lessons")
          .select("id,start_time,status,pupil_id")
          .eq("instructor_id", instructorId)
          .is("deleted_at", null)
          .gte("start_time", now.toISOString())
          .lte("start_time", end.toISOString())
          .order("start_time", { ascending: true }),
        supabase.from("instructor_calendar_events")
          .select("id,start_time,end_time,title")
          .eq("instructor_id", instructorId)
          .gte("start_time", now.toISOString())
          .lte("start_time", end.toISOString())
          .order("start_time", { ascending: true }),
      ]);
      if (lErr) { setError(lErr.message); setLoading(false); return; }
      if (eErr) { setError(eErr.message); setLoading(false); return; }
      const list = (lRows ?? []) as Lesson[];
      setLessons(list);
      setEvents((eRows ?? []) as CalEvent[]);
      const pids = Array.from(new Set(list.map((l) => l.pupil_id).filter(Boolean))) as string[];
      if (pids.length) {
        const { data: pRows } = await supabase.from("pupils").select("id,name").in("id", pids);
        const map: Record<string, string> = {};
        (pRows ?? []).forEach((p: any) => { map[p.id] = p.name; });
        setPupilNames(map);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  return (
    <ActionDrawer title="Diary — next 14 days" subtitle={instructorName} onClose={onClose}>
      {loading && <DrawerLoading />}
      {error && <DrawerError message={error} />}
      {!loading && !error && (
        <>
          <SectionLabel>Lessons ({lessons.length})</SectionLabel>
          {lessons.length === 0 && <DrawerEmpty>No lessons scheduled.</DrawerEmpty>}
          {lessons.map((l) => (
            <DrawerRow
              key={l.id}
              left={<strong>{l.pupil_id ? (pupilNames[l.pupil_id] ?? "Pupil") : "Lesson"}</strong>}
              sub={fmt(l.start_time)}
              right={<Badge>{l.status ?? "—"}</Badge>}
            />
          ))}

          <SectionLabel style={{ marginTop: 18 }}>Calendar busy blocks ({events.length})</SectionLabel>
          {events.length === 0 && <DrawerEmpty>No external calendar blocks.</DrawerEmpty>}
          {events.map((e) => (
            <DrawerRow
              key={e.id}
              left={<strong>{e.title || "Busy"}</strong>}
              sub={`${fmt(e.start_time)} → ${fmt(e.end_time)}`}
            />
          ))}
        </>
      )}
    </ActionDrawer>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: "#9CA3AF",
      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, ...style,
    }}>{children}</div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 6px", borderRadius: 999,
      background: "#F1F5F9", color: "#334155", textTransform: "capitalize",
    }}>{children}</span>
  );
}
