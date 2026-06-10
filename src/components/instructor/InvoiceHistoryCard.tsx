import { useEffect, useState } from "react";
import { Loader2, FileText, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total: number;
  status: string;
  auto_generated: boolean | null;
  pdf_url: string | null;
}

interface Props {
  pupilId: string;
  instructorId: string;
}

export function InvoiceHistoryCard({ pupilId, instructorId }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, total, status, auto_generated, pdf_url")
      .eq("instructor_id", instructorId)
      .eq("pupil_id", pupilId)
      .order("invoice_date", { ascending: false });
    setInvoices((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [pupilId, instructorId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-auto-invoice", {
        body: { instructorId, pupilId, periodDays: 30 },
      });
      if (error) throw error;
      if ((data as any)?.skipped) {
        toast({ title: "Nothing to invoice", description: (data as any).reason });
      } else {
        toast({ title: "Invoice created", description: (data as any)?.invoiceNumber });
        await load();
      }
    } catch (e: any) {
      toast({ title: "Failed", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (inv: Invoice) => {
    if (!inv.pdf_url) {
      toast({ title: "No PDF available", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.storage
      .from("invoice-pdfs")
      .createSignedUrl(inv.pdf_url, 300);
    if (error || !data?.signedUrl) {
      toast({ title: "Could not get download link", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const statusColor = (s: string) =>
    s === "paid" ? "bg-green-100 text-green-700" :
    s === "overdue" ? "bg-red-100 text-red-700" :
    s === "sent" || s === "viewed" ? "bg-blue-100 text-blue-700" :
    "bg-muted text-muted-foreground";

  return (
    <div className="bg-white rounded-2xl border border-border/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Invoice History</h3>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={generating} className="gap-1">
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generate Invoice Now
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No invoices yet.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {invoices.map((inv) => (
            <li key={inv.id} className="py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {inv.invoice_number}
                  {inv.auto_generated && (
                    <span className="ml-2 text-[10px] uppercase text-primary">auto</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {inv.invoice_date} · £{Number(inv.total).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={statusColor(inv.status)} variant="secondary">
                  {inv.status}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => handleDownload(inv)} disabled={!inv.pdf_url}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
