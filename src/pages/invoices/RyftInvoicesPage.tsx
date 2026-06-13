import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, RefreshCw, Send, XCircle, Loader2 } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";

interface RyftInvoice {
  id: string;
  recipient_name: string | null;
  recipient_email: string | null;
  amount_pence: number;
  status: string;
  description: string | null;
  ryft_payment_link_url: string | null;
  public_url: string | null;
  created_at: string;
  due_date: string | null;
  last_event_at: string | null;
  paid_at: string | null;
}

interface Props {
  scope: "instructor" | "admin";
}

export default function RyftInvoicesPage({ scope }: Props) {
  const { instructor } = useInstructorAuth();
  const [invoices, setInvoices] = useState<RyftInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("ryft_invoices")
      .select(
        "id, recipient_name, recipient_email, amount_pence, status, description, ryft_payment_link_url, public_url, created_at, due_date, last_event_at, paid_at"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (scope === "instructor" && instructor?.id) {
      query = query.eq("issuer_instructor_id", instructor.id);
    }

    const { data } = await query;
    setInvoices((data as RyftInvoice[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [scope, instructor?.id]);

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "paid") return "default";
    if (["failed", "cancelled", "overdue"].includes(s)) return "destructive";
    if (s === "draft") return "outline";
    return "secondary";
  };

  const callAction = async (
    action: "cancel" | "resend" | "sync_status",
    invoice_row_id: string,
  ) => {
    setBusyId(invoice_row_id);
    try {
      const { data, error } = await supabase.functions.invoke("ryft-invoice-manage", {
        body: { action, invoice_row_id },
      });
      if (error) throw error;
      if (action === "resend" && (data as any)?.public_url) {
        await navigator.clipboard.writeText((data as any).public_url).catch(() => {});
        toast.success("Pay link copied to clipboard");
      } else if (action === "cancel") {
        toast.success("Invoice cancelled");
      } else if (action === "sync_status") {
        toast.success(`Status: ${(data as any)?.status ?? "synced"}`);
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Invoices</h1>
        {scope === "instructor" && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            New invoice
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const payUrl = inv.ryft_payment_link_url || inv.public_url;
            const isTerminal = ["paid", "cancelled", "failed"].includes(inv.status);
            const busy = busyId === inv.id;
            return (
              <Card key={inv.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {inv.recipient_name || inv.recipient_email || "Unnamed"}
                      </span>
                      <Badge variant={statusVariant(inv.status)} className="text-[10px]">
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {inv.description || "—"} ·{" "}
                      {new Date(inv.created_at).toLocaleDateString("en-GB")}
                      {inv.paid_at && ` · paid ${new Date(inv.paid_at).toLocaleDateString("en-GB")}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">£{(inv.amount_pence / 100).toFixed(2)}</div>
                    {payUrl && (
                      <a
                        href={payUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary flex items-center gap-1 justify-end"
                      >
                        Pay link <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                {scope === "instructor" && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || !inv.ryft_payment_link_url}
                      onClick={() => callAction("sync_status", inv.id)}
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      <span className="ml-1">Sync</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || isTerminal || !payUrl}
                      onClick={() => callAction("resend", inv.id)}
                    >
                      <Send size={12} />
                      <span className="ml-1">Resend</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={busy || isTerminal}
                      onClick={() => {
                        if (confirm("Cancel this invoice?")) callAction("cancel", inv.id);
                      }}
                    >
                      <XCircle size={12} />
                      <span className="ml-1">Cancel</span>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateInvoiceDialog
          scope={scope}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
