import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, PoundSterling, BookOpen, XCircle, ClipboardCheck,
  Receipt, Target, Download, Loader2, ChevronDown, ChevronUp,
  Calendar, FileBarChart, Pencil, CloudUpload, Link2, Unlink, CheckCircle2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Platform, platformConfigs } from "@/components/instructor/accounting-export/platformConfigs";
import { useAccountingConnection, AccountingPlatform } from "@/hooks/useAccountingConnection";

interface MetricCard {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  icon: React.ElementType;
  color: string;
  note: string;
}

export default function MonthEndReview() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const authInstructorId = instructor?.id;
  const [monthOffset, setMonthOffset] = useState(0);
  const [platform, setPlatform] = useState<Platform>("xero");
  const [exporting, setExporting] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, { value: number; note: string }>>({});
  
  const {
    isConnected, getConnection, getLastSync, connect, disconnect, sync, isSyncing, isConnecting,
  } = useAccountingConnection(authInstructorId);

  const selectedMonth = useMemo(() => subMonths(new Date(), monthOffset), [monthOffset]);
  const monthStart = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
  const monthLabel = format(selectedMonth, "MMMM yyyy");

  const { data, isLoading } = useQuery({
    queryKey: ["month-end-review", authInstructorId, monthStart],
    queryFn: async () => {
      if (!authInstructorId) return null;

      const [lessonsRes, expensesRes, testsRes, paymentsRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("id, status, amount_due, duration_minutes")
          .eq("instructor_id", authInstructorId)
          .gte("lesson_date", monthStart)
          .lte("lesson_date", monthEnd),
        supabase
          .from("instructor_expenses")
          .select("id, amount, category")
          .eq("instructor_id", authInstructorId)
          .gte("expense_date", monthStart)
          .lte("expense_date", monthEnd),
        supabase
          .from("driving_test_results")
          .select("id, result")
          .eq("instructor_id", authInstructorId)
          .gte("test_date", monthStart)
          .lte("test_date", monthEnd),
        supabase
          .from("payment_history")
          .select("id, amount")
          .eq("instructor_id", authInstructorId)
          .gte("payment_date", monthStart)
          .lte("payment_date", monthEnd),
      ]);

      const lessons = lessonsRes.data || [];
      const expenses = expensesRes.data || [];
      const tests = testsRes.data || [];
      const payments = paymentsRes.data || [];

      const completed = lessons.filter(l => l.status === "completed");
      const cancelled = lessons.filter(l => l.status === "cancelled");
      const earnings = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);

      // Category breakdown for expenses
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach(e => {
        const cat = (e as any).category || "Other";
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.amount || 0);
      });

      return {
        earnings,
        lessonsCompleted: completed.length,
        lessonsCancelled: cancelled.length,
        testCount: tests.length,
        testsPassed: tests.filter(t => t.result === "pass").length,
        expenseTotal,
        expensesByCategory,
        dvsaTriggers: 0, // Placeholder - would come from standards check data
      };
    },
    enabled: !!authInstructorId,
  });

  const getAdjustedValue = (key: string, original: number) =>
    adjustments[key]?.value ?? original;

  const metrics: MetricCard[] = data ? [
    { key: "earnings", label: "Earnings", value: `£${getAdjustedValue("earnings", data.earnings).toFixed(2)}`, rawValue: data.earnings, icon: PoundSterling, color: "text-emerald-600", note: adjustments.earnings?.note || "" },
    { key: "lessonsCompleted", label: "Lessons Completed", value: String(getAdjustedValue("lessonsCompleted", data.lessonsCompleted)), rawValue: data.lessonsCompleted, icon: BookOpen, color: "text-blue-600", note: adjustments.lessonsCompleted?.note || "" },
    { key: "testCount", label: "Tests", value: `${getAdjustedValue("testCount", data.testCount)} (${data.testsPassed} passed)`, rawValue: data.testCount, icon: ClipboardCheck, color: "text-violet-600", note: adjustments.testCount?.note || "" },
    { key: "lessonsCancelled", label: "Cancelled", value: String(getAdjustedValue("lessonsCancelled", data.lessonsCancelled)), rawValue: data.lessonsCancelled, icon: XCircle, color: "text-red-500", note: adjustments.lessonsCancelled?.note || "" },
    { key: "expenseTotal", label: "Expenses", value: `£${getAdjustedValue("expenseTotal", data.expenseTotal).toFixed(2)}`, rawValue: data.expenseTotal, icon: Receipt, color: "text-orange-600", note: adjustments.expenseTotal?.note || "" },
    { key: "dvsaTriggers", label: "DVSA Triggers", value: String(getAdjustedValue("dvsaTriggers", data.dvsaTriggers)), rawValue: data.dvsaTriggers, icon: Target, color: "text-red-600", note: adjustments.dvsaTriggers?.note || "" },
  ] : [];

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildCSV = (headers: string[], rows: string[][]) =>
    [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");

  const handleExport = async () => {
    if (!authInstructorId || !data) return;
    setExporting(true);
    try {
      const config = platformConfigs[platform];

      // Export expenses
      const { data: expenses } = await supabase
        .from("instructor_expenses")
        .select("*")
        .eq("instructor_id", authInstructorId)
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd)
        .order("expense_date");

      if (expenses?.length) {
        const rows = expenses.map(exp => {
          const code = config.getCategoryCode(exp.category);
          return config.formatExpenseRow(exp, code);
        });
        downloadCSV(
          buildCSV(config.expenseHeaders, rows),
          `${config.filePrefix}-expenses-${format(selectedMonth, "yyyy-MM")}.csv`
        );
      }

      // Export income
      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, duration_minutes, amount_due, pupils(name)")
        .eq("instructor_id", authInstructorId)
        .eq("status", "completed")
        .gte("lesson_date", monthStart)
        .lte("lesson_date", monthEnd)
        .order("lesson_date");

      if (lessons?.length) {
        const { data: instructor } = await supabase
          .from("instructors")
          .select("hourly_rate")
          .eq("id", authInstructorId)
          .single();
        const hourlyRate = instructor?.hourly_rate || 40;

        const rows = lessons.map((lesson: any) => {
          const amount = lesson.amount_due || (lesson.duration_minutes / 60) * hourlyRate;
          return config.formatIncomeRow(lesson, amount);
        });
        downloadCSV(
          buildCSV(config.incomeHeaders, rows),
          `${config.filePrefix}-income-${format(selectedMonth, "yyyy-MM")}.csv`
        );
      }

      toast.success(`Exported month-end data for ${config.label}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Month End Review</h1>
            <p className="text-xs text-muted-foreground">Review & submit to accounting</p>
          </div>
          <FileBarChart className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto pb-32">
        {/* Month Picker */}
        <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
          <Button variant="ghost" size="sm" onClick={() => setMonthOffset(o => o + 1)}>
            <ChevronDown className="h-4 w-4 mr-1" /> Prev
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{monthLabel}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0}>
            Next <ChevronUp className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(metric => {
                const Icon = metric.icon;
                const isEditing = editingKey === metric.key;
                return (
                  <Card key={metric.key} className="relative overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`h-4 w-4 ${metric.color}`} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingKey(isEditing ? null : metric.key)}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                      <p className="text-lg font-bold text-foreground">{metric.value}</p>
                      <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                      {adjustments[metric.key]?.note && (
                        <Badge variant="secondary" className="text-[9px] mt-1">Adjusted</Badge>
                      )}

                      {isEditing && (
                        <div className="mt-2 space-y-1.5 border-t pt-2">
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            defaultValue={getAdjustedValue(metric.key, metric.rawValue)}
                            onChange={e => setAdjustments(prev => ({
                              ...prev,
                              [metric.key]: { ...prev[metric.key], value: Number(e.target.value), note: prev[metric.key]?.note || "" },
                            }))}
                          />
                          <Textarea
                            placeholder="Adjustment note..."
                            className="text-xs min-h-[40px]"
                            defaultValue={adjustments[metric.key]?.note || ""}
                            onChange={e => setAdjustments(prev => ({
                              ...prev,
                              [metric.key]: { ...prev[metric.key], value: prev[metric.key]?.value ?? metric.rawValue, note: e.target.value },
                            }))}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Expense Breakdown */}
            {data && Object.keys(data.expensesByCategory).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {Object.entries(data.expensesByCategory)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium">£{(amt as number).toFixed(2)}</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Net Summary */}
            {data && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Profit</span>
                    <span className="text-xl font-bold text-primary">
                      £{(getAdjustedValue("earnings", data.earnings) - getAdjustedValue("expenseTotal", data.expenseTotal)).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export / Sync Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CloudUpload className="h-4 w-4" />
                  Submit to Accounting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs value={platform} onValueChange={v => setPlatform(v as Platform)}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="xero" className="text-xs">Xero</TabsTrigger>
                    <TabsTrigger value="quickbooks" className="text-xs">QuickBooks</TabsTrigger>
                    <TabsTrigger value="freeagent" className="text-xs">FreeAgent</TabsTrigger>
                    <TabsTrigger value="sage" className="text-xs">Sage</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Connection Status */}
                {isConnected(platform as AccountingPlatform) ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <div>
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Connected{getConnection(platform as AccountingPlatform)?.company_name ? ` — ${getConnection(platform as AccountingPlatform)?.company_name}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => disconnect(platform as AccountingPlatform)}
                      >
                        <Unlink className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>

                    {/* Sync buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => sync({
                          platform: platform as AccountingPlatform,
                          syncType: "both",
                          periodStart: monthStart,
                          periodEnd: monthEnd,
                        })}
                        disabled={isSyncing}
                      >
                        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                        Sync to {platformConfigs[platform].label}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={exporting}>
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download CSV
                      </Button>
                    </div>

                    {/* Last sync info */}
                    {(() => {
                      const lastSync = getLastSync(platform as AccountingPlatform);
                      return lastSync ? (
                        <p className="text-[11px] text-muted-foreground text-center">
                          Last synced: {format(new Date(lastSync.synced_at), "dd MMM yyyy HH:mm")} — {lastSync.records_synced} records
                        </p>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      className="w-full gap-2"
                      onClick={() => connect(platform as AccountingPlatform)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                      Connect to {platformConfigs[platform].label}
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={handleExport} disabled={exporting}>
                      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download CSV Instead
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Connect your {platformConfigs[platform].label} account to sync expenses & income directly
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
