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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignaturePad } from "./SignaturePad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, CheckCircle2, Download, AlertTriangle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { differenceInYears } from "date-fns";
import jsPDF from "jspdf";

interface TermsSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  instructorId: string;
  pupilDateOfBirth?: string | null;
  parentName?: string | null;
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
  requires_parent_signature: boolean;
  parent_name: string | null;
  parent_signature_url: string | null;
  parent_signed_at: string | null;
}

export function TermsSignatureModal({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  instructorId,
  pupilDateOfBirth,
  parentName: initialParentName,
  onSignatureComplete,
}: TermsSignatureModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [terms, setTerms] = useState<TermsConditions | null>(null);
  const [existingSignature, setExistingSignature] = useState<ExistingSignature | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [parentAgreed, setParentAgreed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [parentSignatureDataUrl, setParentSignatureDataUrl] = useState<string | null>(null);
  const [parentName, setParentName] = useState(initialParentName || "");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  // Calculate if pupil is under 18
  const isUnder18 = pupilDateOfBirth
    ? differenceInYears(new Date(), new Date(pupilDateOfBirth)) < 18
    : false;

  useEffect(() => {
    if (open) {
      fetchTermsAndSignature();
      setAgreed(false);
      setParentAgreed(false);
      setSignatureDataUrl(null);
      setParentSignatureDataUrl(null);
      setScrolledToBottom(false);
      setParentName(initialParentName || "");
    }
  }, [open, instructorId, pupilId, initialParentName]);

  // If the terms content doesn't overflow (no scrolling possible), auto-enable the agree checkbox.
  useEffect(() => {
    if (!open || loading || !terms) return;

    requestAnimationFrame(() => {
      const viewport = document.querySelector(
        '[data-terms-scroll="modal"] [data-radix-scroll-area-viewport]'
      ) as HTMLDivElement | null;

      if (!viewport) return;

      const isScrollable = viewport.scrollHeight - viewport.clientHeight > 20;
      if (!isScrollable) setScrolledToBottom(true);
    });
  }, [open, loading, terms?.id]);

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
          .select("id, signed_at, signature_url, requires_parent_signature, parent_name, parent_signature_url, parent_signed_at")
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

  const uploadSignature = async (dataUrl: string, prefix: string): Promise<string> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const filename = `${instructorId}/${pupilId}/${terms!.id}_${prefix}_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(filename, blob, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("signatures")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!terms || !signatureDataUrl || !agreed) return;
    if (isUnder18 && (!parentSignatureDataUrl || !parentAgreed || !parentName.trim())) {
      toast.error("Parent/guardian signature is required for under-18 pupils");
      return;
    }

    setSubmitting(true);
    try {
      // Upload pupil signature
      const pupilSigUrl = await uploadSignature(signatureDataUrl, "pupil");

      // Upload parent signature if required
      let parentSigUrl: string | null = null;
      if (isUnder18 && parentSignatureDataUrl) {
        parentSigUrl = await uploadSignature(parentSignatureDataUrl, "parent");
      }

      // Create signature record
      const { error: insertError } = await supabase
        .from("pupil_signatures")
        .insert({
          pupil_id: pupilId,
          terms_id: terms.id,
          instructor_id: instructorId,
          signature_url: pupilSigUrl,
          user_agent: navigator.userAgent,
          requires_parent_signature: isUnder18,
          parent_name: isUnder18 ? parentName.trim() : null,
          parent_signature_url: parentSigUrl,
          parent_signed_at: isUnder18 && parentSigUrl ? new Date().toISOString() : null,
        });

      if (insertError) throw insertError;

      toast.success(
        isUnder18
          ? `${pupilName} and ${parentName} have signed the terms`
          : `${pupilName} has signed the terms`
      );
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
      const boxHeight = existingSignature.requires_parent_signature ? 40 : 25;
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, "F");
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text("Pupil:", margin + 5, yPosition + 8);
      pdf.setFont("helvetica", "normal");
      pdf.text(pupilName, margin + 25, yPosition + 8);

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

      if (existingSignature.requires_parent_signature && existingSignature.parent_name) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Parent/Guardian:", margin + 5, yPosition + 28);
        pdf.setFont("helvetica", "normal");
        pdf.text(existingSignature.parent_name, margin + 50, yPosition + 28);

        if (existingSignature.parent_signed_at) {
          pdf.setFont("helvetica", "bold");
          pdf.text("Parent Signed:", margin + 5, yPosition + 38);
          pdf.setFont("helvetica", "normal");
          pdf.text(
            new Date(existingSignature.parent_signed_at).toLocaleString("en-GB"),
            margin + 42,
            yPosition + 38
          );
        }
      }

      yPosition += boxHeight + 10;

      // Terms content
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Terms & Conditions", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(50, 50, 50);

      const lines = pdf.splitTextToSize(terms.content, contentWidth);
      
      for (const line of lines) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      }

      // Signature section
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition = Math.max(yPosition + 15, pageHeight - (existingSignature.requires_parent_signature ? 90 : 70));

      // Pupil Signature box
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(255, 255, 255);
      const sigBoxWidth = existingSignature.requires_parent_signature ? (contentWidth - 5) / 2 : contentWidth;
      pdf.roundedRect(margin, yPosition, sigBoxWidth, 50, 3, 3, "FD");

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Pupil Signature:", margin + 5, yPosition + 8);

      try {
        const imgResponse = await fetch(existingSignature.signature_url);
        const imgBlob = await imgResponse.blob();
        const imgDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });
        pdf.addImage(imgDataUrl, "PNG", margin + 5, yPosition + 12, 55, 30);
      } catch (imgError) {
        pdf.setTextColor(150, 150, 150);
        pdf.text("[Signature on file]", margin + 5, yPosition + 25);
      }

      // Parent Signature box (if applicable)
      if (existingSignature.requires_parent_signature && existingSignature.parent_signature_url) {
        const parentBoxX = margin + sigBoxWidth + 5;
        pdf.roundedRect(parentBoxX, yPosition, sigBoxWidth, 50, 3, 3, "FD");
        pdf.setTextColor(100, 100, 100);
        pdf.text("Parent/Guardian Signature:", parentBoxX + 5, yPosition + 8);

        try {
          const parentImgResponse = await fetch(existingSignature.parent_signature_url);
          const parentImgBlob = await parentImgResponse.blob();
          const parentImgDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(parentImgBlob);
          });
          pdf.addImage(parentImgDataUrl, "PNG", parentBoxX + 5, yPosition + 12, 55, 30);
        } catch (imgError) {
          pdf.setTextColor(150, 150, 150);
          pdf.text("[Signature on file]", parentBoxX + 5, yPosition + 25);
        }
      }

      // Verification text
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Document ID: ${existingSignature.id}`, margin + 5, yPosition + 55);
      pdf.text(`Generated: ${new Date().toLocaleString("en-GB")}`, pageWidth - margin - 50, yPosition + 55);

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

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

  const canSubmit = agreed && signatureDataUrl && scrolledToBottom &&
    (!isUnder18 || (parentAgreed && parentSignatureDataUrl && parentName.trim()));

  const needsParentSignature = existingSignature?.requires_parent_signature && !existingSignature?.parent_signature_url;

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
              ? needsParentSignature
                ? "Parent/guardian signature still required"
                : `Signed by ${pupilName} on ${new Date(existingSignature.signed_at).toLocaleDateString()}`
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
            <p className="text-muted-foreground">No terms and conditions have been set up yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Go to Settings to create your terms.</p>
          </div>
        ) : existingSignature && !needsParentSignature ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-2xl">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {existingSignature.requires_parent_signature ? "Both Signatures Complete" : "Already Signed"}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Version {existingSignature.terms.version} signed on {new Date(existingSignature.signed_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="border rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Pupil Signature:</p>
                <img src={existingSignature.signature_url} alt="Pupil Signature" className="max-h-20 border rounded" />
              </div>

              {existingSignature.parent_signature_url && (
                <div className="border rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Parent/Guardian ({existingSignature.parent_name}):
                  </p>
                  <img src={existingSignature.parent_signature_url} alt="Parent Signature" className="max-h-20 border rounded" />
                </div>
              )}
            </div>

            <ScrollArea className="h-32 border rounded-2xl p-4">
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{terms.content}</div>
            </ScrollArea>

            <Button onClick={handleExportPDF} disabled={exporting} variant="outline" className="w-full">
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
            {isUnder18 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Under 18 - Parent Signature Required</p>
                  <p className="text-amber-600 dark:text-amber-400">Both pupil and parent/guardian must sign</p>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {!scrolledToBottom && "Please scroll to read all terms before signing"}
            </div>

            <ScrollArea data-terms-scroll="modal" className="flex-1 border rounded-2xl p-4 min-h-[120px]" onScrollCapture={handleScroll}>
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{terms.content}</div>
            </ScrollArea>

            <div className="space-y-4">
              {/* Pupil Agreement & Signature */}
              <div className="space-y-3 p-3 border rounded-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pupil</Badge>
                  <span className="text-sm font-medium">{pupilName}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={(checked) => {
                      const next = checked === true;
                      if (next && !scrolledToBottom) {
                        toast.error("Please scroll through the terms before agreeing");
                        return;
                      }
                      setAgreed(next);
                    }}
                  />
                  <Label htmlFor="agree" className={`text-sm ${!scrolledToBottom ? "text-muted-foreground" : ""}`}>
                    I have read and agree to the above terms and conditions
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Pupil Signature</Label>
                  <SignaturePad onSignatureChange={setSignatureDataUrl} />
                </div>
              </div>

              {/* Parent Agreement & Signature (if under 18) */}
              {isUnder18 && (
                <div className="space-y-3 p-3 border rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      <Users className="h-3 w-3 mr-1" />
                      Parent/Guardian
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentName" className="text-sm">Parent/Guardian Name</Label>
                    <Input
                      id="parentName"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Enter parent/guardian name"
                    />
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="parentAgree"
                      checked={parentAgreed}
                      onCheckedChange={(checked) => setParentAgreed(checked === true)}
                      disabled={!scrolledToBottom || !parentName.trim()}
                    />
                    <Label
                      htmlFor="parentAgree"
                      className={`text-sm ${!scrolledToBottom || !parentName.trim() ? "text-muted-foreground" : ""}`}
                    >
                      I, as parent/guardian of {pupilName}, have read and agree to the above terms
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Parent/Guardian Signature</Label>
                    <SignaturePad onSignatureChange={setParentSignatureDataUrl} />
                  </div>
                </div>
              )}

              <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : isUnder18 ? (
                  "Submit Both Signatures"
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