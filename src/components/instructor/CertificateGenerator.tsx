import { useState } from "react";
import { Award, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";

const MILESTONES = [
  { value: "first_lesson", label: "First Lesson Complete", heading: "First Lesson Certificate" },
  { value: "10_lessons", label: "10 Lessons Complete", heading: "10 Lessons Achievement" },
  { value: "20_lessons", label: "20 Lessons Complete", heading: "20 Lessons Achievement" },
  { value: "theory_pass", label: "Theory Test Passed", heading: "Theory Test Pass Certificate" },
  { value: "test_pass", label: "Driving Test Passed!", heading: "Congratulations — You Passed!" },
];

interface CertificateGeneratorProps {
  pupilName: string;
  pupilId: string;
  instructorName: string;
  instructorId: string;
  brandColour?: string;
}

export function CertificateGenerator({ pupilName, pupilId, instructorName, instructorId, brandColour }: CertificateGeneratorProps) {
  const [milestone, setMilestone] = useState("test_pass");
  const [generating, setGenerating] = useState(false);

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const ms = MILESTONES.find(m => m.value === milestone)!;

      // Border
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(3);
      doc.rect(10, 10, pw - 20, ph - 20);
      doc.setLineWidth(1);
      doc.rect(14, 14, pw - 28, ph - 28);

      // Header
      let y = 40;
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("CERTIFICATE OF ACHIEVEMENT", pw / 2, y, { align: "center" });
      y += 20;

      // Title
      doc.setFontSize(28);
      doc.setTextColor(30, 58, 138);
      doc.text(ms.heading, pw / 2, y, { align: "center" });
      y += 18;

      // Pupil name
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("This is to certify that", pw / 2, y, { align: "center" });
      y += 14;

      doc.setFontSize(24);
      doc.setTextColor(30, 30, 30);
      doc.text(pupilName, pw / 2, y, { align: "center" });
      y += 8;

      // Underline name
      const nameWidth = doc.getTextWidth(pupilName);
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
      doc.line(pw / 2 - nameWidth / 2, y, pw / 2 + nameWidth / 2, y);
      y += 14;

      // Achievement text
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      if (milestone === "test_pass") {
        doc.text("has successfully passed their practical driving test", pw / 2, y, { align: "center" });
      } else if (milestone === "theory_pass") {
        doc.text("has successfully passed their theory test", pw / 2, y, { align: "center" });
      } else if (milestone === "first_lesson") {
        doc.text("has completed their first driving lesson", pw / 2, y, { align: "center" });
      } else {
        doc.text(`has completed ${milestone.replace("_lessons", "")} driving lessons`, pw / 2, y, { align: "center" });
      }
      y += 20;

      // Date and instructor
      const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      doc.setFontSize(10);
      doc.text(`Date: ${today}`, pw / 2 - 40, y, { align: "center" });
      doc.text(`Instructor: ${instructorName}`, pw / 2 + 40, y, { align: "center" });
      y += 14;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Powered by EveryDriver", pw / 2, ph - 18, { align: "center" });

      // Download
      doc.save(`${pupilName.replace(/\s+/g, "-")}-${milestone}-certificate.pdf`);
      toast.success("Certificate downloaded!");
    } catch (err) {
      toast.error("Failed to generate certificate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Issue Certificate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Milestone</Label>
          <Select value={milestone} onValueChange={setMilestone}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MILESTONES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={generateCertificate} disabled={generating} className="w-full gap-1">
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Generate Certificate
        </Button>
      </CardContent>
    </Card>
  );
}
