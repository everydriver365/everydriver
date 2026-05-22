import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AffiliatePlatform = "xero" | "quickbooks" | "freeagent" | "sage";

interface AffiliateLink {
  platform: AffiliatePlatform;
  affiliate_url: string;
}

/**
 * Fetches the list of active affiliate signup URLs configured by admin.
 * Cached per-session via react-query so all AccountingSyncPanels share one fetch.
 */
export function useAffiliateLinks() {
  const query = useQuery({
    queryKey: ["affiliate-links"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_affiliate_links");
      if (error) throw error;
      return (data ?? []) as AffiliateLink[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getUrl = (platform: AffiliatePlatform): string | null => {
    const row = query.data?.find((l) => l.platform === platform);
    return row?.affiliate_url ?? null;
  };

  return { ...query, getUrl };
}
