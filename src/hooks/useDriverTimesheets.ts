import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DriverTimesheet {
  id: string;
  sheet_date: string;
  quartix_vehicle_id: string | null;
  first_trip_start: string | null;
  last_trip_end: string | null;
  total_driving_minutes: number;
  total_idle_minutes: number;
  total_distance_km: number;
  trip_count: number;
}

interface UseDriverTimesheetsResult {
  timesheets: DriverTimesheet[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDriverTimesheets(
  instructorId?: string,
  fromDate?: Date,
  toDate?: Date
): UseDriverTimesheetsResult {
  const [timesheets, setTimesheets] = useState<DriverTimesheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    setError(null);

    try {
      const from = fromDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = toDate ?? new Date();

      const { data, error: dbError } = await supabase
        .from("driver_timesheets")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("sheet_date", from.toISOString().split("T")[0])
        .lte("sheet_date", to.toISOString().split("T")[0])
        .order("sheet_date", { ascending: false });

      if (dbError) throw dbError;
      setTimesheets((data as DriverTimesheet[]) || []);
    } catch (err) {
      console.error("[Timesheets] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  }, [instructorId, fromDate?.toISOString(), toDate?.toISOString()]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { timesheets, loading, error, refetch: fetch };
}
