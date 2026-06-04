import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  category?: string;
}

interface MonthlyTotals {
  income: number;
  expenses: number;
  net: number;
}

export default function InstructorInOut() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<MonthlyTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorId) {
      fetchData();
    }
  }, [instructorId, selectedMonth]);

  const fetchData = async () => {
    if (!instructorId) return;
    
    setLoading(true);
    try {
      const monthStart = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

      // Fetch income (payments)
      const { data: payments, error: paymentsError } = await supabase
        .from("payment_history")
        .select(`
          id,
          amount,
          recorded_at,
          payment_method,
          pupils (name)
        `)
        .eq("instructor_id", instructorId)
        .gte("recorded_at", `${monthStart}T00:00:00`)
        .lte("recorded_at", `${monthEnd}T23:59:59`);

      if (paymentsError) throw paymentsError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("instructor_expenses")
        .select("id, amount, expense_date, category, description")
        .eq("instructor_id", instructorId)
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd);

      if (expensesError) throw expensesError;

      // Combine and sort transactions
      const allTransactions: Transaction[] = [
        ...(payments || []).map((p: any) => ({
          id: p.id,
          type: "income" as const,
          amount: Number(p.amount),
          date: p.recorded_at,
          description: p.pupils?.name || "Payment received",
        })),
        ...(expenses || []).map((e: any) => ({
          id: e.id,
          type: "expense" as const,
          amount: Number(e.amount),
          date: `${e.expense_date}T12:00:00`,
          description: e.description || e.category,
          category: e.category,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalIncome = (payments || []).reduce((sum, p: any) => sum + Number(p.amount), 0);
      const totalExpenses = (expenses || []).reduce((sum, e: any) => sum + Number(e.amount), 0);

      setTransactions(allTransactions);
      setTotals({
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedMonth(prev => 
      direction === "prev" ? subMonths(prev, 1) : subMonths(prev, -1)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h1 className="text-xl font-bold">In & Out</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Income vs expenses overview</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(selectedMonth, "MMMM yyyy")}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigateMonth("next")}
            disabled={format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Net Profit/Loss Card */}
            <Card className={`${
              (totals?.net || 0) >= 0 
                ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30"
                : "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-3xl font-bold ${
                      (totals?.net || 0) >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {formatCurrency(totals?.net || 0)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    (totals?.net || 0) >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}>
                    {(totals?.net || 0) > 0 ? (
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    ) : (totals?.net || 0) < 0 ? (
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    ) : (
                      <Minus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-emerald-500/5 to-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Income</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(totals?.income || 0)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownLeft className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">Expenses</span>
                  </div>
                  <p className="text-xl font-bold text-red-500">
                    {formatCurrency(totals?.expenses || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Transaction List */}
        <div className="space-y-3">
          <h2 className="font-semibold">All Transactions</h2>
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
                  <ArrowDownLeft className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No transactions this month</p>
              </CardContent>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      transaction.type === "income" 
                        ? "bg-emerald-500/10" 
                        : "bg-red-500/10"
                    }`}>
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(transaction.date), "dd/MM/yy")}
                        {transaction.category && ` • ${transaction.category}`}
                      </p>
                    </div>
                    <p className={`font-semibold shrink-0 ${
                      transaction.type === "income" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
