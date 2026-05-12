import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FranchiseStatus {
  /** "paid" when no fees outstanding, "owing" when one or more rows are not_paid/overdue, "none" when no fee records exist */
  feeStatus: "paid" | "owing" | "none";
  /** Sum of outstanding (non-paid) franchise fee amounts in GBP. */
  amountOwing: number;
  /** Bonus pounds earned by the instructor and not yet paid out. */
  bonusDue: number;
}

export function useFranchiseStatus(instructorId: string | undefined) {
  return useQuery<FranchiseStatus>({
    queryKey: ["franchise-status", instructorId],
    enabled: !!instructorId,
    staleTime: 60_000,
    queryFn: async () => {
      const [{ data: fees }, { data: instructor }] = await Promise.all([
        supabase
          .from("school_franchise_fees")
          .select("amount, status")
          .eq("instructor_id", instructorId!),
        supabase
          .from("instructors")
          .select("bonus_earned")
          .eq("id", instructorId!)
          .maybeSingle(),
      ]);

      const rows = fees ?? [];
      const outstanding = rows.filter(
        (r) => (r.status ?? "").toLowerCase() !== "paid",
      );
      const amountOwing = outstanding.reduce(
        (sum, r) => sum + (Number(r.amount) || 0),
        0,
      );

      let feeStatus: FranchiseStatus["feeStatus"] = "none";
      if (rows.length > 0) feeStatus = outstanding.length > 0 ? "owing" : "paid";

      return {
        feeStatus,
        amountOwing,
        bonusDue: Number((instructor as any)?.bonus_earned ?? 0),
      };
    },
  });
}
