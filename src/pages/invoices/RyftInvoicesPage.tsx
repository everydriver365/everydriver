import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

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
}

interface Props {
  scope: "instructor" | "admin";
}

export default function RyftInvoicesPage({ scope }: Props) {
  const { instructor } = useInstructorAuth();
  const [invoices, setInvoices] = useState<RyftInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("ryft_invoices")
      .select(
        "id, recipient_name, recipient_email, amount_pence, status, description, ryft_payment_link_url, public_url, created_at, due_date"
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
          {invoices.map((inv) => (
            <Card key={inv.id} className="p-3 flex items-center justify-between gap-3">
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
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  £{(inv.amount_pence / 100).toFixed(2)}
                </div>
                {(inv.ryft_payment_link_url || inv.public_url) && (
                  <a
                    href={(inv.ryft_payment_link_url || inv.public_url) as string}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary flex items-center gap-1 justify-end"
                  >
                    Pay link <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </Card>
          ))}
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
