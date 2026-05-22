import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateTax,
  calculateNI,
  calculateHmrcMileageDeduction,
  currentUkTaxYear,
  KM_TO_MILES,
} from "@/lib/ukTax";

export interface InstructorTaxSummary {
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  estimatedNI: number;
  totalLiability: number;
  taxYear: string;
  monthsRemaining: number;
  /** True only if at least one positive payment_history row exists this tax year. */
  hasAnyPayments: boolean;
  loading: boolean;
}

/**
 * Headline-only tax figures for the instructor dashboard tile. Mirrors the
 * three queries InstructorTax.tsx runs (positive payments, expenses, business
 * mileage) but omits the per-category breakdown for speed.
 */
export function useInstructorTaxSummary(instructorId: string | undefined): InstructorTaxSummary {
  const [state, setState] = useState<InstructorTaxSummary>(() => {
    const { label, monthsRemaining } = currentUkTaxYear();
    return {
      totalIncome: 0,
      totalExpenses: 0,
      taxableIncome: 0,
      estimatedTax: 0,
      estimatedNI: 0,
      totalLiability: 0,
      taxYear: label,
      monthsRemaining,
      hasAnyPayments: false,
      loading: true,
    };
  });

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const { startISO, endISO, label, monthsRemaining } = currentUkTaxYear();

      const [paymentsRes, expensesRes, mileageRes] = await Promise.all([
        supabase
          .from("payment_history")
          .select("amount")
          .eq("instructor_id", instructorId)
          .gte("recorded_at", `${startISO}T00:00:00`)
          .lte("recorded_at", `${endISO}T23:59:59`),
        supabase
          .from("instructor_expenses")
          .select("amount")
          .eq("instructor_id", instructorId)
          .gte("expense_date", startISO)
          .lte("expense_date", endISO),
        supabase
          .from("mileage_logs")
          .select("distance_km")
          .eq("instructor_id", instructorId)
          .eq("trip_type", "business")
          .gte("log_date", startISO)
          .lte("log_date", endISO),
      ]);

      if (cancelled) return;

      const payments = (paymentsRes.data || []).filter((p: any) => Number(p.amount) > 0);
      const totalIncome = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const manualExpenses = (expensesRes.data || []).reduce(
        (s: number, e: any) => s + Number(e.amount),
        0,
      );
      const totalBusinessMiles = (mileageRes.data || []).reduce(
        (s: number, l: any) => s + Number(l.distance_km) * KM_TO_MILES,
        0,
      );
      const mileageDeduction = calculateHmrcMileageDeduction(totalBusinessMiles);
      const totalExpenses = manualExpenses + mileageDeduction;
      const taxableIncome = Math.max(0, totalIncome - totalExpenses);
      const estimatedTax = calculateTax(taxableIncome);
      const estimatedNI = calculateNI(taxableIncome);

      setState({
        totalIncome,
        totalExpenses,
        taxableIncome,
        estimatedTax,
        estimatedNI,
        totalLiability: estimatedTax + estimatedNI,
        taxYear: label,
        monthsRemaining,
        hasAnyPayments: payments.length > 0,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  return state;
}
