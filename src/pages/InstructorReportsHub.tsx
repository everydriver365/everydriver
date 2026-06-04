import { useState } from "react";
import { FileText, Download, Loader2, Calendar, TrendingUp, Car, Calculator, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, startOfWeek, endOfWeek } from "date-fns";

const REPORT_TYPES = [
  { key: "earnings", title: "Weekly Business Summary", description: "Lessons, earnings & pupil stats for the period", icon: TrendingUp, color: "bg-emerald-500" },
  { key: "earnings", title: "Monthly Earnings", description: "Full income breakdown by month", icon: Calendar, color: "bg-sky-500" },
  { key: "tax", title: "Tax Year Summary", description: "HMRC-format income/expense summary", icon: Calculator, color: "bg-purple-500" },
  { key: "progress", title: "Pupil Progress", description: "Progress report to share with parents", icon: Users, color: "bg-amber-500" },
  { key: "mileage", title: "Mileage Log", description: "Business miles & HMRC deductions", icon: Car, color: "bg-rose-500" },
];

export default function InstructorReportsHub() {
  const { instructor } = useInstructorAuth();
  const [generating, setGenerating] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const generateReport = async (reportType: string, title: string) => {
    if (!instructor?.id) return;
    setGenerating(title);
    try {
      const reportData: Record<string, any> = {
        title,
        period: `${format(new Date(startDate), "dd/MM/yy")} — ${format(new Date(endDate), "dd/MM/yy")}`,
      };

      if (reportType === "earnings") {
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes, amount_due, status, pupils(name)")
          .eq("instructor_id", instructor.id)
          .gte("lesson_date", startDate)
          .lte("lesson_date", endDate)
          .neq("status", "cancelled");

        const totalEarnings = (lessons || []).reduce((sum: number, l: any) => sum + (l.amount_due || 0), 0);
        const totalHours = (lessons || []).reduce((sum: number, l: any) => sum + (l.duration_minutes || 0), 0) / 60;

        reportData.summary = [
          { label: "Total Lessons", value: (lessons || []).length },
          { label: "Total Hours", value: totalHours.toFixed(1) },
          { label: "Total Earnings", value: totalEarnings.toFixed(2) },
        ];
        reportData.transactions = (lessons || []).map((l: any) => ({
          date: l.lesson_date,
          pupil: l.pupils?.name || "Unknown",
          type: "Lesson",
          amount: (l.amount_due || 0).toFixed(2),
        }));
      }

      if (reportType === "mileage") {
        const { data: logs } = await supabase
          .from("mileage_logs")
          .select("*")
          .eq("instructor_id", instructor.id)
          .gte("log_date", startDate)
          .lte("log_date", endDate);

        const totalKm = (logs || []).reduce((sum: number, l: any) => sum + (l.distance_km || 0), 0);
        const totalMiles = totalKm * 0.621371;
        const businessLogs = (logs || []).filter((l: any) => l.trip_type === "business");
        const businessMiles = businessLogs.reduce((sum: number, l: any) => sum + (l.distance_km || 0), 0) * 0.621371;

        reportData.total_distance = totalMiles.toFixed(1);
        reportData.business_miles = businessMiles.toFixed(1);
        reportData.personal_miles = (totalMiles - businessMiles).toFixed(1);
        reportData.tax_deduction = (businessMiles * 0.45).toFixed(2);
        reportData.entries = (logs || []).map((l: any) => ({
          date: l.log_date,
          purpose: l.purpose || "Journey",
          distance: (l.distance_km * 0.621371).toFixed(1),
          type: l.trip_type || "business",
        }));
      }

      if (reportType === "tax") {
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("amount_due")
          .eq("instructor_id", instructor.id)
          .gte("lesson_date", startDate)
          .lte("lesson_date", endDate)
          .eq("status", "completed");

        const { data: expenses } = await supabase
          .from("instructor_expenses")
          .select("amount, category")
          .eq("instructor_id", instructor.id)
          .gte("date", startDate)
          .lte("date", endDate);

        const income = (lessons || []).reduce((s: number, l: any) => s + (l.amount_due || 0), 0);
        const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);

        reportData.sections = [
          { title: "Income", items: [{ label: "Lesson Income", value: income.toFixed(2) }] },
          { title: "Expenses", items: [{ label: "Total Expenses", value: totalExpenses.toFixed(2) }] },
          { title: "Summary", items: [
            { label: "Gross Income", value: income.toFixed(2) },
            { label: "Total Expenses", value: totalExpenses.toFixed(2) },
            { label: "Net Profit", value: (income - totalExpenses).toFixed(2) },
          ]},
        ];
      }

      const { data: result, error } = await supabase.functions.invoke("generate-pdf", {
        body: { report_type: reportType, instructor_id: instructor.id, data: reportData },
      });

      if (error) throw error;

      // Download the PDF
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${result.pdf_base64}`;
      link.download = result.filename;
      link.click();

      // Save record
      await supabase.from("instructor_reports").insert({
        instructor_id: instructor.id,
        report_type: reportType,
        filename: result.filename,
        parameters: { startDate, endDate },
      } as any);

      toast.success("Report downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="text-xl font-bold">Reports Hub</h1>
          <p className="text-sm text-muted-foreground">Generate and download business reports</p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setStartDate(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")); setEndDate(format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")); }}>This Week</Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd")); setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd")); }}>This Month</Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { const lm = subMonths(new Date(), 1); setStartDate(format(startOfMonth(lm), "yyyy-MM-dd")); setEndDate(format(endOfMonth(lm), "yyyy-MM-dd")); }}>Last Month</Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setStartDate(format(startOfYear(new Date()), "yyyy-MM-dd")); setEndDate(format(endOfYear(new Date()), "yyyy-MM-dd")); }}>This Year</Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { const now = new Date(); const taxStart = now.getMonth() >= 3 ? new Date(now.getFullYear(), 3, 6) : new Date(now.getFullYear() - 1, 3, 6); const taxEnd = new Date(taxStart.getFullYear() + 1, 3, 5); setStartDate(format(taxStart, "yyyy-MM-dd")); setEndDate(format(taxEnd, "yyyy-MM-dd")); }}>Tax Year</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {REPORT_TYPES.map(report => (
            <Card key={report.title} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`${report.color} p-2.5 rounded-xl`}>
                  <report.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{report.title}</h3>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => generateReport(report.key, report.title)} disabled={generating === report.title}>
                  {generating === report.title ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
