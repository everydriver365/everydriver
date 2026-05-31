import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mirrorAwToIwh } from "@/lib/syncWeeklyHours";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * "Standard Intensive Hours" — a quick-toggle grid showing Mon–Sun with two
 * fixed slots (08:00–12:00, 13:00–17:00). Each cell can be toggled on/off.
 *
 * Persists to `availability_windows` (1=Mon..7=Sun) and mirrors to
 * `instructor_working_hours` so both tables stay in sync.
 */

type Variant = "desktop" | "mobile";

const SLOTS: { label: string; start: string; end: string }[] = [
  { label: "08:00 – 12:00", start: "08:00:00", end: "12:00:00" },
  { label: "13:00 – 17:00", start: "13:00:00", end: "17:00:00" },
];

// availability_windows dow: 1=Mon..7=Sun
const DAYS: { key: string; long: string; dow: number }[] = [
  { key: "Mon", long: "Monday", dow: 1 },
  { key: "Tue", long: "Tuesday", dow: 2 },
  { key: "Wed", long: "Wednesday", dow: 3 },
  { key: "Thu", long: "Thursday", dow: 4 },
  { key: "Fri", long: "Friday", dow: 5 },
  { key: "Sat", long: "Saturday", dow: 6 },
  { key: "Sun", long: "Sunday", dow: 7 },
];

type Row = { id: string; day_of_week: number; start_time: string; end_time: string };

interface Props {
  instructorId: string;
  variant?: Variant;
  onChanged?: () => void;
}

const norm = (t: string) => (t.length === 5 ? `${t}:00` : t);
const matches = (r: Row, dow: number, start: string, end: string) =>
  r.day_of_week === dow && norm(r.start_time) === start && norm(r.end_time) === end;

export function StandardIntensiveHours({ instructorId, variant = "desktop", onChanged }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from("availability_windows")
      .select("id, day_of_week, start_time, end_time")
      .eq("instructor_id", instructorId)
      .eq("is_active", true);
    if (error) {
      console.error("StandardIntensiveHours: fetch failed", error);
      toast.error("Couldn't load standard hours");
      return;
    }
    setRows((data ?? []) as Row[]);
  }, [instructorId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await fetchRows();
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [fetchRows]);

  const isOn = (dow: number, start: string, end: string) =>
    rows.some((r) => matches(r, dow, start, end));

  const toggle = async (dow: number, start: string, end: string) => {
    const key = `${dow}-${start}`;
    setBusyKey(key);
    const existing = rows.find((r) => matches(r, dow, start, end));
    try {
      if (existing) {
        const { error } = await supabase
          .from("availability_windows")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("availability_windows")
          .insert({
            instructor_id: instructorId,
            day_of_week: dow,
            start_time: start,
            end_time: end,
            is_active: true,
          });
        if (error) throw error;
      }
      await mirrorAwToIwh(instructorId);
      await fetchRows();
      onChanged?.();
    } catch (e) {
      console.error("StandardIntensiveHours: toggle failed", e);
      toast.error("Couldn't update standard hours");
    } finally {
      setBusyKey(null);
    }
  };

  if (variant === "mobile") {
    return (
      <div
        style={{
          background: "#FFF",
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
          border: "0.5px solid rgba(26,82,160,0.08)",
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            Standard Intensive Hours
          </div>
          <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 2 }}>
            Toggle the two standard intensive slots on or off for each day.
          </div>
        </div>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8E8E93", fontSize: 11 }}>
            <Loader2 size={12} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DAYS.map(({ key, dow }) => (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 1fr",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>{key}</div>
                {SLOTS.map((s) => {
                  const on = isOn(dow, s.start, s.end);
                  const busy = busyKey === `${dow}-${s.start}`;
                  return (
                    <button
                      key={s.start}
                      onClick={() => !busy && toggle(dow, s.start, s.end)}
                      disabled={busy}
                      style={{
                        padding: "9px 8px",
                        borderRadius: 10,
                        border: `1px solid ${on ? "#3D55A1" : "#E0E5EE"}`,
                        background: on ? "#3D55A1" : "#F2F4F8",
                        color: on ? "#FFF" : "#5B6B8A",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: busy ? "default" : "pointer",
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop variant
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #E2E8F0",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>
          Standard Intensive Hours
        </div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
          Toggle the two standard intensive slots on or off for each day of the week.
        </div>
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B", fontSize: 11 }}>
          <Loader2 size={12} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "70px 1fr 1fr",
            rowGap: 6,
            columnGap: 10,
            alignItems: "center",
          }}
        >
          <div />
          {SLOTS.map((s) => (
            <div
              key={s.start}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#64748B",
                letterSpacing: 0.4,
                textTransform: "uppercase",
                paddingLeft: 4,
              }}
            >
              {s.label}
            </div>
          ))}

          {DAYS.map(({ key, long, dow }) => (
            <FragmentRow
              key={key}
              dayKey={key}
              dayLong={long}
              dow={dow}
              isOn={isOn}
              busyKey={busyKey}
              onToggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  dayKey, dayLong, dow, isOn, busyKey, onToggle,
}: {
  dayKey: string;
  dayLong: string;
  dow: number;
  isOn: (dow: number, start: string, end: string) => boolean;
  busyKey: string | null;
  onToggle: (dow: number, start: string, end: string) => void;
}) {
  return (
    <>
      <div
        title={dayLong}
        style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}
      >
        {dayKey}
      </div>
      {SLOTS.map((s) => {
        const on = isOn(dow, s.start, s.end);
        const busy = busyKey === `${dow}-${s.start}`;
        return (
          <button
            key={s.start}
            type="button"
            onClick={() => !busy && onToggle(dow, s.start, s.end)}
            disabled={busy}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${on ? "#4F46E5" : "#E2E8F0"}`,
              background: on ? "#4F46E5" : "#F8FAFC",
              color: on ? "#fff" : "#475569",
              fontSize: 11,
              fontWeight: 500,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
              transition: "background 140ms ease, border-color 140ms ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <span>{s.label}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 0.4,
                color: on ? "rgba(255,255,255,0.85)" : "#94A3B8",
              }}
            >
              {on ? "ON" : "OFF"}
            </span>
          </button>
        );
      })}
    </>
  );
}
