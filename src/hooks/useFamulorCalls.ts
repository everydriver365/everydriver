import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FamulorScope } from "./useFamulorStats";

export interface FamulorCallRow {
  id: string;
  instructor_id: string;
  pupil_id: string | null;
  direction: "inbound" | "outbound";
  purpose: string;
  status: string;
  outcome: string | null;
  summary: string | null;
  phone_number: string | null;
  from_number: string | null;
  to_number: string | null;
  agent_name: string | null;
  duration_seconds: number | null;
  cost_pence: number | null;
  recording_url: string | null;
  transcript: any;
  created_at: string;
  ended_at: string | null;
  metadata: any;
}

export interface FamulorCallsFilters {
  direction?: "all" | "inbound" | "outbound";
  purpose?: string;
  status?: string;
  search?: string;
}

interface Args {
  scope: FamulorScope;
  instructorId?: string;
  instructorIds?: string[];
  filters: FamulorCallsFilters;
  pageSize?: number;
}

export function useFamulorCalls({ scope, instructorId, instructorIds, filters, pageSize = 50 }: Args) {
  const [rows, setRows] = useState<FamulorCallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("famulor_call_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (scope === "instructor" && instructorId) q = q.eq("instructor_id", instructorId);
      if (scope === "school" && instructorIds && instructorIds.length) q = q.in("instructor_id", instructorIds);
      if (filters.direction && filters.direction !== "all") q = q.eq("direction", filters.direction);
      if (filters.purpose && filters.purpose !== "all") q = q.eq("purpose", filters.purpose);
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.search && filters.search.trim()) {
        const s = `%${filters.search.trim()}%`;
        q = q.or(`summary.ilike.${s},phone_number.ilike.${s},agent_name.ilike.${s}`);
      }
      const { data } = await q;
      if (!cancelled) {
        setRows((data as FamulorCallRow[]) ?? []);
        setLoading(false);
      }
    };
    load();
  }, [scope, instructorId, JSON.stringify(instructorIds ?? []), JSON.stringify(filters), pageSize, refreshKey]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("famulor-calls-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "famulor_call_logs" }, () => {
        setRefreshKey((k) => k + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { rows, loading, refresh: () => setRefreshKey((k) => k + 1) };
}
