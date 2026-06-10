import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Using jsPDF from esm.sh for Deno compatibility
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PDFRequest {
  report_type: string;
  instructor_id: string;
  data: Record<string, any>;
}

function generateEarningsReport(doc: any, data: any) {
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text(data.title || "Earnings Report", pw / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.text(data.period || "", pw / 2, y, { align: "center" });
  y += 15;

  // Summary
  doc.setFontSize(12);
  doc.text("Summary", 14, y);
  y += 8;
  doc.setFontSize(10);

  const summaryItems = data.summary || [];
  for (const item of summaryItems) {
    doc.text(`${item.label}: £${item.value}`, 14, y);
    y += 6;
  }
  y += 5;

  // Transaction table
  if (data.transactions && data.transactions.length > 0) {
    doc.setFontSize(12);
    doc.text("Transactions", 14, y);
    y += 8;

    doc.setFontSize(9);
    const headers = ["Date", "Pupil", "Type", "Amount"];
    const colWidths = [30, 50, 40, 30];
    let x = 14;
    
    doc.setFont(undefined, "bold");
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += colWidths[i];
    });
    doc.setFont(undefined, "normal");
    y += 6;

    for (const tx of data.transactions) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      x = 14;
      doc.text(tx.date || "", x, y); x += colWidths[0];
      doc.text(tx.pupil || "", x, y); x += colWidths[1];
      doc.text(tx.type || "", x, y); x += colWidths[2];
      doc.text(`£${tx.amount || 0}`, x, y);
      y += 5;
    }
  }

  return doc;
}

function generateProgressReport(doc: any, data: any) {
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Pupil Progress Report", pw / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(12);
  doc.text(`Pupil: ${data.pupil_name || ""}`, 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`Instructor: ${data.instructor_name || ""}`, 14, y);
  y += 7;
  doc.text(`Date: ${data.date || new Date().toLocaleDateString()}`, 14, y);
  y += 7;
  doc.text(`Total Hours: ${data.total_hours || 0}`, 14, y);
  y += 12;

  // Competencies
  if (data.competencies && data.competencies.length > 0) {
    doc.setFontSize(12);
    doc.text("Competency Scores", 14, y);
    y += 8;

    doc.setFontSize(9);
    for (const comp of data.competencies) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${comp.name}: ${comp.score}/5`, 14, y);
      y += 5;
    }
  }

  // Notes
  if (data.notes) {
    y += 5;
    doc.setFontSize(12);
    doc.text("Notes", 14, y);
    y += 8;
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(data.notes, pw - 28);
    doc.text(lines, 14, y);
  }

  return doc;
}

function generateMileageReport(doc: any, data: any) {
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Mileage Report", pw / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.text(data.period || "", pw / 2, y, { align: "center" });
  y += 15;

  // Summary
  doc.setFontSize(10);
  doc.text(`Total Distance: ${data.total_distance || 0} miles`, 14, y); y += 6;
  doc.text(`Business Miles: ${data.business_miles || 0}`, 14, y); y += 6;
  doc.text(`Personal Miles: ${data.personal_miles || 0}`, 14, y); y += 6;
  doc.text(`HMRC Rate: ${data.hmrc_rate || "45p/mile"}`, 14, y); y += 6;
  doc.text(`Tax Deduction: £${data.tax_deduction || 0}`, 14, y); y += 12;

  // Log entries
  if (data.entries && data.entries.length > 0) {
    doc.setFontSize(12);
    doc.text("Journey Log", 14, y);
    y += 8;
    doc.setFontSize(9);

    for (const entry of data.entries) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${entry.date} | ${entry.purpose} | ${entry.distance} miles | ${entry.type}`, 14, y);
      y += 5;
    }
  }

  return doc;
}

function generateTaxReport(doc: any, data: any) {
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text(data.title || "Tax Year Report", pw / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.text(data.period || "", pw / 2, y, { align: "center" });
  y += 15;

  const sections = data.sections || [];
  for (const section of sections) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text(section.title, 14, y);
    y += 8;
    doc.setFontSize(10);
    for (const item of (section.items || [])) {
      doc.text(`${item.label}: £${item.value}`, 14, y);
      y += 6;
    }
    y += 4;
  }

  return doc;
}

function generateInvoice(doc: any, data: any) {
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;
  doc.setFontSize(20);
  doc.text("INVOICE", 14, y);
  doc.setFontSize(11);
  doc.text(data.invoice_number || "", pw - 14, y, { align: "right" });
  y += 10;
  doc.setFontSize(10);
  doc.text(`Date: ${data.issue_date || ""}`, pw - 14, y, { align: "right" });
  y += 10;

  const inst = data.instructor || {};
  doc.setFontSize(11);
  doc.text("From:", 14, y); y += 6;
  doc.setFontSize(10);
  doc.text(inst.name || "", 14, y); y += 5;
  if (inst.address) {
    const lines = doc.splitTextToSize(inst.address, 90);
    doc.text(lines, 14, y); y += lines.length * 5;
  }
  if (inst.vat_number) { doc.text(`VAT: ${inst.vat_number}`, 14, y); y += 5; }
  if (inst.email) { doc.text(inst.email, 14, y); y += 5; }
  y += 4;

  const pupil = data.pupil || {};
  doc.setFontSize(11);
  doc.text("To:", 14, y); y += 6;
  doc.setFontSize(10);
  doc.text(pupil.name || "", 14, y); y += 5;
  if (pupil.email) { doc.text(pupil.email, 14, y); y += 5; }
  y += 6;

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Date", 14, y);
  doc.text("Duration", 60, y);
  doc.text("Rate", 100, y);
  doc.text("Amount", pw - 14, y, { align: "right" });
  doc.setFont(undefined, "normal");
  y += 4;
  doc.line(14, y, pw - 14, y);
  y += 6;

  for (const li of (data.line_items || [])) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.text(String(li.date || ""), 14, y);
    doc.text(`${li.duration_mins || 0} min`, 60, y);
    doc.text(`£${Number(li.rate || 0).toFixed(2)}`, 100, y);
    doc.text(`£${Number(li.amount || 0).toFixed(2)}`, pw - 14, y, { align: "right" });
    y += 6;
  }

  y += 4;
  doc.line(14, y, pw - 14, y);
  y += 8;
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("Total", 100, y);
  doc.text(`£${Number(data.total || 0).toFixed(2)} ${data.currency || "GBP"}`, pw - 14, y, { align: "right" });
  doc.setFont(undefined, "normal");
  return doc;
}

function generateGenericReport(doc: any, data: any) {
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text(data.title || "Report", pw / 2, y, { align: "center" });
  y += 15;

  if (data.content) {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(data.content, pw - 28);
    doc.text(lines, 14, y);
  }

  return doc;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { report_type, instructor_id, data }: PDFRequest = await req.json();

    if (!report_type || !data) {
      return new Response(
        JSON.stringify({ error: "report_type and data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let doc = new jsPDF();

    switch (report_type) {
      case "earnings":
        doc = generateEarningsReport(doc, data);
        break;
      case "progress":
        doc = generateProgressReport(doc, data);
        break;
      case "mileage":
        doc = generateMileageReport(doc, data);
        break;
      case "tax":
        doc = generateTaxReport(doc, data);
        break;
      default:
        doc = generateGenericReport(doc, data);
    }

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generated by EveryDriver • Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Output as base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf_base64: pdfBase64,
        filename: `${report_type}-report-${new Date().toISOString().split("T")[0]}.pdf`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
