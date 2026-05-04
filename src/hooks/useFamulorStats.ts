import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FamulorScope = "instructor" | "school" | "admin";
export type FamulorPeriod = "today" | "7d" | "30d";

export interface FamulorKpis {
  totalCalls: number;
  inbound: number;
  outbound: number;
  completed: number;
  noAnswer: number;
  failed: number;
  answerRate: number;          // 0..1
  avgDurationSec: number;
  totalCostPence: number;
  byPurpose: Record<string, number>;
  byDay: { day: string; calls: number; minutes: number }[];
  liveCount: number;
}

const EMPTY: FamulorKpis = {
  totalCalls: 0, inbound: 0, outbound: 0, completed: 0, noAnswer: 0, failed: 0,
  answerRate: 0, avgDurationSec: 0, totalCostPence: 0,
  byPurpose: {}, byDay: [], liveCount: 0,
};

function periodStart(p: FamulorPeriod): Date {
  const d = new Date();
  if (p === "today") d.setHours(0, 0, 0, 0);
  else if (p === "7d") d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d;
}

interface Args {
  scope: FamulorScope;
  instructorIds?: string[]; // school scope
  instructorId?: string;    // instructor scope
  period: FamulorPeriod;
}

export function useFamulorStats({ scope, instructorIds, instructorId, period }: Args) {
  const [kpis, setKpis] = useState<FamulorKpis>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const since = periodStart(period).toISOString();

      let q = supabase
        .from("famulor_call_logs")
        .select("direction, purpose, status, duration_seconds, cost_pence, created_at")
        .gte("created_at", since);

      if (scope === "instructor" && instructorId) q = q.eq("instructor_id", instructorId);
      if (scope === "school" && instructorIds && instructorIds.length) q = q.in("instructor_id", instructorIds);

      const { data, error } = await q.limit(5000);
      if (cancelled) return;
      if (error || !data) {
        setKpis(EMPTY);
        setLoading(false);
        return;
      }

      const k: FamulorKpis = { ...EMPTY, byPurpose: {}, byDay: [] };
      const dayMap: Record<string, { calls: number; minutes: number }> = {};
      let totalDuration = 0, durCount = 0;

      for (const r of data) {
        k.totalCalls++;
        if (r.direction === "inbound") k.inbound++; else k.outbound++;
        if (r.status === "completed") k.completed++;
        else if (r.status === "no_answer") k.noAnswer++;
        else if (r.status === "failed") k.failed++;
        k.totalCostPence += r.cost_pence ?? 0;
        if (r.duration_seconds != null) { totalDuration += r.duration_seconds; durCount++; }
        k.byPurpose[r.purpose] = (k.byPurpose[r.purpose] ?? 0) + 1;
        const day = (r.created_at as string).slice(0, 10);
        dayMap[day] = dayMap[day] ?? { calls: 0, minutes: 0 };
        dayMap[day].calls++;
        dayMap[day].minutes += (r.duration_seconds ?? 0) / 60;
      }
      k.answerRate = k.totalCalls ? k.completed / k.totalCalls : 0;
      k.avgDurationSec = durCount ? Math.round(totalDuration / durCount) : 0;
      k.byDay = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, v]) => ({ day, calls: v.calls, minutes: Math.round(v.minutes) }));

      // Live count
      let liveQ = supabase
        .from("famulor_call_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress");
      if (scope === "instructor" && instructorId) liveQ = liveQ.eq("instructor_id", instructorId);
      if (scope === "school" && instructorIds && instructorIds.length) liveQ = liveQ.in("instructor_id", instructorIds);
      const { count } = await liveQ;
      k.liveCount = count ?? 0;

      if (!cancelled) {
        setKpis(k);
        setLoading(false);
      }
    };

    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [scope, instructorId, period, JSON.stringify(instructorIds ?? [])]);

  return { kpis, loading };
}
