import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface XeroExportProps {
  instructorId: string;
}

export function XeroExport({ instructorId }: XeroExportProps) {
  const [exporting, setExporting] = useState(false);
  const [markingSynced, setMarkingSynced] = useState(false);

  const exportToCSV = async (period: "month" | "year") => {
    setExporting(true);
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

      // Fetch expenses
      const { data: expenses, error } = await supabase
        .from("instructor_expenses")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("expense_date", format(startDate, "yyyy-MM-dd"))
        .lte("expense_date", format(endDate, "yyyy-MM-dd"))
        .order("expense_date");

      if (error) throw error;

      if (!expenses || expenses.length === 0) {
        toast.info("No expenses to export for this period");
        return;
      }

      // Create CSV content - Xero compatible format
      const headers = [
        "*Date",
        "*Amount",
        "Description",
        "Reference",
        "Account Code",
        "Tax Rate",
      ];

      const getCategoryAccountCode = (category: string): string => {
        const codes: Record<string, string> = {
          "Fuel": "429",
          "Vehicle Maintenance": "455",
          "Insurance": "463",
          "Training Materials": "400",
          "Office Supplies": "453",
          "Marketing": "449",
          "Tolls & Parking": "429",
          "Other": "499",
        };
        return codes[category] || "499";
      };

      const rows = expenses.map((expense) => [
        format(new Date(expense.expense_date), "dd/MM/yyyy"),
        expense.amount.toFixed(2),
        expense.description || expense.category,
        expense.id.slice(0, 8),
        getCategoryAccountCode(expense.category),
        "20% (VAT on Expenses)",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(",")
        ),
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `xero-expenses-${format(startDate, "yyyy-MM")}-${format(endDate, "yyyy-MM")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${expenses.length} expenses to CSV`);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export expenses");
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
    } catch (error) {
      console.error("Error marking synced:", error);
      toast.error("Failed to update sync status");
    } finally {
      setMarkingSynced(false);
    }
  };

  const exportIncomeCSV = async () => {
    setExporting(true);
    try {
      const now = new Date();
      const startDate = startOfYear(now);
      const endDate = endOfYear(now);

      // Fetch completed lessons with pupil info
      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          lesson_date,
          duration_minutes,
          amount_due,
          pupils(name)
        `)
        .eq("instructor_id", instructorId)
        .eq("status", "completed")
        .gte("lesson_date", format(startDate, "yyyy-MM-dd"))
        .lte("lesson_date", format(endDate, "yyyy-MM-dd"))
        .order("lesson_date");

      if (error) throw error;

      if (!lessons || lessons.length === 0) {
        toast.info("No income to export");
        return;
      }

      // Get instructor hourly rate
      const { data: instructor } = await supabase
        .from("instructors")
        .select("hourly_rate")
        .eq("id", instructorId)
        .single();

      const hourlyRate = instructor?.hourly_rate || 40;

      const headers = [
        "*Date",
        "*Amount",
        "Description",
        "Reference",
        "Account Code",
        "Tax Rate",
      ];

      const rows = lessons.map((lesson: any) => {
        const hours = lesson.duration_minutes / 60;
        const amount = lesson.amount_due || hours * hourlyRate;
        return [
          format(new Date(lesson.lesson_date), "dd/MM/yyyy"),
          amount.toFixed(2),
          `Driving Lesson - ${lesson.pupils?.name || "Student"}`,
          lesson.id.slice(0, 8),
          "200", // Sales account code
          "No VAT",
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `xero-income-${format(now, "yyyy")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${lessons.length} income records to CSV`);
    } catch (error) {
      console.error("Error exporting income:", error);
      toast.error("Failed to export income");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Xero Export
            </CardTitle>
            <CardDescription>
              Export data in Xero-compatible CSV format
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <ExternalLink className="h-3 w-3" />
            Manual Import
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 rounded-none border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Expenses</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportToCSV("month")}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      This Month
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportToCSV("year")}
                  disabled={exporting}
                >
                  This Year
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Export expenses with Xero account codes
            </p>
          </div>

          <div className="p-3 rounded-none border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Income</span>
              <Button
                size="sm"
                variant="outline"
                onClick={exportIncomeCSV}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    This Year
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Export lesson income as sales invoices
            </p>
          </div>
        </div>

        <div className="pt-3 border-t">
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsSynced}
            disabled={markingSynced}
            className="w-full gap-2"
          >
            {markingSynced ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Mark All Expenses as Synced
          </Button>
        </div>

        <div className="p-3 rounded-none bg-muted/50 text-xs text-muted-foreground">
          <p className="font-medium mb-1">How to import into Xero:</p>
          <ol className="list-decimal ml-4 space-y-0.5">
            <li>Download the CSV file</li>
            <li>Go to Xero → Accounting → Bank Accounts</li>
            <li>Select your account → Import a statement</li>
            <li>Upload the CSV file</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
