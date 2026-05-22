import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, Loader2, Calendar } from "lucide-react";
import { format, startOfYear, endOfYear, parse } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateNI, calculateHmrcMileageDeduction } from "@/lib/ukTax";

interface TaxYearReportProps {
  instructorId: string;
  instructorName: string;
  taxCode: string;
  hourlyRate: number;
  vehicleMpg: number;
  fuelCostPerLitre: number;
}

// UK Tax bands 2025/26 (used only for the tax-code-driven personal-allowance
// flow below). Mileage allowance + NI maths come from src/lib/ukTax.ts.
const TAX_FREE_ALLOWANCE = 12570;
const BASIC_RATE_THRESHOLD = 50270;
const HIGHER_RATE_THRESHOLD = 125140;

export function TaxYearReport({
  instructorId,
  instructorName,
  taxCode,
  hourlyRate,
  vehicleMpg,
  fuelCostPerLitre,
}: TaxYearReportProps) {
  const [generating, setGenerating] = useState(false);
  const [taxYear, setTaxYear] = useState("2024-25");

  const getTaxYearDates = (year: string) => {
    const [startYear] = year.split("-").map(Number);
    // April 6 is always BST in the UK — anchor explicitly to avoid timezone drift.
    const startDate = new Date(`${startYear}-04-06T00:00:00+01:00`);
    const endDate = new Date(`${startYear + 1}-04-05T23:59:59+01:00`);
    return { startDate, endDate };
  };

  const calculateMileageAllowance = calculateHmrcMileageDeduction;

  /**
   * Income tax using the instructor's HMRC tax code (codeNumber × 10 = personal
   * allowance). This intentionally diverges from src/lib/ukTax.ts because the
   * standard PA taper does not apply when a user supplies a custom tax code.
   * NI is delegated to the shared library (Class 2 + Class 4).
   */
  const calculateTax = (taxableIncome: number) => {
    const codeNumber = parseInt(taxCode.replace(/[A-Z]/g, '')) || 1257;
    const personalAllowance = codeNumber * 10;

    let taxable = Math.max(0, taxableIncome - personalAllowance);
    let incomeTax = 0;

    // Basic rate (20%)
    const basicRateBand = Math.min(taxable, BASIC_RATE_THRESHOLD - TAX_FREE_ALLOWANCE);
    incomeTax += basicRateBand * 0.20;

    // Higher rate (40%)
    if (taxable > BASIC_RATE_THRESHOLD - TAX_FREE_ALLOWANCE) {
      const higherRateBand = Math.min(
        taxable - (BASIC_RATE_THRESHOLD - TAX_FREE_ALLOWANCE),
        HIGHER_RATE_THRESHOLD - BASIC_RATE_THRESHOLD
      );
      incomeTax += higherRateBand * 0.40;
    }

    // Additional rate (45%)
    if (taxable > HIGHER_RATE_THRESHOLD - TAX_FREE_ALLOWANCE) {
      incomeTax += (taxable - (HIGHER_RATE_THRESHOLD - TAX_FREE_ALLOWANCE)) * 0.45;
    }

    const ni = calculateNI(taxableIncome);
    return {
      incomeTax,
      nationalInsurance: ni.total,
      class2NI: ni.class2,
      class4NI: ni.class4,
      personalAllowance,
    };
  };


  const generateReport = async () => {
    setGenerating(true);
    try {
      const { startDate, endDate } = getTaxYearDates(taxYear);

      // Fetch lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .select("duration_minutes, lesson_date, lesson_miles, pickup_postcode")
        .eq("instructor_id", instructorId)
        .eq("status", "completed")
        .gte("lesson_date", format(startDate, "yyyy-MM-dd"))
        .lte("lesson_date", format(endDate, "yyyy-MM-dd"));

      if (lessonsError) throw lessonsError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("instructor_expenses")
        .select("category, amount, expense_date, description")
        .eq("instructor_id", instructorId)
        .gte("expense_date", format(startDate, "yyyy-MM-dd"))
        .lte("expense_date", format(endDate, "yyyy-MM-dd"))
        .order("expense_date");

      if (expensesError) throw expensesError;

      // Fetch mileage logs
      const { data: mileageLogs, error: mileageError } = await supabase
        .from("mileage_log")
        .select("start_odometer_km, end_odometer_km, date, purpose")
        .eq("instructor_id", instructorId)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"));

      if (mileageError) throw mileageError;

      // Calculate totals
      const totalHours = (lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0) / 60;
      const grossIncome = totalHours * hourlyRate;

      // Calculate mileage from lessons and logs
      const lessonMiles = lessons?.reduce((sum, l) => sum + (Number(l.lesson_miles) || 0), 0) || 0;
      const logMilesKm = mileageLogs?.reduce((sum, m) => 
        sum + ((m.end_odometer_km || 0) - (m.start_odometer_km || 0)), 0) || 0;
      const logMiles = logMilesKm * 0.621371;
      const totalMiles = lessonMiles + logMiles;
      const mileageAllowance = calculateMileageAllowance(totalMiles);

      // Group expenses by category
      const expensesByCategory: Record<string, number> = {};
      let totalExpenses = 0;
      expenses?.forEach((e) => {
        const category = e.category || "Other";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(e.amount);
        totalExpenses += Number(e.amount);
      });

      // Calculate taxable profit
      const totalDeductions = totalExpenses + mileageAllowance;
      const taxableProfit = grossIncome - totalDeductions;
      const { incomeTax, nationalInsurance, personalAllowance } = calculateTax(taxableProfit);

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Self-Assessment Tax Summary", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Tax Year: ${taxYear}`, pageWidth / 2, 28, { align: "center" });
      doc.text(`(${format(startDate, "d MMM yyyy")} - ${format(endDate, "d MMM yyyy")})`, pageWidth / 2, 34, { align: "center" });

      // Instructor details
      doc.setFontSize(10);
      doc.text(`Prepared for: ${instructorName}`, 14, 48);
      doc.text(`Tax Code: ${taxCode}`, 14, 54);
      doc.text(`Generated: ${format(new Date(), "d MMM yyyy HH:mm")}`, 14, 60);

      let yPos = 75;

      // Income Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Income Summary", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [["Description", "Amount"]],
        body: [
          ["Teaching Hours", `${totalHours.toFixed(1)} hours`],
          ["Hourly Rate", `£${hourlyRate.toFixed(2)}`],
          ["Gross Income", `£${grossIncome.toFixed(2)}`],
        ],
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Mileage Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Business Mileage", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [["Description", "Value"]],
        body: [
          ["Total Business Miles", `${totalMiles.toFixed(0)} miles`],
          ["HMRC Allowance (First 10,000 miles)", "45p per mile"],
          ["HMRC Allowance (Over 10,000 miles)", "25p per mile"],
          ["Mileage Allowance Claim", `£${mileageAllowance.toFixed(2)}`],
        ],
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Expenses by Category
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Expenses by Category", 14, yPos);
      yPos += 8;

      const expenseRows = Object.entries(expensesByCategory).map(([cat, amt]) => [
        cat,
        `£${amt.toFixed(2)}`,
      ]);
      expenseRows.push(["Total Expenses", `£${totalExpenses.toFixed(2)}`]);

      autoTable(doc, {
        startY: yPos,
        head: [["Category", "Amount"]],
        body: expenseRows,
        theme: "striped",
        headStyles: { fillColor: [239, 68, 68] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      // Tax Calculation
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Tax Calculation", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [["Description", "Amount"]],
        body: [
          ["Gross Income", `£${grossIncome.toFixed(2)}`],
          ["Less: Business Expenses", `-£${totalExpenses.toFixed(2)}`],
          ["Less: Mileage Allowance", `-£${mileageAllowance.toFixed(2)}`],
          ["Taxable Profit", `£${Math.max(0, taxableProfit).toFixed(2)}`],
          ["Personal Allowance", `£${personalAllowance.toFixed(2)}`],
          ["", ""],
          ["Estimated Income Tax", `£${incomeTax.toFixed(2)}`],
          ["Estimated NI (Class 2 + 4)", `£${nationalInsurance.toFixed(2)}`],
          ["Total Tax Liability", `£${(incomeTax + nationalInsurance).toFixed(2)}`],
        ],
        theme: "striped",
        headStyles: { fillColor: [139, 92, 246] },
        didParseCell: (data: any) => {
          if (data.row.index === 8) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Summary Box
      doc.setFillColor(240, 253, 244);
      doc.rect(14, yPos, pageWidth - 28, 35, "F");
      doc.setDrawColor(34, 197, 94);
      doc.rect(14, yPos, pageWidth - 28, 35, "S");

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Net Profit After Tax", 20, yPos + 12);
      doc.setFontSize(18);
      doc.text(`£${(taxableProfit - incomeTax - nationalInsurance).toFixed(2)}`, 20, yPos + 26);

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(
        "This report is for guidance only. Please consult a qualified accountant for official tax advice.",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );

      // Save PDF
      doc.save(`tax-report-${taxYear}-${format(new Date(), "yyyyMMdd")}.pdf`);
      toast.success("Tax year report downloaded");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const taxYears = [
    `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
    `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
    `${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Tax Year Report
        </CardTitle>
        <CardDescription>
          Generate a PDF summary for self-assessment filing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Tax Year:</span>
          </div>
          <Select value={taxYear} onValueChange={setTaxYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taxYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 rounded-2xl bg-muted/50 text-sm text-muted-foreground">
          <p>This report includes:</p>
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            <li>Income summary from teaching hours</li>
            <li>Business mileage with HMRC allowances</li>
            <li>Expense breakdown by category</li>
            <li>Estimated tax calculation</li>
          </ul>
        </div>

        <Button onClick={generateReport} disabled={generating} className="w-full">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Tax Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
