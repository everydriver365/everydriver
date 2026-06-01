import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateTax,
  calculateNI,
  calculateHmrcMileageDeduction,
  currentUkTaxYear,
  KM_TO_MILES,
} from "@/lib/ukTax";

export type AccountingBasis = "cash" | "accruals";

export interface InstructorTaxSummary {
  /** Year-to-date figures (actuals so far this tax year). */
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  estimatedNI: number;
  estimatedClass2NI: number;
  estimatedClass4NI: number;
  totalLiability: number;
  /** Full-year projection (ytd extrapolated to 365/366 days). */
  projectedAnnualIncome: number;
  projectedAnnualExpenses: number;
  projectedTaxableIncome: number;
  projectedTax: number;
  projectedNI: number;
  projectedLiability: number;
  daysElapsed: number;
  taxYear: string;
  monthsRemaining: number;
  accountingBasis: AccountingBasis;
  /** True only if at least one positive income row exists this tax year. */
  hasAnyPayments: boolean;
  loading: boolean;
}

function daysBetweenISO(startISO: string, endISO: string): number {
  const start = new Date(`${startISO}T00:00:00+01:00`).getTime();
  const end = new Date(`${endISO}T00:00:00+01:00`).getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Headline tax figures for the instructor dashboard tile. Honours
 * `mtd_instructor_settings.accounting_type` to pick cash (payment_history)
 * vs accruals (delivered lessons from scheduled_lessons) basis, includes
 * Class 2 NI, applies the personal-allowance taper, and returns both
 * year-to-date and full-year-projection liabilities.
 */
export function useInstructorTaxSummary(instructorId: string | undefined): InstructorTaxSummary {
  const initial = (): InstructorTaxSummary => {
    const { label, monthsRemaining } = currentUkTaxYear();
    return {
      totalIncome: 0,
      totalExpenses: 0,
      taxableIncome: 0,
      estimatedTax: 0,
      estimatedNI: 0,
      estimatedClass2NI: 0,
      estimatedClass4NI: 0,
      totalLiability: 0,
      projectedAnnualIncome: 0,
      projectedAnnualExpenses: 0,
      projectedTaxableIncome: 0,
      projectedTax: 0,
      projectedNI: 0,
      projectedLiability: 0,
      daysElapsed: 0,
      taxYear: label,
      monthsRemaining,
      accountingBasis: "cash",
      hasAnyPayments: false,
      loading: true,
    };
  };

  const [state, setState] = useState<InstructorTaxSummary>(initial);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const { startISO, endISO, label, monthsRemaining } = currentUkTaxYear();
      const todayISO = new Date().toISOString().slice(0, 10);
      const today = todayISO < startISO ? startISO : (todayISO > endISO ? endISO : todayISO);

      // Resolve accounting basis first so we know which income query to run.
      const settingsRes = await supabase
        .from("mtd_instructor_settings")
        .select("accounting_type")
        .eq("instructor_id", instructorId)
        .maybeSingle();
      const accountingBasis: AccountingBasis =
        settingsRes.data?.accounting_type === "accruals" ? "accruals" : "cash";

      // Income (cash = payment_history; accruals = delivered scheduled_lessons).
      const incomePromise = accountingBasis === "accruals"
        ? supabase
            .from("scheduled_lessons")
            .select("amount_due")
            .eq("instructor_id", instructorId)
            .gte("lesson_date", startISO)
            .lte("lesson_date", today) // only lessons that have already happened
            .in("status", ["scheduled", "confirmed"])
            .is("deleted_at", null)
        : supabase
            .from("payment_history")
            .select("amount")
            // D5: filter by instructor_id + positive amount + not soft-deleted.
            // Once payment_type is backfilled across insert sites, the OR-clause
            // below will exclude platform_fee / commission rows automatically;
            // legacy rows (payment_type IS NULL) remain counted as income.
            .eq("instructor_id", instructorId)
            .is("deleted_at", null)
            .or("payment_type.is.null,payment_type.not.in.(platform_fee,commission)")
            .gte("recorded_at", `${startISO}T00:00:00+01:00`)
            .lte("recorded_at", `${endISO}T23:59:59+01:00`);

      const [incomeRes, expensesRes, mileageRes] = await Promise.all([
        incomePromise,
        supabase
          .from("instructor_expenses")
          .select("amount")
          // D6: instructor_expenses has no `status` or `is_deductible` columns;
          // only `deleted_at` is available for filtering.
          .eq("instructor_id", instructorId)
          .is("deleted_at", null)
          .gte("expense_date", startISO)
          .lte("expense_date", endISO),
        supabase
          .from("mileage_logs")
          .select("distance_km")
          .eq("instructor_id", instructorId)
          // D10: confirmed trip_type values are lowercase 'business' / 'personal'.
          .eq("trip_type", "business")
          .gte("log_date", startISO)
          .lte("log_date", endISO),
      ]);

      if (cancelled) return;

      const incomeRows = (incomeRes.data || []) as Array<{ amount?: number | null; amount_due?: number | null }>;
      const positiveIncomeRows = incomeRows
        .map((r) => Number((r as any).amount ?? (r as any).amount_due ?? 0))
        .filter((n) => n > 0);
      const totalIncome = positiveIncomeRows.reduce((s, n) => s + n, 0);

      const manualExpenses = (expensesRes.data || []).reduce(
        (s: number, e: any) => s + Number(e.amount),
        0,
      );
      // Defensive cap: reject implausible single-trip distances (>500 km)
      // so a stray GPS-jump row can never inflate the HMRC mileage deduction.
      const totalBusinessMiles = (mileageRes.data || []).reduce(
        (s: number, l: any) => {
          const km = Number(l.distance_km);
          if (!isFinite(km) || km <= 0 || km > 500) return s;
          return s + km * KM_TO_MILES;
        },
        0,
      );
      const mileageDeduction = calculateHmrcMileageDeduction(totalBusinessMiles);
      const totalExpenses = manualExpenses + mileageDeduction;
      const taxableIncome = Math.max(0, totalIncome - totalExpenses);

      const estimatedTax = calculateTax(taxableIncome);
      const ni = calculateNI(taxableIncome);

      // D4: full-year projection.
      const daysElapsed = Math.max(1, daysBetweenISO(startISO, todayISO));
      const daysInYear = daysBetweenISO(startISO, endISO) + 1;
      const scale = daysInYear / daysElapsed;
      const projectedAnnualIncome = totalIncome * scale;
      const projectedAnnualExpenses = totalExpenses * scale;
      const projectedTaxableIncome = Math.max(0, projectedAnnualIncome - projectedAnnualExpenses);
      const projectedTax = calculateTax(projectedTaxableIncome);
      const projectedNi = calculateNI(projectedTaxableIncome);

      setState({
        totalIncome,
        totalExpenses,
        taxableIncome,
        estimatedTax,
        estimatedNI: ni.total,
        estimatedClass2NI: ni.class2,
        estimatedClass4NI: ni.class4,
        totalLiability: estimatedTax + ni.total,
        projectedAnnualIncome,
        projectedAnnualExpenses,
        projectedTaxableIncome,
        projectedTax,
        projectedNI: projectedNi.total,
        projectedLiability: projectedTax + projectedNi.total,
        daysElapsed,
        taxYear: label,
        monthsRemaining,
        accountingBasis,
        hasAnyPayments: positiveIncomeRows.length > 0,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  return state;
}
