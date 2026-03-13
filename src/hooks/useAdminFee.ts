import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminFeeConfig {
  ratePercent: number;
  fixedFeePence: number;
}

interface AdminFeeResult {
  /** The admin fee in pounds (0 if instructor pays) */
  adminFee: number;
  /** The total to charge (base + fee, or just base if instructor pays) */
  totalCharge: number;
  /** Whether a fee is being applied */
  hasFee: boolean;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Fetches the active platform commission config and calculates the admin fee
 * for a given base amount, taking into account who pays the commission.
 */
export function useAdminFee(
  baseAmount: number,
  commissionPayer: string | null | undefined
): AdminFeeResult {
  const { data: config, isLoading } = useQuery<AdminFeeConfig | null>({
    queryKey: ["platform-commission-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_commission_config")
        .select("rate_percent, fixed_fee_pence")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return {
        ratePercent: data.rate_percent,
        fixedFeePence: data.fixed_fee_pence,
      };
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const pupilPays = commissionPayer !== "instructor";

  if (!config || !pupilPays || baseAmount <= 0) {
    return { adminFee: 0, totalCharge: baseAmount, hasFee: false, isLoading };
  }

  const fee = roundPence(baseAmount * (config.ratePercent / 100) + config.fixedFeePence / 100);
  return {
    adminFee: fee,
    totalCharge: roundPence(baseAmount + fee),
    hasFee: true,
    isLoading,
  };
}

/** Calculate admin fee without the hook (for edge functions / pure calcs) */
export function calculateAdminFee(
  baseAmount: number,
  ratePercent: number,
  fixedFeePence: number
): number {
  return roundPence(baseAmount * (ratePercent / 100) + fixedFeePence / 100);
}

function roundPence(v: number): number {
  return Math.round(v * 100) / 100;
}
