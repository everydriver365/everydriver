import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GPSgateTripSummary {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  durationMinutes: number;
  idleMinutes: number | null;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  speedingDistanceKm: number;
  speedingTimeMinutes: number;
  speedingMaxExcessKmh: number;
  hasOverspeeding: boolean;
  // Driving style sub-scores (0-100)
  overallScore: number | null;
  speedScore: number | null;
  accelerationScore: number | null;
  brakingScore: number | null;
  corneringScore: number | null;
}

export interface GPSgateTripsMeta {
  fromDate: string;
  toDate: string;
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  tripsWithOverspeeding: number;
}

interface UseGPSgateTripsResult {
  trips: GPSgateTripSummary[];
  meta: GPSgateTripsMeta | null;
  loading: boolean;
  error: string | null;
  fetchTrips: (fromDate?: Date, toDate?: Date) => Promise<void>;
}

export function useGPSgateTrips(instructorId?: string): UseGPSgateTripsResult {
  const [trips, setTrips] = useState<GPSgateTripSummary[]>([]);
  const [meta, setMeta] = useState<GPSgateTripsMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async (fromDate?: Date, toDate?: Date) => {
    if (!instructorId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("quartix-trips", {
        body: {
          instructorId,
          fromDate: fromDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          toDate: toDate?.toISOString() || new Date().toISOString(),
        },
      });

      if (invokeError) {
        console.error("[Trips] Invoke error:", invokeError);
        setError(invokeError.message || "Failed to fetch trips");
        return;
      }

      if (data?.error) {
        console.error("[Trips] API error:", data.error);
        setError(data.error);
      }

      setTrips(data?.trips || []);
      setMeta(data?.meta || null);
    } catch (err) {
      console.error("[Trips] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  return { trips, meta, loading, error, fetchTrips };
}
