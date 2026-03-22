import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export type AddonType = "pro_website" | "custom_domain" | "ssl_hosting" | "seo_boost" | "website_pro_pack" | "healthcare";

export interface InstructorAddon {
  id: string;
  instructor_id: string;
  addon_type: string;
  status: string;
  price_monthly: number;
  gocardless_subscription_id: string | null;
  started_at: string;
  cancelled_at: string | null;
}

export function useInstructorAddons() {
  const { instructor } = useInstructorAuth();

  const { data: addons = [], isLoading, refetch } = useQuery({
    queryKey: ["instructor-addons", instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return [];
      const { data, error } = await supabase
        .from("instructor_addons")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("status", "active");
      if (error) throw error;
      return (data || []) as InstructorAddon[];
    },
    enabled: !!instructor?.id,
    staleTime: 1000 * 60 * 5,
  });

  const hasAddon = (type: AddonType): boolean => {
    // Website Pro Pack includes all 4 individual add-ons
    if (type !== "website_pro_pack" && addons.some(a => a.addon_type === "website_pro_pack")) {
      return true;
    }
    return addons.some(a => a.addon_type === type);
  };

  return { addons, hasAddon, isLoading, refetch };
}
