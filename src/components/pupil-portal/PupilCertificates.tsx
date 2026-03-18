import { useState } from "react";
import { Award, Download, FileText, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { format } from "date-fns";

interface PupilCertificatesProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
  instructorName: string;
  brandColour?: string;
}

const MILESTONE_LABELS: Record<string, string> = {
  first_lesson: "First Lesson Complete",
  "10_lessons": "10 Lessons Achievement",
  "20_lessons": "20 Lessons Achievement",
  theory_pass: "Theory Test Passed",
  test_pass: "Driving Test Passed!",
};

export function PupilCertificates({ pupilId, pupilName, instructorId, instructorName, brandColour }: PupilCertificatesProps) {
  const color = brandColour || "hsl(var(--primary))";
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  // Fetch certificates issued to this pupil
  const { data: certificates = [] } = useQuery({
    queryKey: ["pupil-certificates", pupilId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pupil_certificates")
        .select("*")
        .eq("pupil_id", pupilId)
        .order("issued_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Fetch payment history for receipts
  const { data: payments = [] } = useQuery({
    queryKey: ["pupil-payment-receipts", pupilId],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_history")
        .select("*")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as any[];
    },
  });

  const downloadCertificate = async (cert: any) => {
    setDownloadingCert(cert.id);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const heading = MILESTONE_LABELS[cert.milestone_type] || cert.milestone_type;

      // Border
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(3);
      doc.rect(10, 10, pw - 20, ph - 20);
      doc.setLineWidth(1);
      doc.rect(14, 14, pw - 28, ph - 28);

      let y = 40;
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("CERTIFICATE OF ACHIEVEMENT", pw / 2, y, { align: "center" });
      y += 20;

      doc.setFontSize(28);
      doc.setTextColor(30, 58, 138);
      doc.text(heading, pw / 2, y, { align: "center" });
      y += 18;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("This is to certify that", pw / 2, y, { align: "center" });
      y += 14;

      doc.setFontSize(24);
      doc.setTextColor(30, 30, 30);
      doc.text(pupilName, pw / 2, y, { align: "center" });
      y += 8;

      const nameWidth = doc.getTextWidth(pupilName);
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
      doc.line(pw / 2 - nameWidth / 2, y, pw / 2 + nameWidth / 2, y);
      y += 20;

      const dateStr = format(new Date(cert.issued_at), "d MMMM yyyy");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Date: ${dateStr}`, pw / 2 - 40, y, { align: "center" });
      doc.text(`Instructor: ${instructorName}`, pw / 2 + 40, y, { align: "center" });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Powered by EveryDriver", pw / 2, ph - 18, { align: "center" });

      doc.save(`${pupilName.replace(/\s+/g, "-")}-${cert.milestone_type}-certificate.pdf`);
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Failed to download certificate");
    } finally {
      setDownloadingCert(null);
    }
  };

  const downloadReceipt = async (payment: any) => {
    setDownloadingReceipt(payment.id);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pw = doc.internal.pageSize.getWidth();

      let y = 20;
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text("Payment Receipt", pw / 2, y, { align: "center" });
      y += 15;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, y, pw - 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);

      const lines = [
        ["Date:", format(new Date(payment.created_at), "d MMMM yyyy, HH:mm")],
        ["Student:", pupilName],
        ["Amount:", `£${Math.abs(payment.amount).toFixed(2)}`],
        ["Method:", payment.payment_method || "—"],
        ["Notes:", payment.notes || "—"],
      ];

      for (const [label, value] of lines) {
        doc.setFont("helvetica", "bold");
        doc.text(label, 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 65, y);
        y += 8;
      }

      y += 10;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Powered by EveryDriver", pw / 2, y, { align: "center" });

      doc.save(`receipt-${format(new Date(payment.created_at), "yyyy-MM-dd")}.pdf`);
      toast.success("Receipt downloaded!");
    } catch {
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingReceipt(null);
    }
  };

  return (
    <div className="space-y-4 px-4">
      {/* Certificates Section */}
      <InstructorCard>
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">My Certificates</h3>
        </div>

        {certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No certificates yet — keep learning and they'll appear here!
          </p>
        ) : (
          <div className="space-y-2">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {MILESTONE_LABELS[cert.milestone_type] || cert.milestone_type}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(cert.issued_at), "d MMM yyyy")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 gap-1"
                  disabled={downloadingCert === cert.id}
                  onClick={() => downloadCertificate(cert)}
                >
                  {downloadingCert === cert.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  PDF
                </Button>
              </div>
            ))}
          </div>
        )}
      </InstructorCard>

      {/* Payment Receipts Section */}
      <InstructorCard>
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="h-5 w-5" style={{ color }} />
          <h3 className="text-sm font-semibold text-foreground">Payment Receipts</h3>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No payments recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    £{Math.abs(payment.amount).toFixed(2)}
                    <span className="text-muted-foreground ml-1.5 text-[11px]">
                      {payment.payment_method || ""}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(payment.created_at), "d MMM yyyy")}
                    {payment.notes ? ` — ${payment.notes}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 gap-1"
                  disabled={downloadingReceipt === payment.id}
                  onClick={() => downloadReceipt(payment)}
                >
                  {downloadingReceipt === payment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  PDF
                </Button>
              </div>
            ))}
          </div>
        )}
      </InstructorCard>
    </div>
  );
}
