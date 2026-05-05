import { useMemo, useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { CalendarIcon, FileText, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import type { PaymentTx } from "@/hooks/useInstructorPaymentsData";

type FormatType = "csv" | "pdf";
type Preset = "7d" | "30d" | "thisMonth" | "lastMonth" | "ytd" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "ytd", label: "Year to date" },
  { id: "custom", label: "Custom range" },
];

function rangeFor(preset: Preset, custom: { from?: Date; to?: Date }): { from: Date; to: Date } {
  const today = new Date();
  switch (preset) {
    case "7d": return { from: subDays(today, 6), to: today };
    case "30d": return { from: subDays(today, 29), to: today };
    case "thisMonth": return { from: startOfMonth(today), to: today };
    case "lastMonth": {
      const lm = subMonths(today, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case "ytd": return { from: new Date(today.getFullYear(), 0, 1), to: today };
    case "custom": return {
      from: custom.from ?? subDays(today, 29),
      to: custom.to ?? today,
    };
  }
}

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(v: string | number) {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(rows: PaymentTx[]): string {
  const header = ["Date", "Pupil", "Method", "For", "Amount (GBP)", "Status"];
  const body = rows.map(t => [
    format(new Date(t.dateTime), "yyyy-MM-dd HH:mm"),
    t.pupilName,
    t.method,
    t.forText,
    t.amount.toFixed(2),
    t.status,
  ].map(escapeCsv).join(","));
  return [header.join(","), ...body].join("\n");
}

function buildPdf(rows: PaymentTx[], from: Date, to: Date, instructorName: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Payments report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${instructorName || "Instructor"} · ${format(from, "d MMM yyyy")} – ${format(to, "d MMM yyyy")}`, 14, 25);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  doc.setTextColor(15);
  doc.text(`${rows.length} transactions · Total ${gbp(total)}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["Date", "Pupil", "Method", "For", "Amount", "Status"]],
    body: rows.map(t => [
      format(new Date(t.dateTime), "dd MMM yyyy HH:mm"),
      t.pupilName,
      t.method,
      t.forText,
      gbp(t.amount),
      t.status,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 4: { halign: "right" } },
  });
  return doc;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transactions: PaymentTx[];
  instructorName?: string;
}

export function PaymentsExportDialog({ open, onOpenChange, transactions, instructorName }: Props) {
  const [preset, setPreset] = useState<Preset>("30d");
  const [from, setFrom] = useState<Date | undefined>(subDays(new Date(), 29));
  const [to, setTo] = useState<Date | undefined>(new Date());
  const [fmt, setFmt] = useState<FormatType>("csv");

  const range = useMemo(
    () => rangeFor(preset, { from, to }),
    [preset, from, to]
  );

  const filtered = useMemo(() => {
    const fromTs = new Date(range.from); fromTs.setHours(0, 0, 0, 0);
    const toTs = new Date(range.to); toTs.setHours(23, 59, 59, 999);
    return transactions
      .filter(t => {
        const d = new Date(t.dateTime).getTime();
        return d >= fromTs.getTime() && d <= toTs.getTime();
      })
      .sort((a, b) => +new Date(b.dateTime) - +new Date(a.dateTime));
  }, [transactions, range]);

  const total = filtered.reduce((s, r) => s + r.amount, 0);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("No transactions in this range");
      return;
    }
    const fname = `payments-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}`;
    if (fmt === "csv") {
      const csv = buildCsv(filtered);
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${fname}.csv`);
    } else {
      const doc = buildPdf(filtered, range.from, range.to, instructorName || "");
      doc.save(`${fname}.pdf`);
    }
    toast.success(`Exported ${filtered.length} transactions`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Export payments</DialogTitle>
          <DialogDescription>
            Choose a date range and a format. We'll download the matching transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset chips */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Date range</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full border transition-colors",
                    preset === p.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range pickers */}
          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !from && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {from ? format(from, "d MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !to && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {to ? format(to, "d MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={to} onSelect={setTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Format */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "csv" as const, label: "CSV", desc: "Spreadsheet-friendly", Icon: FileSpreadsheet },
                { id: "pdf" as const, label: "PDF", desc: "Printable report", Icon: FileText },
              ]).map(({ id, label, desc, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFmt(id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                    fmt === id ? "border-foreground bg-muted/50" : "border-border hover:bg-muted/30"
                  )}
                >
                  <Icon className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/40 p-3 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {format(range.from, "d MMM")} – {format(range.to, "d MMM yyyy")}
            </span>
            <span className="font-medium">
              {filtered.length} txns · {gbp(total)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download {fmt.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
