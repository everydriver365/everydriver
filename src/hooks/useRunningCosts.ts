import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";

// UK tax year runs April 6 to April 5
function getTaxYearDates(): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  // If before April 6, tax year started previous year
  if (currentMonth < 3 || (currentMonth === 3 && currentDay < 6)) {
    return {
      start: new Date(currentYear - 1, 3, 6), // April 6 last year
      end: new Date(currentYear, 3, 5),       // April 5 this year
    };
  }
  
  return {
    start: new Date(currentYear, 3, 6),       // April 6 this year
    end: new Date(currentYear + 1, 3, 5),     // April 5 next year
  };
}

export interface RunningCostsSummary {
  thisWeek: { miles: number; fuelCost: number };
  thisMonth: { miles: number; fuelCost: number };
  taxYear: { miles: number; fuelCost: number };
  costPerMile: number;
  vehicleMpg: number;
  fuelCostPerLitre: number;
}

export interface RecentTrip {
  id: string;
  log_date: string;
  created_at: string;
  distance_km: number;
  distance_miles: number;
  fuel_cost: number;
  trip_type: "business" | "personal";
  pupil_name?: string;
  purpose?: string;
}

export function useRunningCosts() {
  const { instructor } = useInstructorAuth();
  
  const KM_TO_MILES = 0.621371;
  const LITRES_PER_GALLON = 4.54609;

  // Get instructor's fuel settings
  const vehicleMpg = instructor?.vehicle_mpg || 40;
  const fuelCostPerLitre = instructor?.fuel_cost_per_litre || 1.45;

  // Calculate fuel cost from distance
  const calculateFuelCost = (distanceKm: number): number => {
    const distanceMiles = distanceKm * KM_TO_MILES;
    const gallonsUsed = distanceMiles / vehicleMpg;
    const litresUsed = gallonsUsed * LITRES_PER_GALLON;
    return litresUsed * fuelCostPerLitre;
  };

  // Summary query
  const summaryQuery = useQuery({
    queryKey: ["running-costs-summary", instructor?.id, vehicleMpg, fuelCostPerLitre],
    queryFn: async (): Promise<RunningCostsSummary> => {
      if (!instructor?.id) {
        return {
          thisWeek: { miles: 0, fuelCost: 0 },
          thisMonth: { miles: 0, fuelCost: 0 },
          taxYear: { miles: 0, fuelCost: 0 },
          costPerMile: 0,
          vehicleMpg,
          fuelCostPerLitre,
        };
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const taxYear = getTaxYearDates();

      // Fetch all mileage logs for the tax year
      const { data: logs, error } = await supabase
        .from("mileage_logs")
        .select("log_date, distance_km")
        .eq("instructor_id", instructor.id)
        .gte("log_date", taxYear.start.toISOString().split("T")[0])
        .lte("log_date", taxYear.end.toISOString().split("T")[0]);

      if (error) throw error;

      const weekMiles = (logs || [])
        .filter(l => {
          const d = new Date(l.log_date);
          return d >= weekStart && d <= weekEnd;
        })
        .reduce((sum, l) => sum + l.distance_km * KM_TO_MILES, 0);

      const monthMiles = (logs || [])
        .filter(l => {
          const d = new Date(l.log_date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((sum, l) => sum + l.distance_km * KM_TO_MILES, 0);

      const taxYearMiles = (logs || [])
        .reduce((sum, l) => sum + l.distance_km * KM_TO_MILES, 0);

      // Calculate fuel costs
      const weekKm = weekMiles / KM_TO_MILES;
      const monthKm = monthMiles / KM_TO_MILES;
      const taxYearKm = taxYearMiles / KM_TO_MILES;

      const weekFuelCost = calculateFuelCost(weekKm);
      const monthFuelCost = calculateFuelCost(monthKm);
      const taxYearFuelCost = calculateFuelCost(taxYearKm);

      // Calculate cost per mile
      const costPerMile = taxYearMiles > 0 ? taxYearFuelCost / taxYearMiles : 0;

      return {
        thisWeek: { miles: weekMiles, fuelCost: weekFuelCost },
        thisMonth: { miles: monthMiles, fuelCost: monthFuelCost },
        taxYear: { miles: taxYearMiles, fuelCost: taxYearFuelCost },
        costPerMile,
        vehicleMpg,
        fuelCostPerLitre,
      };
    },
    enabled: !!instructor?.id,
  });

  // Recent trips query
  const recentTripsQuery = useQuery({
    queryKey: ["running-costs-recent-trips", instructor?.id, vehicleMpg, fuelCostPerLitre],
    queryFn: async (): Promise<RecentTrip[]> => {
      if (!instructor?.id) return [];

      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data: logs, error } = await supabase
        .from("mileage_logs")
        .select(`
          id,
          log_date,
          created_at,
          distance_km,
          trip_type,
          purpose,
          pupil:pupil_id(name)
        `)
        .eq("instructor_id", instructor.id)
        .gte("log_date", sevenDaysAgo.toISOString().split("T")[0])
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (logs || []).map(log => ({
        id: log.id,
        log_date: log.log_date,
        created_at: log.created_at,
        distance_km: log.distance_km,
        distance_miles: log.distance_km * KM_TO_MILES,
        fuel_cost: calculateFuelCost(log.distance_km),
        trip_type: log.trip_type as "business" | "personal",
        pupil_name: (log.pupil as any)?.name || undefined,
        purpose: log.purpose || undefined,
      }));
    },
    enabled: !!instructor?.id,
  });

  // Today's stats from devices (odometer delta)
  const todayStatsQuery = useQuery({
    queryKey: ["running-costs-today", instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return { todayMiles: 0, todayFuelCost: 0 };

      const { data: devices, error } = await supabase
        .from("gps_devices")
        .select("daily_start_odometer_m, daily_start_date")
        .eq("instructor_id", instructor.id);

      if (error) throw error;

      const today = new Date().toISOString().split("T")[0];
      let todayMeters = 0;

      for (const device of devices || []) {
        if (
          device.daily_start_date === today &&
          device.daily_start_odometer_m != null
        ) {
          // Without live odometer from tracking provider, we can't calculate today's delta
          // This will be populated by the radius-poller when it runs
        }
      }

      const todayKm = todayMeters / 1000;
      const todayMiles = todayKm * KM_TO_MILES;
      const todayFuelCost = calculateFuelCost(todayKm);

      return { todayMiles, todayFuelCost };
    },
    enabled: !!instructor?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    summary: summaryQuery.data || {
      thisWeek: { miles: 0, fuelCost: 0 },
      thisMonth: { miles: 0, fuelCost: 0 },
      taxYear: { miles: 0, fuelCost: 0 },
      costPerMile: 0,
      vehicleMpg,
      fuelCostPerLitre,
    },
    recentTrips: recentTripsQuery.data || [],
    todayStats: todayStatsQuery.data || { todayMiles: 0, todayFuelCost: 0 },
    isLoading: summaryQuery.isLoading || recentTripsQuery.isLoading,
    refetch: () => {
      summaryQuery.refetch();
      recentTripsQuery.refetch();
      todayStatsQuery.refetch();
    },
  };
}
