import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppHealthStatus {
  connected: boolean;
  scope: "global" | "instructor";
  status?: number;
  phone_number_id?: string;
  verified_name?: string | null;
  display_phone_number?: string | null;
  quality_rating?: string | null;
  code_verification_status?: string | null;
  error?: string | null;
  checked_at?: string;
}

export interface InstructorWhatsAppAccount {
  id: string;
  instructor_id: string;
  waba_id: string | null;
  phone_number_id: string | null;
  display_phone: string | null;
  verified_name: string | null;
  quality_rating: string | null;
  status: string;
  connected_at: string | null;
  last_health_check_at: string | null;
}

export function useWhatsAppHealth(instructorId?: string | null) {
  const queryClient = useQueryClient();

  const account = useQuery({
    queryKey: ["whatsapp-account", instructorId],
    queryFn: async (): Promise<InstructorWhatsAppAccount | null> => {
      if (!instructorId) return null;
      const { data } = await supabase
        .from("instructor_whatsapp_accounts")
        .select("*")
        .eq("instructor_id", instructorId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!instructorId,
  });

  const health = useQuery({
    queryKey: ["whatsapp-health", instructorId],
    queryFn: async (): Promise<WhatsAppHealthStatus> => {
      const { data, error } = await supabase.functions.invoke("whatsapp-health-check");
      if (error) throw error;
      return data as WhatsAppHealthStatus;
    },
    enabled: !!instructorId,
    staleTime: 60_000,
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!instructorId) throw new Error("No instructor");
      const { error } = await supabase
        .from("instructor_whatsapp_accounts")
        .delete()
        .eq("instructor_id", instructorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-account"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-health"] });
    },
  });

  return {
    account: account.data,
    health: health.data,
    isLoading: account.isLoading || health.isLoading,
    refetch: () => {
      account.refetch();
      health.refetch();
    },
    disconnect,
  };
}
