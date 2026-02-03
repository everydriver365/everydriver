import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";

export interface MileageLog {
  id: string;
  instructor_id: string;
  telematics_id: string | null;
  vehicle_id: string | null;
  pupil_id: string | null;
  log_date: string;
  distance_km: number;
  trip_type: "business" | "personal";
  purpose: string | null;
  start_location: string | null;
  end_location: string | null;
  start_odometer_km: number | null;
  end_odometer_km: number | null;
  is_auto_logged: boolean;
  created_at: string;
  updated_at: string;
  estimated_fuel_cost_gbp: number | null;
  fuel_litres_used: number | null;
  pupil?: { name: string } | null;
  vehicle?: { registration: string } | null;
}

export interface MileageSummary {
  totalBusiness: number;
  totalPersonal: number;
  totalMiles: number;
  businessPercentage: number;
  taxDeductibleMiles: number; // HMRC rate at 45p/mi for first 10k, 25p after
  totalFuelCost: number;
}

export function useMileageLogs(dateRange?: { from: Date; to: Date }) {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ["mileage-logs", instructor?.id, dateRange?.from, dateRange?.to],
    queryFn: async (): Promise<MileageLog[]> => {
      if (!instructor?.id) return [];

      let query = supabase
        .from("mileage_logs")
        .select(`
          *,
          pupil:pupil_id(name),
          vehicle:vehicle_id(registration)
        `)
        .eq("instructor_id", instructor.id)
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (dateRange?.from) {
        query = query.gte("log_date", dateRange.from.toISOString().split("T")[0]);
      }
      if (dateRange?.to) {
        query = query.lte("log_date", dateRange.to.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as MileageLog[];
    },
    enabled: !!instructor?.id,
  });

  const summaryQuery = useQuery({
    queryKey: ["mileage-summary", instructor?.id, dateRange?.from, dateRange?.to],
    queryFn: async (): Promise<MileageSummary> => {
      if (!instructor?.id) {
        return {
          totalBusiness: 0,
          totalPersonal: 0,
          totalMiles: 0,
          businessPercentage: 0,
          taxDeductibleMiles: 0,
          totalFuelCost: 0,
        };
      }

      let query = supabase
        .from("mileage_logs")
        .select("distance_km, trip_type, estimated_fuel_cost_gbp")
        .eq("instructor_id", instructor.id);

      if (dateRange?.from) {
        query = query.gte("log_date", dateRange.from.toISOString().split("T")[0]);
      }
      if (dateRange?.to) {
        query = query.lte("log_date", dateRange.to.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      const kmToMiles = (km: number) => km * 0.621371;
      
      const totalBusiness = (data || [])
        .filter((l) => l.trip_type === "business")
        .reduce((sum, l) => sum + kmToMiles(l.distance_km), 0);

      const totalPersonal = (data || [])
        .filter((l) => l.trip_type === "personal")
        .reduce((sum, l) => sum + kmToMiles(l.distance_km), 0);

      const totalMiles = totalBusiness + totalPersonal;
      const businessPercentage = totalMiles > 0 ? (totalBusiness / totalMiles) * 100 : 0;

      // HMRC mileage allowance: 45p for first 10,000 miles, 25p after
      const taxDeductibleMiles = totalBusiness;

      // Sum up fuel costs if available
      const totalFuelCost = (data || [])
        .reduce((sum, l) => sum + (l.estimated_fuel_cost_gbp || 0), 0);

      return {
        totalBusiness,
        totalPersonal,
        totalMiles,
        businessPercentage,
        taxDeductibleMiles,
        totalFuelCost,
      };
    },
    enabled: !!instructor?.id,
  });

  const updateTripType = useMutation({
    mutationFn: async ({ id, tripType }: { id: string; tripType: "business" | "personal" }) => {
      const { error } = await supabase
        .from("mileage_logs")
        .update({ trip_type: tripType })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mileage-summary"] });
      toast.success("Trip type updated");
    },
    onError: (error) => {
      console.error("Error updating trip type:", error);
      toast.error("Failed to update trip type");
    },
  });

  const updatePurpose = useMutation({
    mutationFn: async ({ id, purpose }: { id: string; purpose: string }) => {
      const { error } = await supabase
        .from("mileage_logs")
        .update({ purpose })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage-logs"] });
      toast.success("Purpose updated");
    },
    onError: (error) => {
      console.error("Error updating purpose:", error);
      toast.error("Failed to update purpose");
    },
  });

  const addManualEntry = useMutation({
    mutationFn: async (entry: {
      log_date: string;
      distance_km: number;
      trip_type: "business" | "personal";
      purpose?: string;
      start_location?: string;
      end_location?: string;
    }) => {
      if (!instructor?.id) throw new Error("No instructor");

      const { error } = await supabase
        .from("mileage_logs")
        .insert({
          instructor_id: instructor.id,
          ...entry,
          is_auto_logged: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mileage-summary"] });
      toast.success("Mileage entry added");
    },
    onError: (error) => {
      console.error("Error adding mileage:", error);
      toast.error("Failed to add mileage entry");
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mileage_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mileage-summary"] });
      toast.success("Entry deleted");
    },
    onError: (error) => {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    },
  });

  return {
    logs: logsQuery.data || [],
    summary: summaryQuery.data || {
      totalBusiness: 0,
      totalPersonal: 0,
      totalMiles: 0,
      businessPercentage: 0,
      taxDeductibleMiles: 0,
      totalFuelCost: 0,
    },
    isLoading: logsQuery.isLoading || summaryQuery.isLoading,
    updateTripType,
    updatePurpose,
    addManualEntry,
    deleteEntry,
    refetch: () => {
      logsQuery.refetch();
      summaryQuery.refetch();
    },
  };
}
