import { useState, useEffect } from "react";
import { format, startOfYear, endOfYear, subYears, parseISO } from "date-fns";
import { Calculator, Calendar, ChevronLeft, ChevronRight, PoundSterling, Receipt, TrendingUp, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";

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

// UK Tax rates for 2024-25
const PERSONAL_ALLOWANCE = 12570;
const BASIC_RATE_THRESHOLD = 50270;
const HIGHER_RATE_THRESHOLD = 125140;
const BASIC_RATE = 0.20;
const HIGHER_RATE = 0.40;
const ADDITIONAL_RATE = 0.45;

// Class 4 NI rates
const NI_LOWER_PROFITS_LIMIT = 12570;
const NI_UPPER_PROFITS_LIMIT = 50270;
const NI_MAIN_RATE = 0.06; // 6% for 2024-25
const NI_ADDITIONAL_RATE = 0.02;

function calculateTax(taxableIncome: number): number {
  if (taxableIncome <= PERSONAL_ALLOWANCE) return 0;
  
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  // Personal allowance reduction for high earners
  let personalAllowance = PERSONAL_ALLOWANCE;
  if (taxableIncome > 100000) {
    personalAllowance = Math.max(0, PERSONAL_ALLOWANCE - ((taxableIncome - 100000) / 2));
  }
  
  remainingIncome -= personalAllowance;
  
  if (remainingIncome <= 0) return 0;
  
  // Basic rate
  const basicRateBand = Math.min(remainingIncome, BASIC_RATE_THRESHOLD - PERSONAL_ALLOWANCE);
  tax += basicRateBand * BASIC_RATE;
  remainingIncome -= basicRateBand;
  
  if (remainingIncome <= 0) return tax;
  
  // Higher rate
  const higherRateBand = Math.min(remainingIncome, HIGHER_RATE_THRESHOLD - BASIC_RATE_THRESHOLD);
  tax += higherRateBand * HIGHER_RATE;
  remainingIncome -= higherRateBand;
  
  if (remainingIncome <= 0) return tax;
  
  // Additional rate
  tax += remainingIncome * ADDITIONAL_RATE;
  
  return tax;
}

function calculateNI(taxableIncome: number): number {
  if (taxableIncome <= NI_LOWER_PROFITS_LIMIT) return 0;
  
  let ni = 0;
  
  // Main rate
  const mainRateBand = Math.min(
    Math.max(0, taxableIncome - NI_LOWER_PROFITS_LIMIT),
    NI_UPPER_PROFITS_LIMIT - NI_LOWER_PROFITS_LIMIT
  );
  ni += mainRateBand * NI_MAIN_RATE;
  
  // Additional rate
  if (taxableIncome > NI_UPPER_PROFITS_LIMIT) {
    ni += (taxableIncome - NI_UPPER_PROFITS_LIMIT) * NI_ADDITIONAL_RATE;
  }
  
  return ni;
}

export default function InstructorTax() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
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
      const estimatedNI = calculateNI(taxableIncome);

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
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-xl font-bold">Tax Summary</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Estimated tax liability</p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
          <Button variant="ghost" size="icon" onClick={() => navigateYear("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Tax Year {getTaxYear()}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigateYear("next")}
            disabled={selectedYear.getFullYear() >= new Date().getFullYear()}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            These are estimates only. Consult an accountant for accurate tax advice.
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Total Tax Liability */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Estimated Total Tax Due</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(summary?.totalLiability || 0)}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Income Tax: {formatCurrency(summary?.estimatedTax || 0)}</span>
                  <span>Class 4 NI: {formatCurrency(summary?.estimatedNI || 0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Income & Expenses */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-emerald-500/5 to-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Total Income</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(summary?.totalIncome || 0)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500/5 to-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Deductions</span>
                  </div>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(summary?.totalExpenses || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Taxable Income */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PoundSterling className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Taxable Profit</span>
                  </div>
                  <span className="font-bold">{formatCurrency(summary?.taxableIncome || 0)}</span>
                </div>
                <Progress 
                  value={Math.min(100, ((summary?.taxableIncome || 0) / BASIC_RATE_THRESHOLD) * 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(summary?.taxableIncome || 0) <= PERSONAL_ALLOWANCE 
                    ? "Within personal allowance"
                    : (summary?.taxableIncome || 0) <= BASIC_RATE_THRESHOLD
                      ? "Basic rate band"
                      : "Higher rate band"
                  }
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Expense Breakdown */}
        {!loading && expenseBreakdown.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Expense Breakdown
            </h2>
            
            {expenseBreakdown.map((item) => (
              <Card key={item.category}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{item.category}</span>
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                  <Progress value={item.percentage} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.percentage.toFixed(1)}% of total expenses
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && expenseBreakdown.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No expenses recorded for this tax year</p>
              <p className="text-xs text-muted-foreground mt-1">
                Recording expenses reduces your tax liability
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
