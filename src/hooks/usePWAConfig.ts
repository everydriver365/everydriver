import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PWAConfig {
  id: string;
  app_type: 'instructor' | 'pupil' | 'parent';
  app_name: string;
  short_name: string;
  description: string | null;
  theme_color: string;
  background_color: string;
  icon_192_url: string | null;
  icon_512_url: string | null;
  start_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePWAConfigs() {
  return useQuery({
    queryKey: ["pwa-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pwa_app_configs")
        .select("*")
        .order("app_type");

      if (error) throw error;
      return data as PWAConfig[];
    },
  });
}

export function usePWAConfig(appType: 'instructor' | 'pupil' | 'parent') {
  return useQuery({
    queryKey: ["pwa-config", appType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pwa_app_configs")
        .select("*")
        .eq("app_type", appType)
        .single();

      if (error) throw error;
      return data as PWAConfig;
    },
  });
}

export function useUpdatePWAConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PWAConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from("pwa_app_configs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pwa-configs"] });
      queryClient.invalidateQueries({ queryKey: ["pwa-config"] });
      toast.success("App configuration updated");
    },
    onError: (error) => {
      toast.error("Failed to update configuration");
      console.error("Error updating PWA config:", error);
    },
  });
}
