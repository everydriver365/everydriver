import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfYear, endOfYear, subYears, parseISO } from "date-fns";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  PoundSterling,
  Receipt,
  TrendingUp,
  FileText,
  Info,
  ArrowRight,
  ReceiptText,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateTax, calculateNI } from "@/lib/ukTax";

interface TaxSummary {
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  estimatedNI: number;
  totalLiability: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

// UK Tax thresholds reused for the band-label below (Personal allowance + basic band).
const PERSONAL_ALLOWANCE = 12570;
const BASIC_RATE_THRESHOLD = 50270;

// Expense Breakdown — fixed category list and colour map for visual consistency.
const ALL_EXPENSE_CATEGORIES = [
  "Mileage Allowance",
  "Fuel",
  "Vehicle Maintenance",
  "Insurance",
  "Training Materials",
  "Office Supplies",
  "Marketing",
  "Tolls & Parking",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Mileage Allowance": "#1E4D9B",
  "Fuel": "#059669",
  "Vehicle Maintenance": "#F59E0B",
  "Insurance": "#0891B2",
  "Training Materials": "#7C3AED",
  "Office Supplies": "#DB2777",
  "Marketing": "#EA580C",
  "Tolls & Parking": "#9CA3AF",
  "Other": "#6B7280",
};

// Tax + NI maths now live in src/lib/ukTax.ts (single source of truth — includes
// PA taper, Class 2 NI, and London-timezone tax-year boundaries).



export default function InstructorTax() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState(new Date());
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorId) {
      fetchTaxData();
    }
  }, [instructorId, selectedYear]);

  const fetchTaxData = async () => {
    if (!instructorId) return;
    
    setLoading(true);
    try {
      // Use tax year (April 6 - April 5)
      const yearStart = format(startOfYear(selectedYear), "yyyy");
      const taxYearStart = `${yearStart}-04-06`;
      const taxYearEnd = `${parseInt(yearStart) + 1}-04-05`;

      // Fetch income
      const { data: payments, error: paymentsError } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .gte("recorded_at", `${taxYearStart}T00:00:00`)
        .lte("recorded_at", `${taxYearEnd}T23:59:59`);

      if (paymentsError) throw paymentsError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("instructor_expenses")
        .select("amount, category")
        .eq("instructor_id", instructorId)
        .gte("expense_date", taxYearStart)
        .lte("expense_date", taxYearEnd);

      if (expensesError) throw expensesError;

      // Fetch business mileage for HMRC mileage allowance
      const { data: mileageLogs } = await supabase
        .from("mileage_logs")
        .select("distance_km")
        .eq("instructor_id", instructorId)
        .eq("trip_type", "business")
        .gte("log_date", taxYearStart)
        .lte("log_date", taxYearEnd);

      const totalBusinessMiles = (mileageLogs || [])
        .reduce((sum, l: any) => sum + (Number(l.distance_km) * 0.621371), 0);

      const mileageDeduction = totalBusinessMiles <= 10000
        ? totalBusinessMiles * 0.45
        : 10000 * 0.45 + (totalBusinessMiles - 10000) * 0.25;

      // Only count positive payments as income (negative = lesson charges / cancellation fees)
      const totalIncome = (payments || [])
        .filter(p => Number(p.amount) > 0)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const manualExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenses = manualExpenses + mileageDeduction;
      const taxableIncome = Math.max(0, totalIncome - totalExpenses);
      
      const estimatedTax = calculateTax(taxableIncome);
      const ni = calculateNI(taxableIncome);
      const estimatedNI = ni.total;

      setSummary({
        totalIncome,
        totalExpenses,
        taxableIncome,
        estimatedTax,
        estimatedNI,
        totalLiability: estimatedTax + estimatedNI,
      });

      // Calculate expense breakdown
      const categoryTotals: Record<string, number> = {};
      (expenses || []).forEach((e: any) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });

      // Add mileage allowance as a category if applicable
      if (mileageDeduction > 0) {
        categoryTotals["Mileage Allowance"] = mileageDeduction;
      }

      const breakdown = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      setExpenseBreakdown(breakdown);
    } catch (error) {
      console.error("Error fetching tax data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateYear = (direction: "prev" | "next") => {
    setSelectedYear(prev => 
      direction === "prev" ? subYears(prev, 1) : subYears(prev, -1)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const getTaxYear = () => {
    const year = selectedYear.getFullYear();
    return `${year}/${year + 1}`;
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <PageSkeleton />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {loading ? (
          <Skeleton className="h-[420px] rounded-[12px]" />
        ) : (
          (() => {
            const liability = summary?.totalLiability ?? 0;
            const taxable = summary?.taxableIncome ?? 0;
            const withinAllowance = taxable <= PERSONAL_ALLOWANCE;
            const liabilityColor = liability <= 0 ? "#059669" : "#D12E2E";
            const barColor = withinAllowance ? "#059669" : "#D12E2E";
            const barPct = Math.min(100, (taxable / PERSONAL_ALLOWANCE) * 100);
            return (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E7EB",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {/* Section 1 — Header */}
                <div
                  style={{
                    padding: 16,
                    borderBottom: "0.5px solid #F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <ReceiptText size={18} color="#6B7280" style={{ marginTop: 2 }} aria-hidden />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "#0A0E27", lineHeight: 1.2 }}>
                        Tax summary
                      </div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                        Estimated tax liability
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => navigateYear("prev")}
                      aria-label="Previous tax year"
                      style={{
                        background: "transparent",
                        border: 0,
                        padding: 4,
                        cursor: "pointer",
                        display: "inline-flex",
                      }}
                    >
                      <ChevronLeft size={14} color="#9CA3AF" />
                    </button>
                    <span style={{ fontSize: 12, color: "#6B7280", minWidth: 78, textAlign: "center" }}>
                      {getTaxYear()}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateYear("next")}
                      disabled={selectedYear.getFullYear() >= new Date().getFullYear()}
                      aria-label="Next tax year"
                      style={{
                        background: "transparent",
                        border: 0,
                        padding: 4,
                        cursor: selectedYear.getFullYear() >= new Date().getFullYear() ? "default" : "pointer",
                        display: "inline-flex",
                        opacity: selectedYear.getFullYear() >= new Date().getFullYear() ? 0.4 : 1,
                      }}
                    >
                      <ChevronRight size={14} color="#9CA3AF" />
                    </button>
                  </div>
                </div>

                {/* Section 2 — Disclaimer */}
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#F9FAFB",
                    borderBottom: "0.5px solid #F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Info size={13} color="#9CA3AF" aria-hidden />
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                    Estimates only — consult an accountant for accurate advice
                  </span>
                </div>

                {/* Section 3 — Total tax due */}
                <div style={{ padding: 16, borderBottom: "0.5px solid #F3F4F6" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Estimated total tax due
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 500,
                      letterSpacing: -1,
                      color: liabilityColor,
                      lineHeight: 1.1,
                    }}
                  >
                    {formatCurrency(liability)}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                      Income tax:{" "}
                      <span style={{ color: "#0A0E27", fontWeight: 500 }}>
                        {formatCurrency(summary?.estimatedTax ?? 0)}
                      </span>
                    </span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                      Class 2 + 4 NI:{" "}
                      <span style={{ color: "#0A0E27", fontWeight: 500 }}>
                        {formatCurrency(summary?.estimatedNI ?? 0)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Section 4 — Income / Deductions */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: "0.5px solid #F3F4F6",
                  }}
                >
                  <div style={{ padding: "14px 16px", borderRight: "0.5px solid #F3F4F6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <TrendingUp size={14} color="#059669" aria-hidden />
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>Total income</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: "#059669" }}>
                      {formatCurrency(summary?.totalIncome ?? 0)}
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Receipt size={14} color="#F59E0B" aria-hidden />
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>Deductions</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: "#F59E0B" }}>
                      {formatCurrency(summary?.totalExpenses ?? 0)}
                    </div>
                  </div>
                </div>

                {/* Section 5 — Taxable profit */}
                <div style={{ padding: "14px 16px", borderTop: "0.5px solid #F3F4F6" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <PoundSterling size={14} color="#9CA3AF" aria-hidden />
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>Taxable profit</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500, color: "#0A0E27" }}>
                      {formatCurrency(taxable)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "#F3F4F6",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: `${barPct}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: withinAllowance ? "#9CA3AF" : "#D12E2E" }}>
                    {withinAllowance
                      ? `Within personal allowance (${formatCurrency(PERSONAL_ALLOWANCE)})`
                      : "Exceeds personal allowance — tax is due"}
                  </div>
                </div>

                {/* Section 6 — Action */}
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#F9FAFB",
                    borderTop: "0.5px solid #F3F4F6",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate("/instructor/accounts")}
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      border: "0.5px solid #E5E7EB",
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#0A0E27",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Calculator size={14} color="#6B7280" aria-hidden />
                      View full tax report
                    </span>
                    <ArrowRight size={14} color="#9CA3AF" aria-hidden />
                  </button>
                </div>
              </div>
            );
          })()
        )}


        {/* Expense Breakdown */}
        {!loading && (
          <div
            style={{
              background: "#FFFFFF",
              border: "0.5px solid #E5E7EB",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {(() => {
              const knownSet = new Set(ALL_EXPENSE_CATEGORIES);
              const extras = expenseBreakdown.filter(
                (e) => !knownSet.has(e.category)
              );
              const allCategories = ALL_EXPENSE_CATEGORIES.map((cat) => {
                const found = expenseBreakdown.find(
                  (e) => e.category === cat
                );
                return { category: cat, amount: found?.amount ?? 0 };
              });
              extras.forEach((e) =>
                allCategories.push({ category: e.category, amount: e.amount })
              );
              allCategories.sort((a, b) => b.amount - a.amount);

              const totalExpenses = allCategories.reduce(
                (sum, c) => sum + c.amount,
                0
              );

              return (
                <>
                  {/* Section 1 — Header */}
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "0.5px solid #F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Receipt
                        size={18}
                        color="#6B7280"
                        aria-hidden
                      />
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: "#0A0E27",
                        }}
                      >
                        Expense breakdown
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>
                      {getTaxYear()}
                    </span>
                  </div>

                  {/* Section 2 — Total expenses bar */}
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#F9FAFB",
                      borderBottom: "0.5px solid #F3F4F6",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                      Total expenses
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#0A0E27",
                      }}
                    >
                      {formatCurrency(totalExpenses)}
                    </span>
                  </div>

                  {/* Section 3 — Category rows */}
                  {allCategories.map((cat, idx) => {
                    const hasAmount = cat.amount > 0;
                    const color =
                      CATEGORY_COLORS[cat.category] || "#6B7280";
                    const pct =
                      totalExpenses > 0
                        ? Math.round((cat.amount / totalExpenses) * 100)
                        : 0;
                    const barWidth =
                      totalExpenses > 0
                        ? `${Math.min(
                            Math.round(
                              (cat.amount / totalExpenses) * 100
                            ),
                            100
                          )}%`
                        : "0%";
                    const isLast = idx === allCategories.length - 1;

                    return (
                      <div
                        key={cat.category}
                        style={{
                          padding: "14px 16px",
                          borderBottom: isLast
                            ? "none"
                            : "0.5px solid #F3F4F6",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 13,
                                color: hasAmount ? "#0A0E27" : "#9CA3AF",
                              }}
                            >
                              {cat.category}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: hasAmount ? "#0A0E27" : "#9CA3AF",
                              }}
                            >
                              {formatCurrency(cat.amount)}
                            </span>
                            <span
                              style={{ fontSize: 11, color: "#9CA3AF" }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "#F3F4F6",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: barWidth,
                              height: "100%",
                              background: color,
                              borderRadius: 4,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Section 4 — Action button */}
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#F9FAFB",
                      borderTop: "0.5px solid #F3F4F6",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate("/instructor/expenses")}
                      style={{
                        width: "100%",
                        background: "#FFFFFF",
                        border: "0.5px solid #E5E7EB",
                        borderRadius: 8,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#0A0E27",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Plus
                          size={14}
                          color="#6B7280"
                          aria-hidden
                        />
                        Add an expense
                      </span>
                      <ArrowRight
                        size={14}
                        color="#9CA3AF"
                        aria-hidden
                      />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
