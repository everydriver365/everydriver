import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignaturePad } from "./SignaturePad";
import { UserAvatar } from "./UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Download, AlertTriangle, Users, Check, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { differenceInYears } from "date-fns";
import { titleCaseName } from "@/lib/titleCase";
import { logAudit } from "@/lib/auditLogger";
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

  // Audit-trail helper — every legal step writes to data_audit_log so the
  // signing flow is reconstructable from open → cancel/confirm.
  const logLegal = (action: string, extra?: Record<string, unknown>) => {
    void logAudit({
      instructorId,
      tableName: "pupil_signatures",
      recordId: pupilId,
      action: `terms_${action}` as never,
      newValues: {
        pupil_id: pupilId,
        pupil_name: pupilName,
        terms_id: terms?.id ?? null,
        terms_version: terms?.version ?? null,
        timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        ...(extra ?? {}),
      },
    });
  };

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

  // Log form open once terms are loaded (so the version is included).
  useEffect(() => {
    if (open && !loading && terms) {
      logLegal("opened", { has_existing_signature: !!existingSignature });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, terms?.id]);


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
      logLegal("confirm_blocked", { reason: "missing_parent_signature" });
      return;
    }

    logLegal("confirm_attempted", {
      is_under_18: isUnder18,
      has_parent_signature: !!parentSignatureDataUrl,
    });

    setSubmitting(true);
    try {
      // Upload pupil signature
      const pupilSigUrl = await uploadSignature(signatureDataUrl, "pupil");

      // Upload parent signature if required
      let parentSigUrl: string | null = null;
      if (isUnder18 && parentSignatureDataUrl) {
        parentSigUrl = await uploadSignature(parentSignatureDataUrl, "parent");
      }

      // Create signature record — snapshot the exact terms text/version/title
      // signed at this moment so future edits to the source T&Cs never
      // retroactively change what the pupil agreed to.
      const { data: insertedRows, error: insertError } = await supabase
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
          terms_content_snapshot: terms.content,
          terms_version_snapshot: terms.version,
          terms_title_snapshot: terms.title,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      logLegal("save_success", {
        signature_id: insertedRows?.id ?? null,
        signature_url: pupilSigUrl,
        parent_signature_url: parentSigUrl,
        is_under_18: isUnder18,
        parent_name: isUnder18 ? parentName.trim() : null,
      });

      toast.success(
        isUnder18
          ? `${pupilName} and ${parentName} have signed the terms`
          : `${pupilName} has signed the terms`
      );
      onSignatureComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting signature:", error);
      logLegal("save_failure", {
        error_message: error instanceof Error ? error.message : String(error),
      });
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

  const navigate = useNavigate();
  const displayName = titleCaseName(pupilName) || pupilName;
  const versionLabel = terms?.version ? `v${terms.version}` : "v1.0";
  const hasRealTerms = !!terms && !!terms.content && terms.content.trim().length > 5
    && terms.content.trim().toLowerCase() !== "terms and conds";

  const handleCancel = () => {
    const hadSignature = !!(signatureDataUrl || parentSignatureDataUrl);
    if (hadSignature) {
      if (!window.confirm("Discard signed agreement?")) {
        logLegal("cancel_aborted", { had_signature: true });
        return;
      }
    }
    logLegal("cancelled", {
      had_signature: hadSignature,
      had_agreement: agreed,
      had_parent_agreement: parentAgreed,
    });
    onOpenChange(false);
  };

  const goToTermsSettings = () => {
    onOpenChange(false);
    navigate("/instructor/menu?open=terms");
  };

  // Premium tile system tokens
  const COLOR_PRIMARY = "#2B7BC8";
  const COLOR_TEXT = "#000000";
  const COLOR_MUTED = "#6E6E73";
  const COLOR_HAIRLINE = "#E5E5EA";
  const COLOR_FILL = "#F2F2F4";
  const COLOR_TINT = "#E6F1FB";
  const FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

  // Already-signed view (kept legacy styling — still functional)
  const renderAlreadySigned = () => (
    <div className="flex-1 flex flex-col" style={{ fontFamily: FONT_STACK }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `0.5px solid ${COLOR_HAIRLINE}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleCancel} style={{ background: "transparent", border: "none", padding: 4, fontSize: 14, fontWeight: 500, color: COLOR_PRIMARY, cursor: "pointer" }}>Close</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 500, color: COLOR_TEXT, letterSpacing: "-0.2px" }}>Terms &amp; conditions</div>
        <div style={{ width: 50 }} />
      </div>
      <div className="py-6 px-4 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-2xl">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              {existingSignature!.requires_parent_signature ? "Both signatures complete" : "Already signed"}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Version {existingSignature!.terms.version} signed on {new Date(existingSignature!.signed_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="border rounded-2xl p-4">
            <p className="text-sm text-muted-foreground mb-2">Pupil signature</p>
            <img src={existingSignature!.signature_url} alt="Pupil Signature" className="max-h-20 border rounded" />
          </div>
          {existingSignature!.parent_signature_url && (
            <div className="border rounded-2xl p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Parent/Guardian ({existingSignature!.parent_name}):
              </p>
              <img src={existingSignature!.parent_signature_url} alt="Parent Signature" className="max-h-20 border rounded" />
            </div>
          )}
        </div>

        <ScrollArea className="h-32 border rounded-2xl p-4">
          <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{terms!.content}</div>
        </ScrollArea>

        <Button onClick={handleExportPDF} disabled={exporting} variant="outline" className="w-full">
          {exporting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating PDF...</>) : (<><Download className="h-4 w-4 mr-2" />Export signed T&amp;Cs as PDF</>)}
        </Button>
      </div>
    </div>
  );

  // Gating state — no real T&Cs configured
  const renderGating = () => (
    <div className="flex-1 flex flex-col" style={{ fontFamily: FONT_STACK }}>
      <div style={{ padding: "12px 16px", borderBottom: `0.5px solid ${COLOR_HAIRLINE}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleCancel} style={{ background: "transparent", border: "none", padding: 4, fontSize: 14, fontWeight: 500, color: COLOR_PRIMARY, cursor: "pointer" }}>Cancel</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 500, color: COLOR_TEXT, letterSpacing: "-0.2px" }}>Terms &amp; conditions</div>
        <div style={{ width: 50 }} />
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: COLOR_FILL, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText style={{ width: 24, height: 24, color: COLOR_MUTED }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: COLOR_TEXT, letterSpacing: "-0.2px" }}>No terms configured</div>
        <div style={{ fontSize: 13, color: COLOR_MUTED, lineHeight: 1.5, maxWidth: 320 }}>
          Add your terms and conditions in Settings before sharing with pupils.
        </div>
        <button
          onClick={goToTermsSettings}
          style={{ marginTop: 4, background: COLOR_PRIMARY, color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: FONT_STACK }}
        >
          Add terms
        </button>
      </div>
    </div>
  );

  // Sign-now (primary) view
  const renderSigningForm = () => {
    const t = terms!;
    const confirmDisabled = !canSubmit || submitting;

    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ fontFamily: FONT_STACK }}>
        {/* App header */}
        <div style={{ padding: "12px 16px", borderBottom: `0.5px solid ${COLOR_HAIRLINE}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button
            onClick={handleCancel}
            style={{ background: "transparent", border: "none", padding: 4, fontSize: 14, fontWeight: 500, color: COLOR_PRIMARY, cursor: "pointer", flexShrink: 0 }}
          >
            Cancel
          </button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 500, color: COLOR_TEXT, letterSpacing: "-0.2px" }}>
            Terms &amp; conditions
          </div>
          <button
            onClick={handleSubmit}
            disabled={confirmDisabled}
            style={{
              background: "transparent", border: "none", padding: 4,
              fontSize: 14, fontWeight: 500, color: COLOR_PRIMARY,
              cursor: confirmDisabled ? "not-allowed" : "pointer",
              opacity: confirmDisabled ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            {submitting ? "Confirming…" : "Confirm"}
          </button>
        </div>

        {/* Pupil identity bar */}
        <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${COLOR_HAIRLINE}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <UserAvatar name={displayName} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: COLOR_MUTED, letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 1px" }}>Pupil</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: COLOR_TEXT, letterSpacing: "-0.1px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
          {isUnder18 && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-amber-50 dark:bg-amber-950/30 rounded-[10px] border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Under 18 — parent signature required</p>
                <p className="text-amber-600 dark:text-amber-400">Both pupil and parent/guardian must sign</p>
              </div>
            </div>
          )}

          {/* Agreement section */}
          <div style={{ fontSize: 11, fontWeight: 500, color: COLOR_MUTED, letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 8px" }}>
            Agreement · {versionLabel}
          </div>
          <div
            data-terms-scroll="modal"
            onScroll={handleScroll}
            style={{ background: COLOR_FILL, borderRadius: 10, padding: 14, marginBottom: 16, maxHeight: 180, overflowY: "auto" }}
          >
            <div style={{ fontSize: 13, color: COLOR_TEXT, lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0 }}>
              {t.content}
            </div>
          </div>
          {!scrolledToBottom && (
            <div style={{ fontSize: 11, color: COLOR_MUTED, marginTop: -8, marginBottom: 12 }}>
              Scroll to the bottom of the terms to enable agreement.
            </div>
          )}

          {/* Agreement checkbox row */}
          <button
            type="button"
            onClick={() => {
              if (!agreed && !scrolledToBottom) {
                toast.error("Please scroll through the terms before agreeing");
                logLegal("agreement_blocked", { reason: "not_scrolled_to_bottom" });
                return;
              }
              const next = !agreed;
              setAgreed(next);
              logLegal(next ? "agreement_checked" : "agreement_unchecked");
            }}
            style={{
              background: agreed ? COLOR_TINT : "#FFFFFF",
              border: `0.5px solid ${agreed ? COLOR_PRIMARY : COLOR_HAIRLINE}`,
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              width: "100%",
              cursor: "pointer",
              textAlign: "left",
              marginBottom: 14,
              fontFamily: FONT_STACK,
            }}
          >
            <span
              style={{
                width: 18, height: 18, borderRadius: 5, marginTop: 1, flexShrink: 0,
                background: agreed ? COLOR_PRIMARY : "#FFFFFF",
                border: agreed ? "none" : "1.5px solid #C7C7CC",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {agreed && <Check style={{ width: 11, height: 11, color: "#FFFFFF", strokeWidth: 2.5 }} />}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: COLOR_TEXT, lineHeight: 1.4 }}>
              I have read and agree to the terms above
            </span>
          </button>

          {/* Pupil signature */}
          <div style={{ fontSize: 11, fontWeight: 500, color: COLOR_MUTED, letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 8px" }}>
            Pupil signature
          </div>
          <div
            style={{
              background: COLOR_FILL,
              border: `0.5px solid ${COLOR_HAIRLINE}`,
              borderRadius: 10,
              padding: "12px",
              marginBottom: 8,
              minHeight: 100,
            }}
          >
            <SignaturePad
              onSignatureChange={(dataUrl) => {
                const previouslyHad = !!signatureDataUrl;
                setSignatureDataUrl(dataUrl);
                if (dataUrl && !previouslyHad) logLegal("signature_captured", { signer: "pupil" });
                if (!dataUrl && previouslyHad) logLegal("signature_cleared", { signer: "pupil" });
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isUnder18 ? 20 : 0 }}>
            <p style={{ fontSize: 11, color: COLOR_MUTED, margin: 0 }}>Will be timestamped on confirm</p>
          </div>

          {/* Parent (under-18) — preserved */}
          {isUnder18 && (
            <div style={{ marginTop: 20, padding: 12, border: `0.5px solid ${COLOR_HAIRLINE}`, borderRadius: 10, background: "#FFFBEB" }}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-amber-500 text-amber-700">
                  <Users className="h-3 w-3 mr-1" />
                  Parent/Guardian
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                <Label htmlFor="parentName" className="text-sm">Parent/Guardian name</Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Enter parent/guardian name"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!scrolledToBottom || !parentName.trim()) return;
                  const next = !parentAgreed;
                  setParentAgreed(next);
                  logLegal(next ? "parent_agreement_checked" : "parent_agreement_unchecked", {
                    parent_name: parentName.trim(),
                  });
                }}
                disabled={!scrolledToBottom || !parentName.trim()}
                style={{
                  background: parentAgreed ? COLOR_TINT : "#FFFFFF",
                  border: `0.5px solid ${parentAgreed ? COLOR_PRIMARY : COLOR_HAIRLINE}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  width: "100%",
                  cursor: (!scrolledToBottom || !parentName.trim()) ? "not-allowed" : "pointer",
                  opacity: (!scrolledToBottom || !parentName.trim()) ? 0.5 : 1,
                  textAlign: "left",
                  marginBottom: 12,
                  fontFamily: FONT_STACK,
                }}
              >
                <span
                  style={{
                    width: 18, height: 18, borderRadius: 5, marginTop: 1, flexShrink: 0,
                    background: parentAgreed ? COLOR_PRIMARY : "#FFFFFF",
                    border: parentAgreed ? "none" : "1.5px solid #C7C7CC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {parentAgreed && <Check style={{ width: 11, height: 11, color: "#FFFFFF", strokeWidth: 2.5 }} />}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: COLOR_TEXT, lineHeight: 1.4 }}>
                  I, as parent/guardian of {displayName}, have read and agree to the terms above
                </span>
              </button>

              <div style={{ fontSize: 11, fontWeight: 500, color: COLOR_MUTED, letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 8px" }}>
                Parent/guardian signature
              </div>
              <div
                style={{
                  background: COLOR_FILL,
                  border: `0.5px solid ${COLOR_HAIRLINE}`,
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 100,
                }}
              >
                <SignaturePad
                  onSignatureChange={(dataUrl) => {
                    const previouslyHad = !!parentSignatureDataUrl;
                    setParentSignatureDataUrl(dataUrl);
                    if (dataUrl && !previouslyHad) logLegal("signature_captured", { signer: "parent", parent_name: parentName.trim() || null });
                    if (!dataUrl && previouslyHad) logLegal("signature_cleared", { signer: "parent" });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); else onOpenChange(o); }}>
      <DialogContent
        className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0"
        style={{ background: "#FFFFFF", borderRadius: 16 }}
      >
        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32" />
          </div>
        ) : !hasRealTerms ? (
          renderGating()
        ) : existingSignature && !needsParentSignature ? (
          renderAlreadySigned()
        ) : (
          renderSigningForm()
        )}
      </DialogContent>
    </Dialog>
  );
}