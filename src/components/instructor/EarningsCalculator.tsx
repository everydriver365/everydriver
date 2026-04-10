import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PoundSterling, 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Fuel, 
  Calculator,
  Receipt,
  AlertCircle
} from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";

interface EarningsCalculatorProps {
  instructorId: string;
}

interface AccountSettings {
  tax_code: string;
  hourly_rate: number;
  vehicle_mpg: number;
  fuel_cost_per_litre: number;
}

interface PeriodData {
  income: number;
  hours: number;
  mileage: number;
  fuelCost: number;
  expenses: number;
  netProfit: number;
  estimatedTax: number;
  estimatedNI: number;
}

// UK 2024/25 Tax Rates
const TAX_FREE_ALLOWANCE = 12570;
const BASIC_RATE_THRESHOLD = 50270;
const HIGHER_RATE_THRESHOLD = 125140;
const BASIC_RATE = 0.20;
const HIGHER_RATE = 0.40;
const ADDITIONAL_RATE = 0.45;

// National Insurance Class 4 rates
const NI_LOWER_PROFITS_LIMIT = 12570;
const NI_UPPER_PROFITS_LIMIT = 50270;
const NI_MAIN_RATE = 0.06; // 6% for 2024/25
const NI_ADDITIONAL_RATE = 0.02;

// HMRC mileage allowance
const MILEAGE_ALLOWANCE_FIRST_10K = 0.45;
const MILEAGE_ALLOWANCE_AFTER_10K = 0.25;

function calculateAnnualTax(annualIncome: number, taxCode: string): { incomeTax: number; nationalInsurance: number } {
  // Parse tax code to get personal allowance
  const codeNumber = parseInt(taxCode.replace(/[A-Z]/g, '')) || 1257;
  const personalAllowance = codeNumber * 10;

  // Calculate taxable income
  let taxableIncome = Math.max(0, annualIncome - personalAllowance);
  
  // Income Tax calculation
  let incomeTax = 0;
  
  if (taxableIncome > 0) {
    // Basic rate (20%)
    const basicRateBand = Math.min(taxableIncome, BASIC_RATE_THRESHOLD - TAX_FREE_ALLOWANCE);
    incomeTax += basicRateBand * BASIC_RATE;
    
    // Higher rate (40%)
    if (taxableIncome > BASIC_RATE_THRESHOLD - TAX_FREE_ALLOWANCE) {
      const higherRateBand = Math.min(
        taxableIncome - (BASIC_RATE_THRESHOLD - TAX_FREE_ALLOWANCE),
        HIGHER_RATE_THRESHOLD - BASIC_RATE_THRESHOLD
      );
      incomeTax += higherRateBand * HIGHER_RATE;
    }
    
    // Additional rate (45%)
    if (taxableIncome > HIGHER_RATE_THRESHOLD - TAX_FREE_ALLOWANCE) {
      const additionalRateBand = taxableIncome - (HIGHER_RATE_THRESHOLD - TAX_FREE_ALLOWANCE);
      incomeTax += additionalRateBand * ADDITIONAL_RATE;
    }
  }

  // National Insurance Class 4 calculation (for self-employed)
  let nationalInsurance = 0;
  
  if (annualIncome > NI_LOWER_PROFITS_LIMIT) {
    // Main rate (6% in 2024/25)
    const mainRateBand = Math.min(annualIncome, NI_UPPER_PROFITS_LIMIT) - NI_LOWER_PROFITS_LIMIT;
    nationalInsurance += Math.max(0, mainRateBand) * NI_MAIN_RATE;
    
    // Additional rate (2%)
    if (annualIncome > NI_UPPER_PROFITS_LIMIT) {
      nationalInsurance += (annualIncome - NI_UPPER_PROFITS_LIMIT) * NI_ADDITIONAL_RATE;
    }
  }

  return { incomeTax, nationalInsurance };
}

function calculateMileageAllowance(totalMiles: number): number {
  if (totalMiles <= 10000) {
    return totalMiles * MILEAGE_ALLOWANCE_FIRST_10K;
  }
  return (10000 * MILEAGE_ALLOWANCE_FIRST_10K) + ((totalMiles - 10000) * MILEAGE_ALLOWANCE_AFTER_10K);
}

