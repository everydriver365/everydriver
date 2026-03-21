import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FaultCode {
  code: string;
  description: string;
  severity: string;
  dateTime: string;
  deviceName: string;
  source: string;
}

export interface FaultDataResponse {
  faults: FaultCode[];
  message?: string;
  error?: string;
}

export function useGeotabFaultData(
  instructorId: string | undefined,
  fromDate?: Date,
  toDate?: Date
) {
  return useQuery<FaultDataResponse>({
    queryKey: ["geotab-fault-data", instructorId, fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("geotab-fault-data", {
        body: {
          instructorId,
          fromDate: fromDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          toDate: toDate?.toISOString() || new Date().toISOString(),
        },
      });

      if (error) throw new Error(error.message || "Failed to fetch fault data");
      if (data?.error) throw new Error(data.error);
      return data as FaultDataResponse;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
