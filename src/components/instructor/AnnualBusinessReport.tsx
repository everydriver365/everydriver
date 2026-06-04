import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, TrendingUp, TrendingDown, Users, Car, Award } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AnnualBusinessReportProps {
  instructorId: string;
}

function getTaxYears() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years: { label: string; startDate: string; endDate: string }[] = [];

  for (let i = 0; i < 4; i++) {
    const startYear = currentMonth >= 3 ? currentYear - i : currentYear - i - 1;
    years.push({
      label: `${startYear}/${startYear + 1}`,
      startDate: `${startYear}-04-06`,
      endDate: `${startYear + 1}-04-05`,
    });
  }
  return years;
}

export function AnnualBusinessReport({ instructorId }: AnnualBusinessReportProps) {
  const taxYears = getTaxYears();
  const [selectedYear, setSelectedYear] = useState(taxYears[0].label);

  const period = taxYears.find((y) => y.label === selectedYear) || taxYears[0];

  const { data: income } = useQuery({
    queryKey: ["annual-income", instructorId, period.startDate, period.endDate],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .eq("status", "completed")
        .gte("payment_date", period.startDate)
        .lte("payment_date", period.endDate);

      return ((data || []) as any[]).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["annual-expenses", instructorId, period.startDate, period.endDate],
    queryFn: async () => {
      const query = supabase
        .from("instructor_expenses")
        .select("amount")
        .eq("instructor_id", instructorId);
      
      const { data } = await query
        .gte("expense_date", period.startDate)
        .lte("expense_date", period.endDate);

      return ((data as any[]) || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    },
  });

  const { data: mileage } = useQuery({
    queryKey: ["annual-mileage", instructorId, period.startDate, period.endDate],
    queryFn: async () => {
      const query = supabase
        .from("mileage_logs")
        .select("distance_km")
        .eq("instructor_id", instructorId);
      
      const { data } = await query
        .gte("log_date", period.startDate)
        .lte("log_date", period.endDate);

      const totalKm = ((data as any[]) || []).reduce((sum: number, m: any) => sum + (m.distance_km || 0), 0);
      const totalMiles = totalKm * 0.621371;
      const allowance = totalMiles <= 10000
        ? totalMiles * 0.45
        : 10000 * 0.45 + (totalMiles - 10000) * 0.25;
      return { totalMiles: Math.round(totalMiles), allowance: Math.round(allowance * 100) / 100 };
    },
  });

  const { data: testResults } = useQuery({
    queryKey: ["annual-tests", instructorId, period.startDate, period.endDate],
    queryFn: async () => {
      const query = supabase
        .from("driving_test_results")
        .select("result")
        .eq("instructor_id", instructorId)
        .eq("is_mock", false);
      
      const { data } = await query
        .gte("test_date", period.startDate)
        .lte("test_date", period.endDate);

      const results = (data as any[]) || [];
      const total = results.length;
      const passed = results.filter((t: any) => t.result === "pass").length;
      return { total, passed, rate: total > 0 ? Math.round((passed / total) * 100) : 0 };
    },
  });

  const { data: pupilCount } = useQuery({
    queryKey: ["annual-pupils", instructorId, period.startDate, period.endDate],
    queryFn: async () => {
      const { count } = await supabase
        .from("pupils")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("created_at", period.startDate)
        .lte("created_at", period.endDate);

      return count || 0;
    },
  });

  const totalIncome = income || 0;
  const totalExpenses = expenses || 0;
  const netProfit = totalIncome - totalExpenses;

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Annual Business Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Tax Year: ${selectedYear}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}`, 14, 40);

    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: [
        ["Total Income", `£${totalIncome.toLocaleString()}`],
        ["Total Expenses", `£${totalExpenses.toLocaleString()}`],
        ["Net Profit", `£${netProfit.toLocaleString()}`],
        ["Total Mileage", `${mileage?.totalMiles.toLocaleString() || 0} miles`],
        ["HMRC Mileage Allowance", `£${mileage?.allowance.toLocaleString() || 0}`],
        ["Tests Taken", String(testResults?.total || 0)],
        ["Pass Rate", `${testResults?.rate || 0}%`],
        ["New Pupils", String(pupilCount || 0)],
      ],
    });

    doc.save(`business-report-${selectedYear.replace("/", "-")}.pdf`);
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Annual Business Report
        </h3>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {taxYears.map((y) => (
              <SelectItem key={y.label} value={y.label}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Income</span>
            </div>
            <p className="text-xl font-bold text-foreground">£{totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Expenses</span>
            </div>
            <p className="text-xl font-bold text-foreground">£{totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Mileage</span>
            </div>
            <p className="text-xl font-bold text-foreground">{(mileage?.totalMiles || 0).toLocaleString()} mi</p>
            <p className="text-xs text-muted-foreground">£{mileage?.allowance || 0} allowance</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pass Rate</span>
            </div>
            <p className="text-xl font-bold text-foreground">{testResults?.rate || 0}%</p>
            <p className="text-xs text-muted-foreground">{testResults?.passed || 0}/{testResults?.total || 0} passed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-2xl font-bold text-foreground">£{netProfit.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">New Pupils</p>
              <p className="text-2xl font-bold text-foreground">{pupilCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={generatePDF} className="w-full gap-2">
        <Download className="h-4 w-4" /> Download PDF Report
      </Button>
    </div>
  );
}
