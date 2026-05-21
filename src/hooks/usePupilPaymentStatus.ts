import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePupilPaymentStatus(pupilId: string | undefined) {
  return useQuery({
    queryKey: ["pupil-payment-status", pupilId],
    queryFn: async () => {
      if (!pupilId) return null;
      const { data } = await (supabase.from("pupils") as any).select("id, name, account_balance").eq("id", pupilId).maybeSingle();
      if (!data) return null;
      const balance = data.account_balance || 0;
      return { pupilId: data.id, pupilName: data.name, balance, hasDebt: balance < 0, hasCredit: balance > 0 };
    },
    enabled: !!pupilId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInstructorPupilsPaymentSummary(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-pupils-payment-summary", instructorId],
    queryFn: async () => {
      if (!instructorId) return { debtors: 0, totalDebt: 0, debtorsList: [] as { id: string; name: string; debt: number }[] };
      const { data: pupils } = await (supabase.from("pupils") as any).select("id, name, account_balance").eq("instructor_id", instructorId).is("deleted_at", null);
      const debtors = (pupils || []).filter((p: any) => typeof p.account_balance === "number" && p.account_balance < 0);
      return {
        debtors: debtors.length,
        totalDebt: Math.abs(debtors.reduce((sum: number, p: any) => sum + Number(p.account_balance), 0)),
        debtorsList: debtors.slice(0, 5).map((p: any) => ({ id: p.id, name: p.name, debt: Math.abs(Number(p.account_balance)) })),
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
