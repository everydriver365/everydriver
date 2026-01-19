import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignaturePad } from "./SignaturePad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, CheckCircle2, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";

interface TermsSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  instructorId: string;
  onSignatureComplete?: () => void;
}

interface TermsConditions {
  id: string;
  title: string;
  content: string;
  version: number;
}

interface ExistingSignature {
  id: string;
  signed_at: string;
  signature_url: string;
  terms: TermsConditions;
}

export function TermsSignatureModal({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  instructorId,
  onSignatureComplete,
}: TermsSignatureModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [terms, setTerms] = useState<TermsConditions | null>(null);
  const [existingSignature, setExistingSignature] = useState<ExistingSignature | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTermsAndSignature();
      setAgreed(false);
      setSignatureDataUrl(null);
      setScrolledToBottom(false);
    }
  }, [open, instructorId, pupilId]);

  const fetchTermsAndSignature = async () => {
    setLoading(true);
    try {
      // Fetch active terms
      const { data: termsData, error: termsError } = await supabase
        .from("instructor_terms_conditions")
        .select("id, title, content, version")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (termsError && termsError.code !== "PGRST116") {
        throw termsError;
      }

      setTerms(termsData);

      // Check for existing signature on current terms
      if (termsData) {
        const { data: sigData, error: sigError } = await supabase
          .from("pupil_signatures")
          .select("id, signed_at, signature_url")
          .eq("pupil_id", pupilId)
          .eq("terms_id", termsData.id)
          .single();

        if (sigError && sigError.code !== "PGRST116") {
          throw sigError;
        }

        if (sigData) {
          setExistingSignature({
            ...sigData,
            terms: termsData,
          });
        } else {
          setExistingSignature(null);
        }
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
      toast.error("Failed to load terms and conditions");
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;
    if (isAtBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleSubmit = async () => {
    if (!terms || !signatureDataUrl || !agreed) return;

    setSubmitting(true);
    try {
      // Convert base64 to blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();
      
      // Generate unique filename
      const filename = `${instructorId}/${pupilId}/${terms.id}_${Date.now()}.png`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(filename, blob, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(filename);

      // Create signature record
      const { error: insertError } = await supabase
        .from("pupil_signatures")
        .insert({
          pupil_id: pupilId,
          terms_id: terms.id,
          instructor_id: instructorId,
          signature_url: urlData.publicUrl,
          user_agent: navigator.userAgent,
        });

      if (insertError) throw insertError;

      toast.success(`${pupilName} has signed the terms`);
      onSignatureComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting signature:", error);
      toast.error("Failed to save signature");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!existingSignature || !terms) return;

    setExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(terms.title, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 12;

      // Version and date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Version ${terms.version}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Signatory info box
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, "F");
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text("Signed by:", margin + 5, yPosition + 8);
      pdf.setFont("helvetica", "normal");
      pdf.text(pupilName, margin + 35, yPosition + 8);

      pdf.setFont("helvetica", "bold");
      pdf.text("Date:", margin + 5, yPosition + 18);
      pdf.setFont("helvetica", "normal");
      const signedDate = new Date(existingSignature.signed_at);
      pdf.text(
        signedDate.toLocaleString("en-GB", {
          dateStyle: "full",
          timeStyle: "short",
        }),
        margin + 22,
        yPosition + 18
      );
      yPosition += 35;

      // Terms content
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Terms & Conditions", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(50, 50, 50);

      // Split content into lines that fit the page width
      const lines = pdf.splitTextToSize(terms.content, contentWidth);
      
      for (const line of lines) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      }

      // Add signature section at the bottom
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition = Math.max(yPosition + 15, pageHeight - 70);

      // Signature box
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPosition, contentWidth, 50, 3, 3, "FD");

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Digital Signature:", margin + 5, yPosition + 8);

      // Fetch and embed signature image
      try {
        const imgResponse = await fetch(existingSignature.signature_url);
        const imgBlob = await imgResponse.blob();
        const imgDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });

        pdf.addImage(imgDataUrl, "PNG", margin + 5, yPosition + 12, 60, 30);
      } catch (imgError) {
        console.error("Error loading signature image:", imgError);
        pdf.setTextColor(150, 150, 150);
        pdf.text("[Signature on file]", margin + 5, yPosition + 25);
      }

      // Verification text
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        `Document ID: ${existingSignature.id}`,
        margin + 5,
        yPosition + 45
      );
      pdf.text(
        `Generated: ${new Date().toLocaleString("en-GB")}`,
        pageWidth - margin - 50,
        yPosition + 45
      );

      // Footer on all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `${pupilName.replace(/\s+/g, "_")}_Terms_v${terms.version}_${signedDate.toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const canSubmit = agreed && signatureDataUrl && scrolledToBottom;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {terms?.title || "Terms & Conditions"}
          </DialogTitle>
          <DialogDescription>
            {existingSignature
              ? `Signed by ${pupilName} on ${new Date(existingSignature.signed_at).toLocaleDateString()}`
              : `${pupilName} - Please read and sign below`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32" />
          </div>
        ) : !terms ? (
          <div className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No terms and conditions have been set up yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Go to Settings to create your terms.
            </p>
          </div>
        ) : existingSignature ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Already Signed
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Version {existingSignature.terms.version} signed on{" "}
                  {new Date(existingSignature.signed_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Signature:</p>
              <img
                src={existingSignature.signature_url}
                alt="Signature"
                className="max-h-24 border rounded"
              />
            </div>

            <ScrollArea className="h-48 border rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                {terms.content}
              </div>
            </ScrollArea>

            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              variant="outline"
              className="w-full"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Signed T&Cs as PDF
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="text-xs text-muted-foreground">
              {!scrolledToBottom && "Please scroll to read all terms before signing"}
            </div>

            <ScrollArea
              className="flex-1 border rounded-lg p-4 min-h-[200px]"
              onScrollCapture={handleScroll}
            >
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                {terms.content}
              </div>
            </ScrollArea>

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  disabled={!scrolledToBottom}
                />
                <Label
                  htmlFor="agree"
                  className={`text-sm ${!scrolledToBottom ? "text-muted-foreground" : ""}`}
                >
                  I, {pupilName}, have read and agree to the above terms and conditions
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Signature</Label>
                <SignaturePad onSignatureChange={setSignatureDataUrl} />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Signature"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
