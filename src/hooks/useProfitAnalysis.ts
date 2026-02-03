import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

interface ProfitAnalysis {
  period: string;
  periodStart: string;
  periodEnd: string;
  grossIncome: number;
  fuelCosts: number;
  vehicleCosts: number;
  businessCosts: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  hoursWorked: number;
  effectiveHourlyRate: number;
  lessonsCompleted: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export function useProfitAnalysis(instructorId: string | null, months: number = 3) {
  // Fetch lesson data (income)
  const { data: lessons } = useQuery({
    queryKey: ["profit-lessons", instructorId, months],
    queryFn: async () => {
      if (!instructorId) return [];
      
      const startDate = format(startOfMonth(subMonths(new Date(), months - 1)), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, duration_minutes, payment_status, amount_due")
        .eq("instructor_id", instructorId)
        .eq("status", "completed")
        .gte("lesson_date", startDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!instructorId,
  });

  // Fetch mileage (for fuel cost calculation)
  const { data: mileage } = useQuery({
    queryKey: ["profit-mileage", instructorId, months],
    queryFn: async () => {
      if (!instructorId) return [];
      
      const startDate = format(startOfMonth(subMonths(new Date(), months - 1)), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("mileage_logs")
        .select("log_date, distance_km, trip_type")
        .eq("instructor_id", instructorId)
        .eq("trip_type", "business")
        .gte("log_date", startDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!instructorId,
  });

  // Fetch instructor settings (for MPG and fuel price)
  const { data: instructor } = useQuery({
    queryKey: ["profit-instructor", instructorId],
    queryFn: async () => {
      if (!instructorId) return null;
      
      const { data, error } = await supabase
        .from("instructors")
        .select("vehicle_mpg, fuel_cost_per_litre, hourly_rate")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!instructorId,
  });

  // Fetch expenses
  const { data: expenses } = useQuery({
    queryKey: ["profit-expenses", instructorId, months],
    queryFn: async () => {
      if (!instructorId) return [];
      
      const startDate = format(startOfMonth(subMonths(new Date(), months - 1)), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("instructor_expenses")
        .select("expense_date, amount, category")
        .eq("instructor_id", instructorId)
        .gte("expense_date", startDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!instructorId,
  });

  // Fetch recurring expenses
  const { data: recurringExpenses } = useQuery({
    queryKey: ["profit-recurring", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("amount, frequency, category")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!instructorId,
  });

  // Calculate monthly profit analysis
  const analysis = useMemo((): ProfitAnalysis[] => {
    if (!lessons || !instructor) return [];

    const result: ProfitAnalysis[] = [];
    const vehicleMpg = instructor.vehicle_mpg || 40;
    const fuelCostPerLitre = instructor.fuel_cost_per_litre || 1.45;

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(new Date(), i);
      const periodStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
      const periodEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");
      const periodLabel = format(monthDate, "MMM yyyy");

      // Filter data for this month
      const monthLessons = lessons.filter(l => 
        l.lesson_date >= periodStart && l.lesson_date <= periodEnd
      );
      
      const monthMileage = mileage?.filter(m => 
        m.log_date >= periodStart && m.log_date <= periodEnd
      ) || [];

      const monthExpenses = expenses?.filter(e => 
        e.expense_date >= periodStart && e.expense_date <= periodEnd
      ) || [];

      // Calculate income
      const grossIncome = monthLessons.reduce((sum, l) => 
        sum + (l.amount_due || 0), 0
      );

      // Calculate hours worked
      const hoursWorked = monthLessons.reduce((sum, l) => 
        sum + ((l.duration_minutes || 60) / 60), 0
      );

      // Calculate fuel costs
      const totalDistanceKm = monthMileage.reduce((sum, m) => sum + (m.distance_km || 0), 0);
      const totalDistanceMiles = totalDistanceKm * 0.621371;
      const gallonsUsed = totalDistanceMiles / vehicleMpg;
      const litresUsed = gallonsUsed * 4.54609;
      const fuelCosts = litresUsed * fuelCostPerLitre;

      // Categorize expenses
      const vehicleCats = ["vehicle", "car", "insurance", "mot", "service", "maintenance", "tax"];
      const vehicleCosts = monthExpenses
        .filter(e => vehicleCats.some(cat => e.category?.toLowerCase().includes(cat)))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const businessCosts = monthExpenses
        .filter(e => !vehicleCats.some(cat => e.category?.toLowerCase().includes(cat)))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Add recurring expenses (prorated)
      const monthlyRecurring = recurringExpenses?.reduce((sum, e) => {
        const monthly = e.frequency === "yearly" ? (e.amount || 0) / 12 
          : e.frequency === "quarterly" ? (e.amount || 0) / 3
          : (e.amount || 0);
        return sum + monthly;
      }, 0) || 0;

      const totalExpenses = fuelCosts + vehicleCosts + businessCosts + monthlyRecurring;
      const netProfit = grossIncome - totalExpenses;
      const profitMargin = grossIncome > 0 ? (netProfit / grossIncome) * 100 : 0;
      const effectiveHourlyRate = hoursWorked > 0 ? netProfit / hoursWorked : 0;

      result.push({
        period: periodLabel,
        periodStart,
        periodEnd,
        grossIncome,
        fuelCosts,
        vehicleCosts: vehicleCosts + monthlyRecurring / 2, // Split recurring
        businessCosts: businessCosts + monthlyRecurring / 2,
        totalExpenses,
        netProfit,
        profitMargin,
        hoursWorked,
        effectiveHourlyRate,
        lessonsCompleted: monthLessons.length,
      });
    }

    return result.reverse(); // Oldest first
  }, [lessons, mileage, expenses, recurringExpenses, instructor, months]);

  // Calculate expense breakdown
  const expenseBreakdown = useMemo((): ExpenseBreakdown[] => {
    if (analysis.length === 0) return [];

    const totals = analysis.reduce((acc, month) => ({
      fuel: acc.fuel + month.fuelCosts,
      vehicle: acc.vehicle + month.vehicleCosts,
      business: acc.business + month.businessCosts,
    }), { fuel: 0, vehicle: 0, business: 0 });

    const total = totals.fuel + totals.vehicle + totals.business;
    if (total === 0) return [];

    return [
      { category: "Fuel", amount: totals.fuel, percentage: (totals.fuel / total) * 100 },
      { category: "Vehicle", amount: totals.vehicle, percentage: (totals.vehicle / total) * 100 },
      { category: "Business", amount: totals.business, percentage: (totals.business / total) * 100 },
    ];
  }, [analysis]);

  // Summary stats
  const summary = useMemo(() => {
    if (analysis.length === 0) return null;

    return {
      totalGrossIncome: analysis.reduce((sum, m) => sum + m.grossIncome, 0),
      totalNetProfit: analysis.reduce((sum, m) => sum + m.netProfit, 0),
      totalExpenses: analysis.reduce((sum, m) => sum + m.totalExpenses, 0),
      averageMonthlyProfit: analysis.reduce((sum, m) => sum + m.netProfit, 0) / analysis.length,
      averageProfitMargin: analysis.reduce((sum, m) => sum + m.profitMargin, 0) / analysis.length,
      averageHourlyRate: (() => {
        const totalHours = analysis.reduce((sum, m) => sum + m.hoursWorked, 0);
        const totalProfit = analysis.reduce((sum, m) => sum + m.netProfit, 0);
        return totalHours > 0 ? totalProfit / totalHours : 0;
      })(),
      advertisedHourlyRate: instructor?.hourly_rate || 0,
    };
  }, [analysis, instructor]);

  return {
    analysis,
    expenseBreakdown,
    summary,
    isLoading: !lessons || !instructor,
  };
}
