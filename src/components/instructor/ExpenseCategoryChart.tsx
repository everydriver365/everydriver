import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as PieChartIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths } from "date-fns";

interface ExpenseCategoryChartProps {
  instructorId: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Fuel": "#f59e0b",
  "Vehicle Maintenance": "#3b82f6",
  "Insurance": "#8b5cf6",
  "Training Materials": "#10b981",
  "Office Supplies": "#2A394F",
  "Marketing": "#ec4899",
  "Tolls & Parking": "#14b8a6",
  "Other": "#6b7280",
};

export function ExpenseCategoryChart({ instructorId }: ExpenseCategoryChartProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CategoryData[]>([]);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchExpensesByCategory();
  }, [instructorId, period]);

  const fetchExpensesByCategory = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (period === "month") {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      }

      const { data: expenses, error } = await supabase
        .from("instructor_expenses")
        .select("category, amount")
        .eq("instructor_id", instructorId)
        .gte("expense_date", format(startDate, "yyyy-MM-dd"))
        .lte("expense_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      // Group by category
      const categoryTotals: Record<string, number> = {};
      let totalAmount = 0;

      expenses?.forEach((expense) => {
        const category = expense.category || "Other";
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount);
        totalAmount += Number(expense.amount);
      });

      // Convert to chart data
      const chartData: CategoryData[] = Object.entries(categoryTotals)
        .map(([name, value]) => ({
          name,
          value,
          color: CATEGORY_COLORS[name] || "#6b7280",
        }))
        .sort((a, b) => b.value - a.value);

      setData(chartData);
      setTotal(totalAmount);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Expense Breakdown
          </CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as "month" | "year")}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No expenses recorded for this period
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                    <span className="text-muted-foreground text-xs">
                      ({((item.value / total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
