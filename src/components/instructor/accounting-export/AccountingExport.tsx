import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2, CheckCircle, ExternalLink, RefreshCw, Link2, Unlink, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Platform, platformConfigs } from "./platformConfigs";
import { useAccountingConnection, AccountingPlatform } from "@/hooks/useAccountingConnection";
import { AccountingSyncPanel } from "./AccountingSyncPanel";

interface AccountingExportProps {
  instructorId: string;
}

export function AccountingExport({ instructorId }: AccountingExportProps) {
  const [platform, setPlatform] = useState<Platform>("xero");
  const [exporting, setExporting] = useState(false);
  const [markingSynced, setMarkingSynced] = useState(false);

  const accounting = useAccountingConnection(instructorId);
  const config = platformConfigs[platform];

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
    [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

  const exportExpenses = async (period: "month" | "year") => {
    setExporting(true);
    try {
      const now = new Date();
      const startDate = period === "month" ? startOfMonth(now) : startOfYear(now);
      const endDate = period === "month" ? endOfMonth(now) : endOfYear(now);

      const { data: expenses, error } = await supabase
        .from("instructor_expenses")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("expense_date", format(startDate, "yyyy-MM-dd"))
        .lte("expense_date", format(endDate, "yyyy-MM-dd"))
        .order("expense_date");

      if (error) throw error;
      if (!expenses?.length) { toast.info("No expenses to export"); return; }

      const rows = expenses.map((exp) => {
        const code = config.getCategoryCode(exp.category);
        return config.formatExpenseRow(exp, code);
      });

      downloadCSV(
        buildCSV(config.expenseHeaders, rows),
        `${config.filePrefix}-expenses-${format(startDate, "yyyy-MM")}-${format(endDate, "yyyy-MM")}.csv`
      );
      toast.success(`Exported ${expenses.length} expenses for ${config.label}`);
    } catch {
      toast.error("Failed to export expenses");
    } finally {
      setExporting(false);
    }
  };

  const exportIncome = async () => {
    setExporting(true);
    try {
      const now = new Date();
      const startDate = startOfYear(now);
      const endDate = endOfYear(now);

      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, duration_minutes, amount_due, pupils(name)")
        .eq("instructor_id", instructorId)
        .eq("status", "completed")
        .gte("lesson_date", format(startDate, "yyyy-MM-dd"))
        .lte("lesson_date", format(endDate, "yyyy-MM-dd"))
        .order("lesson_date");

      if (error) throw error;
      if (!lessons?.length) { toast.info("No income to export"); return; }

      const { data: instructor } = await supabase
        .from("instructors")
        .select("hourly_rate")
        .eq("id", instructorId)
        .single();

      const hourlyRate = instructor?.hourly_rate || 40;

      const rows = lessons.map((lesson: any) => {
        const amount = lesson.amount_due || (lesson.duration_minutes / 60) * hourlyRate;
        return config.formatIncomeRow(lesson, amount);
      });

      downloadCSV(
        buildCSV(config.incomeHeaders, rows),
        `${config.filePrefix}-income-${format(now, "yyyy")}.csv`
      );
      toast.success(`Exported ${lessons.length} income records for ${config.label}`);
    } catch {
      toast.error("Failed to export income");
    } finally {
      setExporting(false);
    }
  };

  const markAllAsSynced = async () => {
    setMarkingSynced(true);
    try {
      const { error } = await supabase
        .from("instructor_expenses")
        .update({ xero_synced: true })
        .eq("instructor_id", instructorId)
        .eq("xero_synced", false);
      if (error) throw error;
      toast.success("All expenses marked as synced");
    } catch {
      toast.error("Failed to update sync status");
    } finally {
      setMarkingSynced(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Accounting Export & Sync
              </CardTitle>
              <CardDescription>CSV export or direct API sync with your accounting software</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="xero" className="relative">
                Xero
                {accounting.isConnected("xero") && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
              </TabsTrigger>
              <TabsTrigger value="quickbooks" className="relative">
                QuickBooks
                {accounting.isConnected("quickbooks") && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
              </TabsTrigger>
              <TabsTrigger value="freeagent" className="relative">
                FreeAgent
                {accounting.isConnected("freeagent") && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
              </TabsTrigger>
              <TabsTrigger value="sage" className="relative">
                Sage
                {accounting.isConnected("sage") && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
              </TabsTrigger>
            </TabsList>

            {(["xero", "quickbooks", "freeagent", "sage"] as Platform[]).map((p) => (
              <TabsContent key={p} value={p} className="space-y-3 mt-3">
                {/* Connection status & API sync */}
                <AccountingSyncPanel
                  platform={p as AccountingPlatform}
                  instructorId={instructorId}
                  accounting={accounting}
                />

                {/* CSV Export fallback */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Manual CSV Export
                  </p>
                  <div className="p-3 rounded-2xl border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Expenses</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => exportExpenses("month")} disabled={exporting}>
                          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" />This Month</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportExpenses("year")} disabled={exporting}>
                          This Year
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Income</span>
                      <Button size="sm" variant="outline" onClick={exportIncome} disabled={exporting}>
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" />This Year</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="pt-3 border-t">
            <Button variant="secondary" size="sm" onClick={markAllAsSynced} disabled={markingSynced} className="w-full gap-2">
              {markingSynced ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Mark All Expenses as Synced
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
