import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratePDFOptions {
  reportType: string;
  instructorId?: string;
  data: Record<string, any>;
  filename?: string;
}

/**
 * Generate a PDF via the backend edge function.
 * Returns a Blob that can be downloaded or shared.
 * Falls back to returning null if the function fails.
 */
export async function generatePDFBackend(options: GeneratePDFOptions): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-pdf", {
      body: {
        report_type: options.reportType,
        instructor_id: options.instructorId,
        data: options.data,
      },
    });

    if (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
      return null;
    }

    if (!data?.pdf_base64) {
      toast.error("No PDF data received");
      return null;
    }

    // Convert base64 to blob
    const byteCharacters = atob(data.pdf_base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: "application/pdf" });
  } catch (err) {
    console.error("PDF generation failed:", err);
    toast.error("Failed to generate PDF");
    return null;
  }
}

/**
 * Generate and immediately download a PDF.
 */
export async function downloadPDFBackend(options: GeneratePDFOptions): Promise<void> {
  const blob = await generatePDFBackend(options);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = options.filename || `${options.reportType}-report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("PDF downloaded");
}
