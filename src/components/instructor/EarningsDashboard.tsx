import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, PiggyBank, ArrowUpRight, ArrowDownRight, Download, FileText, FileSpreadsheet, Clock, Layers } from "lucide-react";
import { AnimatedCounter, CurrencyCounter } from "@/components/ui/AnimatedCounter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EarningsPeriod {
  label: string;
  amount: number;
  lessonCount: number;
  change?: number;
}

interface DailyEarning {
  date: string;
  amount: number;
  lessons: number;
}

interface Expense {
  id: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount: number;
}

export function EarningsDashboard() {
  const { t } = useTranslation();
  const { instructor } = useInstructorAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showComparison, setShowComparison] = useState(false);
  const [earnings, setEarnings] = useState({
    today: { amount: 0, lessons: 0 },
    thisWeek: { amount: 0, lessons: 0, change: 0 },
    thisMonth: { amount: 0, lessons: 0, change: 0 },
    outstanding: 0,
    projectedMonth: 0,
    totalHours: 0,
  });
  const [chartData, setChartData] = useState<DailyEarning[]>([]);
  const [previousChartData, setPreviousChartData] = useState<DailyEarning[]>([]);
  const [topPupils, setTopPupils] = useState<{ name: string; total: number }[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  const exportToCSV = () => {
    if (allPayments.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Pupil", "Amount"];
    const rows = allPayments.map(p => [
      format(parseISO(p.recorded_at), "yyyy-MM-dd"),
      (p.pupils as any)?.name || "Unknown",
      p.amount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `earnings-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Earnings exported to CSV");
  };

  const exportToPDF = () => {
    if (allPayments.length === 0 && allExpenses.length === 0) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 95);
    doc.text("Financial Report", pageWidth / 2, 20, { align: "center" });
    
    // Subtitle with date range
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), "d MMMM yyyy")}`, pageWidth / 2, 28, { align: "center" });
    
    // Calculate totals
    const totalEarnings = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalEarnings - totalExpenses;
    
    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Financial Summary", 14, 42);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const summaryY = 50;
    doc.text(`This Month Earnings: £${earnings.thisMonth.amount.toFixed(2)}`, 14, summaryY);
    doc.text(`This Week Earnings: £${earnings.thisWeek.amount.toFixed(2)}`, 14, summaryY + 6);
    doc.text(`Outstanding: £${earnings.outstanding.toFixed(2)}`, 14, summaryY + 12);
    
    // Summary box on the right
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(pageWidth - 80, 42, 66, 30, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text("Total Earnings:", pageWidth - 76, 50);
    doc.text("Total Expenses:", pageWidth - 76, 58);
    doc.text("Net Profit:", pageWidth - 76, 66);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`£${totalEarnings.toFixed(2)}`, pageWidth - 18, 50, { align: "right" });
    doc.text(`£${totalExpenses.toFixed(2)}`, pageWidth - 18, 58, { align: "right" });
    doc.setTextColor(netProfit >= 0 ? 34 : 180, netProfit >= 0 ? 139 : 0, netProfit >= 0 ? 34 : 0);
    doc.text(`£${netProfit.toFixed(2)}`, pageWidth - 18, 66, { align: "right" });
    doc.setFont("helvetica", "normal");
    
    // Earnings table
    if (allPayments.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 95);
      doc.text("Earnings", 14, summaryY + 26);
      
      const earningsData = allPayments.map(p => [
        format(parseISO(p.recorded_at), "d MMM yyyy"),
        (p.pupils as any)?.name || "Unknown",
        `£${p.amount.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: summaryY + 30,
        head: [["Date", "Pupil", "Amount"]],
        body: earningsData,
        theme: "striped",
        headStyles: { 
          fillColor: [30, 58, 95],
          textColor: 255,
          fontStyle: "bold"
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });
    }
    
    // Expenses table
    if (allExpenses.length > 0) {
      const lastTableY = (doc as any).lastAutoTable?.finalY || summaryY + 30;
      
      doc.setFontSize(11);
      doc.setTextColor(180, 95, 30);
      doc.text("Expenses", 14, lastTableY + 12);
      
      const expensesData = allExpenses.map(e => [
        format(parseISO(e.expense_date), "d MMM yyyy"),
        e.category,
        e.description || "-",
        `£${e.amount.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: lastTableY + 16,
        head: [["Date", "Category", "Description", "Amount"]],
        body: expensesData,
        theme: "striped",
        headStyles: { 
          fillColor: [180, 95, 30],
          textColor: 255,
          fontStyle: "bold"
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [255, 248, 240]
        }
      });
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
    
    doc.save(`financial-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Financial report exported to PDF");
  };

  useEffect(() => {
    if (instructor?.id) {
      fetchEarningsData();
    }
  }, [instructor?.id, period]);

  const fetchEarningsData = async () => {
    if (!instructor?.id) return;
    setLoading(true);

    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const lastWeekStart = subDays(weekStart, 7);
      const lastWeekEnd = subDays(weekEnd, 7);
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = endOfMonth(subMonths(today, 1));

      // Fetch payment history
      const { data: payments } = await supabase
        .from("payment_history")
        .select("amount, recorded_at, pupil_id, pupils(name)")
        .eq("instructor_id", instructor.id)
        .gte("recorded_at", format(subMonths(today, 12), 'yyyy-MM-dd'));

      // Fetch outstanding balances
      const { data: pupils } = await supabase
        .from("pupils")
        .select("account_balance, name")
        .eq("instructor_id", instructor.id);

      // Fetch expenses
      const { data: expenses } = await supabase
        .from("instructor_expenses")
        .select("id, expense_date, category, description, amount")
        .eq("instructor_id", instructor.id)
        .gte("expense_date", format(subMonths(today, 12), 'yyyy-MM-dd'))
        .order("expense_date", { ascending: false });

      if (!payments) {
        setLoading(false);
        return;
      }

      // Store all payments and expenses for export
      setAllPayments(payments);
      setAllExpenses(expenses || []);

      // Calculate today's earnings
      const todayPayments = payments.filter(p => p.recorded_at.startsWith(todayStr));
      const todayAmount = todayPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate this week
      const weekPayments = payments.filter(p => {
        const date = parseISO(p.recorded_at);
        return date >= weekStart && date <= weekEnd;
      });
      const weekAmount = weekPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate last week for comparison
      const lastWeekPayments = payments.filter(p => {
        const date = parseISO(p.recorded_at);
        return date >= lastWeekStart && date <= lastWeekEnd;
      });
      const lastWeekAmount = lastWeekPayments.reduce((sum, p) => sum + p.amount, 0);
      const weekChange = lastWeekAmount > 0 ? ((weekAmount - lastWeekAmount) / lastWeekAmount) * 100 : 0;

      // Calculate this month
      const monthPayments = payments.filter(p => {
        const date = parseISO(p.recorded_at);
        return date >= monthStart && date <= monthEnd;
      });
      const monthAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate last month for comparison
      const lastMonthPayments = payments.filter(p => {
        const date = parseISO(p.recorded_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });
      const lastMonthAmount = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthChange = lastMonthAmount > 0 ? ((monthAmount - lastMonthAmount) / lastMonthAmount) * 100 : 0;

      // Calculate outstanding
      const totalOutstanding = (pupils || []).reduce((sum, p) => sum + (p.account_balance || 0), 0);

      // Project monthly earnings (average daily * days in month)
      const daysElapsed = today.getDate();
      const daysInMonth = endOfMonth(today).getDate();
      const projectedMonth = daysElapsed > 0 ? (monthAmount / daysElapsed) * daysInMonth : 0;

      // Generate chart data based on period
      let chartPoints: DailyEarning[] = [];
      
      if (period === 'week') {
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        chartPoints = days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayPayments = payments.filter(p => p.recorded_at.startsWith(dayStr));
          return {
            date: format(day, 'EEE'),
            amount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
            lessons: dayPayments.length
          };
        });
      } else if (period === 'month') {
        const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
        chartPoints = weeks.map((weekStart, idx) => {
          const weekEnd = subDays(weeks[idx + 1] || endOfMonth(today), 1);
          const weekPayments = payments.filter(p => {
            const date = parseISO(p.recorded_at);
            return date >= weekStart && date <= weekEnd;
          });
          return {
            date: `Week ${idx + 1}`,
            amount: weekPayments.reduce((sum, p) => sum + p.amount, 0),
            lessons: weekPayments.length
          };
        });
      } else {
        const months = eachMonthOfInterval({ start: subMonths(today, 11), end: today });
        chartPoints = months.map(month => {
          const mStart = startOfMonth(month);
          const mEnd = endOfMonth(month);
          const mPayments = payments.filter(p => {
            const date = parseISO(p.recorded_at);
            return date >= mStart && date <= mEnd;
          });
          return {
            date: format(month, 'MMM'),
            amount: mPayments.reduce((sum, p) => sum + p.amount, 0),
            lessons: mPayments.length
          };
        });
      }

      // Top paying pupils
      const pupilTotals = new Map<string, { name: string; total: number }>();
      payments.forEach(p => {
        const name = (p.pupils as any)?.name || 'Unknown';
        const existing = pupilTotals.get(p.pupil_id) || { name, total: 0 };
        pupilTotals.set(p.pupil_id, { name, total: existing.total + p.amount });
      });
      const sortedPupils = Array.from(pupilTotals.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setEarnings({
        today: { amount: todayAmount, lessons: todayPayments.length },
        thisWeek: { amount: weekAmount, lessons: weekPayments.length, change: weekChange },
        thisMonth: { amount: monthAmount, lessons: monthPayments.length, change: monthChange },
        outstanding: totalOutstanding,
        projectedMonth,
      });
      setChartData(chartPoints);
      setTopPupils(sortedPupils);

    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{t('time.today')}</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(earnings.today.amount)}</div>
            <div className="text-xs text-muted-foreground">{earnings.today.lessons} payments</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{t('instructor.thisWeek')}</div>
              {earnings.thisWeek.change !== 0 && (
                earnings.thisWeek.change > 0 ? 
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" /> :
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(earnings.thisWeek.amount)}</div>
            {earnings.thisWeek.change !== 0 && (
              <div className={`text-xs ${earnings.thisWeek.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {earnings.thisWeek.change > 0 ? '+' : ''}{earnings.thisWeek.change.toFixed(0)}% vs last week
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{t('instructor.thisMonth')}</div>
              {earnings.thisMonth.change !== 0 && (
                earnings.thisMonth.change > 0 ? 
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> :
                  <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(earnings.thisMonth.amount)}</div>
            {earnings.thisMonth.change !== 0 && (
              <div className={`text-xs ${earnings.thisMonth.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {earnings.thisMonth.change > 0 ? '+' : ''}{earnings.thisMonth.change.toFixed(0)}% vs last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{t('instructor.outstanding')}</div>
              <PiggyBank className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(earnings.outstanding)}</div>
            <div className="text-xs text-muted-foreground">Projected: {formatCurrency(earnings.projectedMonth)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">{t('instructor.earnings')} Trend</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 h-8">
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <TabsList className="h-8">
                  <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
                  <TabsTrigger value="year" className="text-xs px-3">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `£${value}`} />
                <Tooltip 
                  formatter={(value: number) => [`£${value.toFixed(2)}`, 'Earnings']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Pupils */}
      {topPupils.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Paying Pupils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPupils.map((pupil, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{pupil.name}</span>
                  </div>
                  <Badge variant="secondary">{formatCurrency(pupil.total)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}