export function EarningsCalculator({ instructorId }: EarningsCalculatorProps) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [periodData, setPeriodData] = useState<PeriodData | null>(null);
  const [annualProjection, setAnnualProjection] = useState<{ tax: number; ni: number } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [instructorId]);

  useEffect(() => {
    if (settings) {
      fetchPeriodData();
    }
  }, [settings, period]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("tax_code, hourly_rate, vehicle_mpg, fuel_cost_per_litre")
        .eq("id", instructorId)
        .single();

      if (error) throw error;

      setSettings({
        tax_code: data.tax_code || "1257L",
        hourly_rate: data.hourly_rate || 40,
        vehicle_mpg: data.vehicle_mpg || 40,
        fuel_cost_per_litre: data.fuel_cost_per_litre || 1.45,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchPeriodData = async () => {
    if (!settings) return;
    
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case "daily":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "weekly":
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case "monthly":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "yearly":
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
      }

      // Fetch lessons for income
      const { data: lessons, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .select("duration_minutes, lesson_date")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(startDate, "yyyy-MM-dd"))
        .lte("lesson_date", format(endDate, "yyyy-MM-dd"))
        .eq("status", "completed");

      if (lessonsError) throw lessonsError;

      // Fetch mileage from mileage_log table
      const { data: mileage, error: mileageError } = await supabase
        .from("mileage_log")
        .select("end_odometer_km, start_odometer_km")
        .eq("instructor_id", instructorId)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"));

      if (mileageError) throw mileageError;

      // Fetch expenses
      const { data: expenseData, error: expensesError } = await supabase
        .from("instructor_expenses")
        .select("amount")
        .eq("instructor_id", instructorId)
        .gte("expense_date", format(startDate, "yyyy-MM-dd"))
        .lte("expense_date", format(endDate, "yyyy-MM-dd"));

      if (expensesError) throw expensesError;

      // Calculate totals
      const totalHours = (lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0) / 60;
      const income = totalHours * settings.hourly_rate;
      
      const totalKm = mileage?.reduce((sum, m) => sum + ((m.end_odometer_km || 0) - (m.start_odometer_km || 0)), 0) || 0;
      const totalMiles = totalKm * 0.621371;
      
      // Calculate fuel cost based on MPG and fuel price
      const gallonsUsed = totalMiles / settings.vehicle_mpg;
      const litresUsed = gallonsUsed * 4.546; // UK gallons to litres
      const fuelCost = litresUsed * settings.fuel_cost_per_litre;
      
      const expenses = expenseData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      
      // Net profit before tax
      const netProfit = income - fuelCost - expenses;

      // Project to annual for tax calculation
      let multiplier = 1;
      switch (period) {
        case "daily": multiplier = 260; break; // working days
        case "weekly": multiplier = 52; break;
        case "monthly": multiplier = 12; break;
        case "yearly": multiplier = 1; break;
      }

      const annualNetProfit = netProfit * multiplier;
      const { incomeTax, nationalInsurance } = calculateAnnualTax(annualNetProfit, settings.tax_code);
      
      // Apportion tax to period
      const periodTax = incomeTax / multiplier;
      const periodNI = nationalInsurance / multiplier;

      setPeriodData({
        income,
        hours: totalHours,
        mileage: totalMiles,
        fuelCost,
        expenses,
        netProfit,
        estimatedTax: periodTax,
        estimatedNI: periodNI,
      });

      setAnnualProjection({ tax: incomeTax, ni: nationalInsurance });
    } catch (error) {
      console.error("Error fetching period data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const periodLabel = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year",
  };

  if (!settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Earnings & Tax</h2>
        <p className="text-muted-foreground">
          Income, costs and estimated tax based on your settings
        </p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-4 mt-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : periodData && (
            <>
              {/* Income & Costs Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-success/10 border-success/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">Income</span>
                    </div>
                    <div className="text-2xl font-bold text-success">
                      {formatCurrency(periodData.income)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {periodData.hours.toFixed(1)} hours
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Fuel className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-muted-foreground">Fuel</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {formatCurrency(periodData.fuelCost)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {periodData.mileage.toFixed(0)} miles
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-destructive/10 border-destructive/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">Expenses</span>
                    </div>
                    <div className="text-2xl font-bold text-destructive">
                      {formatCurrency(periodData.expenses)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Other costs
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-primary/10 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <PoundSterling className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Net Profit</span>
                    </div>
                    <div className={`text-2xl font-bold ${periodData.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(periodData.netProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Before tax
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tax Estimate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Estimated Tax ({periodLabel[period]})
                  </CardTitle>
                  <CardDescription>
                    Based on {settings.tax_code} tax code and current HMRC rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-none bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">Income Tax</div>
                      <div className="text-xl font-bold">{formatCurrency(periodData.estimatedTax)}</div>
                    </div>
                    <div className="p-4 rounded-none bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">National Insurance</div>
                      <div className="text-xl font-bold">{formatCurrency(periodData.estimatedNI)}</div>
                    </div>
                    <div className="p-4 rounded-none bg-primary/10">
                      <div className="text-sm text-muted-foreground mb-1">Take Home</div>
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(periodData.netProfit - periodData.estimatedTax - periodData.estimatedNI)}
                      </div>
                    </div>
                  </div>

                  {annualProjection && period !== "yearly" && (
                    <div className="mt-4 p-4 rounded-none bg-muted/30 border">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Annual Projection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        If you continue at this rate, your estimated annual tax bill would be{" "}
                        <span className="font-semibold">{formatCurrency(annualProjection.tax)}</span> income tax 
                        plus <span className="font-semibold">{formatCurrency(annualProjection.ni)}</span> National Insurance.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Gross Income</span>
                      <span className="font-medium text-success">{formatCurrency(periodData.income)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Fuel Costs</span>
                      <span className="font-medium text-destructive">-{formatCurrency(periodData.fuelCost)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Other Expenses</span>
                      <span className="font-medium text-destructive">-{formatCurrency(periodData.expenses)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Estimated Income Tax</span>
                      <span className="font-medium text-destructive">-{formatCurrency(periodData.estimatedTax)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">National Insurance</span>
                      <span className="font-medium text-destructive">-{formatCurrency(periodData.estimatedNI)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 font-bold text-lg">
                      <span>Take Home</span>
                      <span className={periodData.netProfit - periodData.estimatedTax - periodData.estimatedNI >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(periodData.netProfit - periodData.estimatedTax - periodData.estimatedNI)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
