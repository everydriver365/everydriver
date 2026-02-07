import { useState } from "react";
import { FileText, Download, Loader2, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface PupilProgressReportGeneratorProps {
  instructorId: string;
  pupils: Array<{ id: string; name: string }>;
}

// 27 DVSA competency names
const COMPETENCY_NAMES: Record<string, string> = {
  "1": "Cockpit Checks", "2": "Safety Checks", "3": "Controls & Instruments",
  "4": "Moving Off Safely", "5": "Moving Off at an Angle", "6": "Moving Off Uphill",
  "7": "Moving Off Downhill", "8": "Stopping Normally", "9": "Stopping in an Emergency",
  "10": "Gear Changing", "11": "Steering", "12": "Road Positioning",
  "13": "Mirrors & Signals", "14": "Anticipation & Planning", "15": "Junctions",
  "16": "Roundabouts", "17": "Crossroads", "18": "Overtaking",
  "19": "Meeting Other Vehicles", "20": "Pedestrian Crossings", "21": "Dual Carriageways",
  "22": "Rural Roads", "23": "Manoeuvres: Bay Park", "24": "Manoeuvres: Parallel Park",
  "25": "Manoeuvres: Forward Bay Park", "26": "Manoeuvres: Pull Up on Right",
  "27": "Independent Driving",
};

const SKILL_LEVELS = ["Not Started", "Introduced", "Under Full Guidance", "Prompted", "Seldom Prompted", "Independent"];

export function PupilProgressReportGenerator({ instructorId, pupils }: PupilProgressReportGeneratorProps) {
  const [selectedPupil, setSelectedPupil] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    if (!selectedPupil) {
      toast.error("Please select a pupil");
      return;
    }

    setGenerating(true);
    try {
      // Fetch pupil details
      const { data: pupil } = await supabase
        .from("pupils")
        .select("name, email, lessons_completed, total_driving_minutes, progress, test_date, test_passed, parent_name, parent_email, created_at")
        .eq("id", selectedPupil)
        .single();

      if (!pupil) throw new Error("Pupil not found");

      // Fetch syllabus progress
      const { data: syllabusData } = await supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level")
        .eq("pupil_id", selectedPupil);

      // Fetch recent lesson history
      const { data: lessonHistory } = await supabase
        .from("lesson_history")
        .select("lesson_date, skills_practiced, notes, duration_minutes")
        .eq("pupil_id", selectedPupil)
        .order("lesson_date", { ascending: false })
        .limit(10);

      // Fetch instructor details
      const { data: instructor } = await supabase
        .from("instructors")
        .select("name, phone, email")
        .eq("id", instructorId)
        .single();

      // Build PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, pageWidth, 35, "F");
      doc.setFontSize(22);
      doc.setTextColor(255);
      doc.text("Pupil Progress Report", pageWidth / 2, 18, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generated ${format(new Date(), "d MMMM yyyy")}`, pageWidth / 2, 28, { align: "center" });

      // Pupil info
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text(pupil.name, 14, 48);
      
      doc.setFontSize(10);
      doc.setTextColor(80);
      let infoY = 56;
      doc.text(`Lessons completed: ${pupil.lessons_completed || 0}`, 14, infoY);
      const totalHours = Math.round((pupil.total_driving_minutes || 0) / 60 * 10) / 10;
      doc.text(`Total driving hours: ${totalHours}h`, 14, infoY + 6);
      doc.text(`Overall progress: ${pupil.progress || 0}%`, 14, infoY + 12);
      if (pupil.test_date) {
        doc.text(`Test date: ${format(new Date(pupil.test_date), "d MMM yyyy")}`, 14, infoY + 18);
      }
      doc.text(`Instructor: ${instructor?.name || "N/A"}`, pageWidth - 14, infoY, { align: "right" });
      doc.text(`Phone: ${instructor?.phone || "N/A"}`, pageWidth - 14, infoY + 6, { align: "right" });

      // Syllabus progress table
      const progressMap = new Map(syllabusData?.map(s => [s.competency_id, s.level]) || []);
      
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 95);
      doc.text("Syllabus Progress", 14, infoY + 32);

      const syllabusRows = Object.entries(COMPETENCY_NAMES).map(([id, name]) => {
        const level = progressMap.get(id) || 0;
        const levelName = SKILL_LEVELS[level] || "Not Started";
        const progressBar = "█".repeat(level) + "░".repeat(5 - level);
        return [id, name, progressBar, levelName];
      });

      autoTable(doc, {
        startY: infoY + 36,
        head: [["#", "Competency", "Level", "Status"]],
        body: syllabusRows,
        theme: "striped",
        headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 70 },
          2: { cellWidth: 30, font: "courier" },
          3: { cellWidth: 35 },
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Recent lessons
      if (lessonHistory && lessonHistory.length > 0) {
        const lastY = (doc as any).lastAutoTable?.finalY || 200;
        
        if (lastY > 240) doc.addPage();
        const lessonsStartY = lastY > 240 ? 20 : lastY + 12;

        doc.setFontSize(13);
        doc.setTextColor(30, 58, 95);
        doc.text("Recent Lessons", 14, lessonsStartY);

        const lessonRows = lessonHistory.map(l => [
          l.lesson_date ? format(new Date(l.lesson_date), "d MMM yyyy") : "-",
          `${l.duration_minutes || 60} min`,
          (l.skills_practiced || []).join(", ").slice(0, 60) || "-",
          (l.notes || "-").slice(0, 80),
        ]);

        autoTable(doc, {
          startY: lessonsStartY + 4,
          head: [["Date", "Duration", "Topics", "Notes"]],
          body: lessonRows,
          theme: "striped",
          headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 8, cellPadding: 2 },
          alternateRowStyles: { fillColor: [245, 247, 250] },
        });
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount} | Confidential - ${instructor?.name || "Instructor"}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      }

      // Save
      const fileName = `progress-report-${pupil.name.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      toast.success(`Report downloaded for ${pupil.name}`);
    } catch (err) {
      console.error("Error generating report:", err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Progress Reports
        </CardTitle>
        <CardDescription>Generate PDF reports to share with parents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedPupil} onValueChange={setSelectedPupil}>
          <SelectTrigger>
            <SelectValue placeholder="Select a pupil" />
          </SelectTrigger>
          <SelectContent>
            {pupils.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={generateReport}
          disabled={!selectedPupil || generating}
          className="w-full"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {generating ? "Generating..." : "Download PDF Report"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Includes syllabus progress, lesson history, hours completed, and instructor notes. Perfect for sharing with parents.
        </p>
      </CardContent>
    </Card>
  );
}
