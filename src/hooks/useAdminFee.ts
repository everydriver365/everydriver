import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminFeeConfig {
  ratePercent: number;
  fixedFeePence: number;
}

interface AdminFeeResult {
  /** The full admin fee before split */
  fullFee: number;
  /** The portion the pupil pays */
  adminFee: number;
  /** The portion the instructor absorbs */
  instructorAbsorbs: number;
  /** The total to charge the pupil (base + pupil fee portion) */
  totalCharge: number;
  /** Whether a fee is being applied to the pupil */
  hasFee: boolean;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Fetches the active platform commission config and calculates the admin fee
 * using the commission_split_percent (0–100) to determine pupil vs instructor share.
 *
 * If `tierConfig` is provided (from the instructor's subscription plan),
 * those rates are used instead of the global platform_commission_config.
 */
export function useAdminFee(
  baseAmount: number,
  commissionSplitPercent: number | null | undefined,
  tierConfig?: { ratePercent: number; fixedFeePence: number } | null
): AdminFeeResult {
  const { data: globalConfig, isLoading } = useQuery<AdminFeeConfig | null>({
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
    staleTime: 5 * 60 * 1000,
  });

  // Use tier-specific config if available, otherwise fall back to global
  const config = tierConfig ?? globalConfig;
  const splitPct = commissionSplitPercent ?? 100; // default: pupil pays all

  if (!config || baseAmount <= 0) {
    return { fullFee: 0, adminFee: 0, instructorAbsorbs: 0, totalCharge: baseAmount, hasFee: false, isLoading };
  }

  const fullFee = roundPence(baseAmount * (config.ratePercent / 100) + config.fixedFeePence / 100);
  const pupilFee = roundPence(fullFee * (splitPct / 100));
  const instructorAbsorbs = roundPence(fullFee - pupilFee);

  return {
    fullFee,
    adminFee: pupilFee,
    instructorAbsorbs,
    totalCharge: roundPence(baseAmount + pupilFee),
    hasFee: pupilFee > 0,
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
