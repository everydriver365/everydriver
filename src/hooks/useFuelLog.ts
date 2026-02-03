import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FuelLogEntry {
  id: string;
  instructor_id: string;
  vehicle_id: string | null;
  fill_date: string;
  litres: number;
  price_per_litre: number;
  total_cost: number;
  odometer_reading_km: number | null;
  station_name: string | null;
  station_address: string | null;
  receipt_url: string | null;
  is_full_tank: boolean;
  notes: string | null;
  calculated_mpg: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateFuelLogInput {
  instructor_id: string;
  vehicle_id?: string;
  fill_date: string;
  litres: number;
  price_per_litre: number;
  odometer_reading_km?: number;
  station_name?: string;
  station_address?: string;
  receipt_url?: string;
  is_full_tank?: boolean;
  notes?: string;
}

export function useFuelLog(instructorId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all fuel logs
  const { data: fuelLogs, isLoading, error } = useQuery({
    queryKey: ["fuel-logs", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      
      const { data, error } = await supabase
        .from("fuel_log")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("fill_date", { ascending: false });

      if (error) throw error;
      return data as FuelLogEntry[];
    },
    enabled: !!instructorId,
  });

  // Add new fuel log entry
  const addFuelLog = useMutation({
    mutationFn: async (input: CreateFuelLogInput) => {
      // Calculate MPG if we have previous full-tank fill
      let calculatedMpg: number | null = null;
      
      if (input.is_full_tank !== false && input.odometer_reading_km && fuelLogs && fuelLogs.length > 0) {
        // Find previous full tank fill with odometer reading
        const previousFull = fuelLogs.find(
          log => log.is_full_tank && log.odometer_reading_km !== null
        );
        
        if (previousFull && previousFull.odometer_reading_km) {
          const distanceKm = input.odometer_reading_km - previousFull.odometer_reading_km;
          const distanceMiles = distanceKm * 0.621371;
          const gallons = input.litres * 0.219969; // Litres to UK gallons
          
          if (gallons > 0) {
            calculatedMpg = Math.round((distanceMiles / gallons) * 10) / 10;
          }
        }
      }

      const { data, error } = await supabase
        .from("fuel_log")
        .insert({
          ...input,
          calculated_mpg: calculatedMpg,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs", instructorId] });
      toast({
        title: "Fuel log added",
        description: "Your fuel fill-up has been recorded.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add fuel log",
        variant: "destructive",
      });
    },
  });

  // Delete fuel log entry
  const deleteFuelLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fuel_log")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs", instructorId] });
      toast({
        title: "Fuel log deleted",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete fuel log",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const stats = fuelLogs ? {
    totalSpend: fuelLogs.reduce((sum, log) => sum + (log.total_cost || 0), 0),
    totalLitres: fuelLogs.reduce((sum, log) => sum + log.litres, 0),
    averagePricePerLitre: fuelLogs.length > 0
      ? fuelLogs.reduce((sum, log) => sum + log.price_per_litre, 0) / fuelLogs.length
      : 0,
    averageMpg: (() => {
      const logsWithMpg = fuelLogs.filter(log => log.calculated_mpg !== null);
      if (logsWithMpg.length === 0) return null;
      return logsWithMpg.reduce((sum, log) => sum + (log.calculated_mpg || 0), 0) / logsWithMpg.length;
    })(),
    fillCount: fuelLogs.length,
  } : null;

  return {
    fuelLogs: fuelLogs || [],
    isLoading,
    error,
    stats,
    addFuelLog: addFuelLog.mutate,
    deleteFuelLog: deleteFuelLog.mutate,
    isAdding: addFuelLog.isPending,
    isDeleting: deleteFuelLog.isPending,
  };
}
