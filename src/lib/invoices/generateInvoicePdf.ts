import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface InvoicePdfInput {
  id: string;
  square_invoice_id: string | null;
  status: string;
  amount_cents: number;
  service_fee_cents: number;
  currency: string;
  due_date: string | null;
  description: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  recipient_name: string | null;
  recipient_email: string | null;
  public_url: string | null;
  instructor?: { name: string | null; logo_url?: string | null } | null;
  pupil?: { name: string | null } | null;
}

async function loadLogo(
  url: string
): Promise<{ dataUrl: string; format: "PNG" | "JPEG"; width: number; height: number } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("svg")) return null; // jsPDF can't render SVG
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const { width, height } = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error("image load failed"));
        img.src = dataUrl;
      }
    );
    const format: "PNG" | "JPEG" = contentType.includes("jpeg") || contentType.includes("jpg")
      ? "JPEG"
      : "PNG";
    return { dataUrl, format, width, height };
  } catch {
    return null;
  }
}

function money(cents: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    (cents || 0) / 100
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd/MM/yy");
  } catch {
    return "—";
  }
}

export async function generateInvoicePdf(inv: InvoicePdfInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;

  // Optional instructor logo (top-left)
  const logo = inv.instructor?.logo_url ? await loadLogo(inv.instructor.logo_url) : null;
  let titleX = margin;
  let titleAlign: "left" | "right" = "left";
  if (logo) {
    const maxW = 140;
    const maxH = 56;
    const ratio = logo.width / logo.height;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    doc.addImage(logo.dataUrl, logo.format, margin, 36, w, h);
    titleX = pageWidth - margin;
    titleAlign = "right";
  }

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", titleX, 64, { align: titleAlign });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  const invoiceRef = inv.square_invoice_id || inv.id;
  doc.text(`Invoice #${invoiceRef}`, titleX, 82, { align: titleAlign });
  doc.text(`Issued ${fmtDate(inv.sent_at || inv.created_at)}`, titleX, 96, { align: titleAlign });

  // Status pill — opposite side of the title, or right side when no logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20);
  const statusX = logo ? margin : pageWidth - margin;
  const statusAlign: "left" | "right" = logo ? "left" : "right";
  const statusY = logo ? 112 : 64;
  doc.text(inv.status.toUpperCase(), statusX, statusY, { align: statusAlign });

  // From / To block
  const fromName = inv.instructor?.name || "Instructor";
  const toName = inv.recipient_name || inv.pupil?.name || "Customer";
  const toEmail = inv.recipient_email || "";

  doc.setTextColor(110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("FROM", margin, 140);
  doc.text("BILL TO", pageWidth / 2, 140);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(fromName, margin, 158);
  doc.text(toName, pageWidth / 2, 158);
  if (toEmail) {
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(toEmail, pageWidth / 2, 172);
  }

  // Due date
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Due: ${fmtDate(inv.due_date)}`, margin, 200);
  if (inv.paid_at) {
    doc.text(`Paid: ${fmtDate(inv.paid_at)}`, margin, 214);
  }

  // Line items
  const subtotal = (inv.amount_cents || 0) - (inv.service_fee_cents || 0);
  const body: Array<[string, string]> = [
    [inv.description || "Driving lessons", money(subtotal, inv.currency)],
  ];
  if (inv.service_fee_cents) {
    body.push(["Service Fee", money(inv.service_fee_cents, inv.currency)]);
  }

  autoTable(doc, {
    startY: 240,
    head: [["Description", "Amount"]],
    body,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 8 },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 60,
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "right", cellWidth: 120 },
    },
    margin: { left: margin, right: margin },
  });

  const afterTableY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 16;

  // Total
  doc.setDrawColor(220);
  doc.line(margin, afterTableY, pageWidth - margin, afterTableY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Total", margin, afterTableY + 24);
  doc.text(money(inv.amount_cents, inv.currency), pageWidth - margin, afterTableY + 24, {
    align: "right",
  });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140);
  const footerY = doc.internal.pageSize.getHeight() - 48;
  if (inv.public_url) {
    doc.text(`Pay online: ${inv.public_url}`, margin, footerY);
  }
  doc.text(
    `Generated ${format(new Date(), "d MMM yyyy, HH:mm")}`,
    pageWidth - margin,
    footerY,
    { align: "right" }
  );

  doc.save(`invoice-${invoiceRef}.pdf`);
}
