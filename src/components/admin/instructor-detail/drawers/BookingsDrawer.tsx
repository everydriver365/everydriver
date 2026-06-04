import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActionDrawer, DrawerEmpty, DrawerError, DrawerLoading, DrawerRow } from "../ActionDrawer";

type Lesson = { id: string; start_time: string; status: string | null; pupil_id: string | null };
type Filter = "upcoming" | "past" | "cancelled";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export function BookingsDrawer({ instructorId, instructorName, onClose }: { instructorId: string; instructorName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Lesson[]>([]);
  const [pupilNames, setPupilNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("upcoming");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("scheduled_lessons")
        .select("id,start_time,status,pupil_id")
        .eq("instructor_id", instructorId)
        .order("start_time", { ascending: false })
        .limit(200);
      if (err) { setError(err.message); setLoading(false); return; }
      const list = (data ?? []) as Lesson[];
      setRows(list);
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

  const filtered = useMemo(() => {
    const now = Date.now();
    return rows.filter((l) => {
      const cancelled = (l.status ?? "").toLowerCase() === "cancelled";
      if (filter === "cancelled") return cancelled;
      if (cancelled) return false;
      const t = new Date(l.start_time).getTime();
      return filter === "upcoming" ? t >= now : t < now;
    }).slice(0, 50);
  }, [rows, filter]);

  return (
    <ActionDrawer title="Bookings" subtitle={instructorName} onClose={onClose}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["upcoming", "past", "cancelled"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 999,
              border: "1px solid " + (filter === f ? "#2D3FE7" : "#E5E7EB"),
              background: filter === f ? "#EEF2FF" : "#fff",
              color: filter === f ? "#2D3FE7" : "#374151",
              textTransform: "capitalize", cursor: "pointer",
            }}
          >{f}</button>
        ))}
      </div>
      {loading && <DrawerLoading />}
      {error && <DrawerError message={error} />}
      {!loading && !error && filtered.length === 0 && <DrawerEmpty>No bookings in this view.</DrawerEmpty>}
      {!loading && !error && filtered.map((l) => (
        <DrawerRow
          key={l.id}
          left={<strong>{l.pupil_id ? (pupilNames[l.pupil_id] ?? "Pupil") : "Lesson"}</strong>}
          sub={fmt(l.start_time)}
          right={<span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, background: "#F1F5F9", color: "#334155", textTransform: "capitalize" }}>{l.status ?? "—"}</span>}
        />
      ))}
    </ActionDrawer>
  );
}
