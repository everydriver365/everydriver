import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Package, Loader2, Check, Users, BookOpen, CalendarDays, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DataExportManagerProps {
  instructorId: string;
  instructorName?: string | null;
}

interface ExportStatus {
  pupils: "idle" | "loading" | "done";
  lessons: "idle" | "loading" | "done";
  schedule: "idle" | "loading" | "done";
  financial: "idle" | "loading" | "done";
  fullBackup: "idle" | "loading" | "done";
}

export function DataExportManager({ instructorId, instructorName }: DataExportManagerProps) {
  const [status, setStatus] = useState<ExportStatus>({
    pupils: "idle",
    lessons: "idle",
    schedule: "idle",
    financial: "idle",
    fullBackup: "idle",
  });

  const setExportStatus = (key: keyof ExportStatus, value: "idle" | "loading" | "done") => {
    setStatus(prev => ({ ...prev, [key]: value }));
    if (value === "done") {
      setTimeout(() => setStatus(prev => ({ ...prev, [key]: "idle" })), 2000);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: Record<string, unknown>[], headers: string[]): string => {
    if (data.length === 0) return headers.join(",") + "\n";
    
    const csvRows = [headers.join(",")];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(","));
    });
    
    return csvRows.join("\n");
  };

  const exportPupils = async () => {
    setExportStatus("pupils", "loading");
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("name");

      if (error) throw error;

      const headers = ["name", "email", "phone", "pickup_address", "test_date", "test_centre", "lessons_completed", "prepaid_hours", "outstanding_balance", "created_at"];
      const csv = convertToCSV(data || [], headers);
      
      const date = new Date().toISOString().split("T")[0];
      downloadFile(csv, `pupils-export-${date}.csv`, "text/csv");
      
      setExportStatus("pupils", "done");
      toast({ title: "Pupils exported", description: `${data?.length || 0} pupils exported to CSV` });
    } catch (error) {
      console.error("Error exporting pupils:", error);
      setExportStatus("pupils", "idle");
      toast({ title: "Export failed", description: "Could not export pupils", variant: "destructive" });
    }
  };

  const exportLessons = async () => {
    setExportStatus("lessons", "loading");
    try {
      const { data, error } = await supabase
        .from("lesson_history")
        .select(`
          *,
          pupil:pupils(name)
        `)
        .eq("instructor_id", instructorId)
        .order("lesson_date", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(lesson => ({
        pupil_name: lesson.pupil?.name || "Unknown",
        lesson_date: lesson.lesson_date,
        start_time: lesson.start_time,
        duration_minutes: lesson.duration_minutes,
        skills_practiced: Array.isArray(lesson.skills_practiced) ? lesson.skills_practiced.join("; ") : "",
        notes: lesson.notes || "",
        rating: lesson.rating || "",
      }));

      const headers = ["pupil_name", "lesson_date", "start_time", "duration_minutes", "skills_practiced", "notes", "rating"];
      const csv = convertToCSV(formattedData, headers);
      
      const date = new Date().toISOString().split("T")[0];
      downloadFile(csv, `lesson-history-${date}.csv`, "text/csv");
      
      setExportStatus("lessons", "done");
      toast({ title: "Lessons exported", description: `${data?.length || 0} lessons exported to CSV` });
    } catch (error) {
      console.error("Error exporting lessons:", error);
      setExportStatus("lessons", "idle");
      toast({ title: "Export failed", description: "Could not export lessons", variant: "destructive" });
    }
  };

  const exportSchedule = async () => {
    setExportStatus("schedule", "loading");
    try {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          *,
          pupil:pupils(name, phone)
        `)
        .eq("instructor_id", instructorId)
        .order("lesson_date", { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map(lesson => ({
        pupil_name: lesson.pupil?.name || "Unknown",
        pupil_phone: lesson.pupil?.phone || "",
        lesson_date: lesson.lesson_date,
        start_time: lesson.start_time,
        duration_minutes: lesson.duration_minutes,
        pickup_location: lesson.pickup_location || "",
        lesson_type: lesson.lesson_type || "",
        status: lesson.status || "scheduled",
        payment_status: lesson.payment_status || "",
      }));

      const headers = ["pupil_name", "pupil_phone", "lesson_date", "start_time", "duration_minutes", "pickup_location", "lesson_type", "status", "payment_status"];
      const csv = convertToCSV(formattedData, headers);
      
      const date = new Date().toISOString().split("T")[0];
      downloadFile(csv, `schedule-${date}.csv`, "text/csv");
      
      setExportStatus("schedule", "done");
      toast({ title: "Schedule exported", description: `${data?.length || 0} scheduled lessons exported to CSV` });
    } catch (error) {
      console.error("Error exporting schedule:", error);
      setExportStatus("schedule", "idle");
      toast({ title: "Export failed", description: "Could not export schedule", variant: "destructive" });
    }
  };

  const exportFinancialReport = async () => {
    setExportStatus("financial", "loading");
    try {
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from("payment_history")
        .select(`
          *,
          pupil:pupils(name)
        `)
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch expenses from instructor_expenses table
      const { data: expensesData, error: expensesError } = await supabase
        .from("instructor_expenses")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("expense_date", { ascending: false });

      if (expensesError) throw expensesError;

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.text("Financial Report", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(instructorName || "Instructor", pageWidth / 2, 30, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}`, pageWidth / 2, 38, { align: "center" });

      // Summary
      const totalEarnings = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalExpenses = (expensesData || []).reduce((sum, e) => sum + (e.amount || 0), 0);
      const netIncome = totalEarnings - totalExpenses;

      doc.setFontSize(14);
      doc.text("Summary", 14, 55);
      
      autoTable(doc, {
        startY: 60,
        head: [["Category", "Amount"]],
        body: [
          ["Total Earnings", `£${totalEarnings.toFixed(2)}`],
          ["Total Expenses", `£${totalExpenses.toFixed(2)}`],
          ["Net Income", `£${netIncome.toFixed(2)}`],
        ],
        theme: "striped",
      });

      // Payments table
      const paymentsY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
      doc.setFontSize(14);
      doc.text("Payment History", 14, paymentsY + 15);

      if (payments && payments.length > 0) {
        autoTable(doc, {
          startY: paymentsY + 20,
          head: [["Date", "Pupil", "Amount", "Method"]],
          body: payments.slice(0, 50).map(p => [
            new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }),
            p.pupil?.name || "Unknown",
            `£${(p.amount || 0).toFixed(2)}`,
            p.payment_method || "-",
          ]),
          theme: "striped",
        });
      }

      // Expenses table
      const expensesY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
      
      if (expensesY > 250) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Expenses", 14, 20);
        
        if (expensesData && expensesData.length > 0) {
          autoTable(doc, {
            startY: 25,
            head: [["Date", "Category", "Description", "Amount"]],
            body: expensesData.slice(0, 50).map(e => [
              new Date(e.expense_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }),
              e.category || "-",
              e.description || "-",
              `£${(e.amount || 0).toFixed(2)}`,
            ]),
            theme: "striped",
          });
        }
      } else {
        doc.setFontSize(14);
        doc.text("Expenses", 14, expensesY + 15);
        
        if (expensesData && expensesData.length > 0) {
          autoTable(doc, {
            startY: expensesY + 20,
            head: [["Date", "Category", "Description", "Amount"]],
            body: expensesData.slice(0, 50).map(e => [
              new Date(e.expense_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }),
              e.category || "-",
              e.description || "-",
              `£${(e.amount || 0).toFixed(2)}`,
            ]),
            theme: "striped",
          });
        }
      }

      const date = new Date().toISOString().split("T")[0];
      doc.save(`financial-report-${date}.pdf`);
      
      setExportStatus("financial", "done");
      toast({ title: "Report generated", description: "Financial report downloaded as PDF" });
    } catch (error) {
      console.error("Error generating financial report:", error);
      setExportStatus("financial", "idle");
      toast({ title: "Export failed", description: "Could not generate financial report", variant: "destructive" });
    }
  };

  const exportFullBackup = async () => {
    setExportStatus("fullBackup", "loading");
    try {
      const zip = new JSZip();
      
      // Fetch all data separately to avoid type issues
      const { data: pupilsData } = await supabase
        .from("pupils")
        .select("*")
        .eq("instructor_id", instructorId);
      
      const { data: lessonsData } = await supabase
        .from("lesson_history")
        .select("*, pupil:pupils(name)")
        .eq("instructor_id", instructorId);
      
      const { data: scheduleData } = await supabase
        .from("scheduled_lessons")
        .select("*, pupil:pupils(name, phone)")
        .eq("instructor_id", instructorId);
      
      const { data: paymentsData } = await supabase
        .from("payment_history")
        .select("*, pupil:pupils(name)")
        .eq("instructor_id", instructorId);
      
      const { data: expensesData } = await supabase
        .from("instructor_expenses")
        .select("*")
        .eq("instructor_id", instructorId);

      // Create manifest
      const manifest = {
        exportDate: new Date().toISOString(),
        instructorId,
        instructorName: instructorName || "Unknown",
        recordCounts: {
          pupils: pupilsData?.length || 0,
          lessons: lessonsData?.length || 0,
          scheduledLessons: scheduleData?.length || 0,
          payments: paymentsData?.length || 0,
          expenses: expensesData?.length || 0,
        },
      };

      // Add files to ZIP
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("pupils.json", JSON.stringify(pupilsData || [], null, 2));
      zip.file("lesson-history.json", JSON.stringify(lessonsData || [], null, 2));
      zip.file("scheduled-lessons.json", JSON.stringify(scheduleData || [], null, 2));
      zip.file("payments.json", JSON.stringify(paymentsData || [], null, 2));
      zip.file("expenses.json", JSON.stringify(expensesData || [], null, 2));

      // Also add CSV versions
      const pupilHeaders = ["name", "email", "phone", "pickup_address", "test_date", "test_centre", "lessons_completed", "prepaid_hours", "outstanding_balance"];
      zip.file("pupils.csv", convertToCSV(pupilsData || [], pupilHeaders));

      // Generate ZIP
      const content = await zip.generateAsync({ type: "blob" });
      
      // Download
      const date = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instructor-backup-${date}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus("fullBackup", "done");
      toast({ 
        title: "Full backup complete", 
        description: `Exported ${manifest.recordCounts.pupils} pupils, ${manifest.recordCounts.lessons} lessons, and more` 
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      setExportStatus("fullBackup", "idle");
      toast({ title: "Backup failed", description: "Could not create full backup", variant: "destructive" });
    }
  };

  const getButtonContent = (statusKey: keyof ExportStatus, icon: React.ReactNode, label: string) => {
    if (status[statusKey] === "loading") {
      return <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>;
    }
    if (status[statusKey] === "done") {
      return <><Check className="h-4 w-4" /> Done</>;
    }
    return <>{icon} {label}</>;
  };

  return (
    <div className="space-y-6">
      {/* Individual Exports */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Individual Data
          </CardTitle>
          <CardDescription>Download specific data as CSV or PDF files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pupils List</p>
                <p className="text-xs text-muted-foreground">Names, contacts, progress</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportPupils}
              disabled={status.pupils === "loading"}
            >
              {getButtonContent("pupils", <Download className="h-4 w-4" />, "CSV")}
            </Button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Lesson History</p>
                <p className="text-xs text-muted-foreground">Past lessons with notes</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportLessons}
              disabled={status.lessons === "loading"}
            >
              {getButtonContent("lessons", <Download className="h-4 w-4" />, "CSV")}
            </Button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Scheduled Lessons</p>
                <p className="text-xs text-muted-foreground">All bookings & statuses</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportSchedule}
              disabled={status.schedule === "loading"}
            >
              {getButtonContent("schedule", <Download className="h-4 w-4" />, "CSV")}
            </Button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Financial Report</p>
                <p className="text-xs text-muted-foreground">Earnings & expenses summary</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportFinancialReport}
              disabled={status.financial === "loading"}
            >
              {getButtonContent("financial", <FileText className="h-4 w-4" />, "PDF")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Backup */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Full Account Backup
          </CardTitle>
          <CardDescription>
            Download all your data in one ZIP file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Includes: Pupils, Lesson History, Schedule, Payments, Expenses
          </p>
          <Button 
            onClick={exportFullBackup}
            disabled={status.fullBackup === "loading"}
            className="w-full"
          >
            {status.fullBackup === "loading" ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating Backup...</>
            ) : status.fullBackup === "done" ? (
              <><Check className="h-4 w-4 mr-2" /> Backup Complete</>
            ) : (
              <><Package className="h-4 w-4 mr-2" /> Download Full Backup</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
