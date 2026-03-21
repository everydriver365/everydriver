import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StatusDataPoint {
  time: string;
  value: number;
}

export interface DiagnosticSeries {
  label: string;
  unit: string;
  data: StatusDataPoint[];
}

export interface StatusDataResponse {
  series: Record<string, DiagnosticSeries>;
  message?: string;
  error?: string;
}

export type DiagnosticKey = "rpm" | "throttle" | "oilPressure" | "coolantTemp" | "fuelLevel" | "batteryVoltage" | "brakePedal" | "seatbelt" | "tyrePressure" | "ambientTemp" | "odometer" | "engineHours" | "reverseGear";

export function useGeotabStatusData(
  instructorId: string | undefined,
  fromDate?: Date,
  toDate?: Date,
  diagnostics?: DiagnosticKey[]
) {
  return useQuery<StatusDataResponse>({
    queryKey: ["geotab-status-data", instructorId, fromDate?.toISOString(), toDate?.toISOString(), diagnostics],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("geotab-status-data", {
        body: {
          instructorId,
          fromDate: fromDate?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          toDate: toDate?.toISOString() || new Date().toISOString(),
          diagnostics: diagnostics || ["rpm", "throttle", "oilPressure"],
        },
      });

      if (error) throw new Error(error.message || "Failed to fetch status data");
      if (data?.error) throw new Error(data.error);
      return data as StatusDataResponse;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
