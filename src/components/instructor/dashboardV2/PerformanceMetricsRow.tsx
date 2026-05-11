import { useEffect, useState } from "react";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useStandardsCheckMetrics } from "@/components/instructor/driving-test/useStandardsCheckMetrics";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  instructorId: string;
  activePupilCount: number;
}

interface TileProps {
  label: string;
  pill: string;
  value: number; // 0-100 percent
  caption: string;
  loading?: boolean;
  color?: string;
  onClick?: () => void;
}

function PercentTile({ label, pill, value, caption, loading, color = "#2B7BC8", onClick }: TileProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <button
      onClick={onClick}
      className="text-left transition-colors hover:bg-muted/40"
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        cursor: onClick ? "pointer" : "default",
        border: "0.5px solid #E5E5EA",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{label}</h3>
        <span
          className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ background: "#F1F3F5", color: "#52525B" }}
        >
          {pill}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <span
            className="tabular-nums"
            style={{ fontSize: 32, fontWeight: 500, color: "#18181B", lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            {Math.round(pct)}%
          </span>
        )}
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: "#EEF0F2", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            transition: "width 400ms ease",
          }}
        />
      </div>
    </button>
  );
}

export function PerformanceMetricsRow({ instructorId, activePupilCount }: Props) {
  const m = useStandardsCheckMetrics(instructorId);
  const [bookedCount, setBookedCount] = useState<number | null>(null);
  const [cancelledTotal, setCancelledTotal] = useState<number | null>(null);
  const [cancelledIn14, setCancelledIn14] = useState<number | null>(null);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;

    (async () => {
      const todayIso = format(new Date(), "yyyy-MM-dd");
      const fourteenAgo = subDays(new Date(), 14).toISOString();

      const [{ data: upcoming }, { count: cancelledCount }, { count: totalRecent }] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("pupil_id")
          .eq("instructor_id", instructorId)
          .is("deleted_at", null)
          .neq("status", "cancelled")
          .gte("lesson_date", todayIso),
        supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("status", "cancelled")
          .gte("updated_at", fourteenAgo),
        supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .gte("updated_at", fourteenAgo),
      ]);

      if (cancelled) return;
      const uniquePupils = new Set((upcoming || []).map((r: any) => r.pupil_id).filter(Boolean));
      setBookedCount(uniquePupils.size);
      setCancelledIn14(cancelledCount || 0);
      setCancelledTotal(totalRecent || 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  const bookedPct = activePupilCount > 0 && bookedCount !== null
    ? (bookedCount / activePupilCount) * 100
    : 0;
  const cancelledPct = cancelledTotal && cancelledIn14 !== null
    ? (cancelledIn14 / cancelledTotal) * 100
    : 0;

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
      <PercentTile
        label="Lesson Booked"
        pill="Active"
        value={bookedPct}
        caption={`${bookedCount ?? 0} of ${activePupilCount} Pupils`}
        loading={bookedCount === null}
        color="#2B7BC8"
      />
      <PercentTile
        label="Pass Rate"
        pill="Last 12 Months"
        value={m.passRate}
        caption={`${Math.round((m.passRate / 100) * m.totalTests)} of ${m.totalTests} Successful`}
        loading={m.loading}
        color="#10B981"
      />
      <PercentTile
        label="Cancelled lessons"
        pill="Last 14 Days"
        value={cancelledPct}
        caption={`${cancelledIn14 ?? 0} of ${cancelledTotal ?? 0} Lessons`}
        loading={cancelledIn14 === null}
        color="#EF4444"
      />
    </div>
  );
}
