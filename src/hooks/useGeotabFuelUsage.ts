import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FuelRecord {
  id: string;
  trip_start: string | null;
  trip_end: string | null;
  fuel_used_litres: number | null;
  distance_km: number | null;
  litres_per_100km: number | null;
  cost_gbp: number | null;
  created_at: string;
}

export interface FuelSummary {
  totalLitres: number;
  totalCost: number;
  averageMpg: number;
  tripCount: number;
}

function computeSummary(records: FuelRecord[]): FuelSummary {
  let totalLitres = 0;
  let totalCost = 0;
  let totalDistKm = 0;

  for (const r of records) {
    totalLitres += r.fuel_used_litres || 0;
    totalCost += r.cost_gbp || 0;
    totalDistKm += r.distance_km || 0;
  }

  // Convert km to miles, litres to gallons for MPG
  const totalMiles = totalDistKm * 0.621371;
  const totalGallons = totalLitres * 0.219969;
  const averageMpg = totalGallons > 0 ? Math.round((totalMiles / totalGallons) * 10) / 10 : 0;

  return {
    totalLitres: Math.round(totalLitres * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    averageMpg,
    tripCount: records.length,
  };
}

export function useGeotabFuelUsage(instructorId: string | undefined, fromDate?: Date, toDate?: Date) {
  return useQuery({
    queryKey: ["geotab-fuel-usage", instructorId, fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("geotab_fuel_usage")
        .select("*")
        .eq("instructor_id", instructorId!)
        .order("trip_start", { ascending: false })
        .limit(200);

      if (fromDate) query = query.gte("trip_start", fromDate.toISOString());
      if (toDate) query = query.lte("trip_start", toDate.toISOString());

      const { data, error } = await query;
      if (error) throw error;
      const records = (data || []) as FuelRecord[];
      return { records, summary: computeSummary(records) };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
