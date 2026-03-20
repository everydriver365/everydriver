import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GeotabTrip {
  id: string;
  deviceName: string;
  startTime: string;
  endTime: string | null;
  distanceKm: number;
  durationMinutes: number;
  idleMinutes: number;
  stopMinutes: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
}

export interface GeotabTripsMeta {
  fromDate: string;
  toDate: string;
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  tripsLinked?: number;
}

interface GeotabTripsResponse {
  trips: GeotabTrip[];
  meta: GeotabTripsMeta | null;
  error?: string;
}

export function useGeotabTrips(
  instructorId: string | undefined,
  fromDate?: Date,
  toDate?: Date
) {
  return useQuery<GeotabTripsResponse>({
    queryKey: ["geotab-trips", instructorId, fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("geotab-trips", {
        body: {
          instructorId,
          fromDate: fromDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          toDate: toDate?.toISOString() || new Date().toISOString(),
        },
      });

      if (error) throw new Error(error.message || "Failed to fetch trips");
      if (data?.error) throw new Error(data.error);
      return data as GeotabTripsResponse;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
