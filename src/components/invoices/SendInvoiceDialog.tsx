import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Plus, X } from "lucide-react";

interface DraftLine {
  name: string;
  quantity: number;
  amount: number; // £
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId?: string | null;
  recipientEmail: string;
  recipientName: string;
  /** Default line items (in £). Service Fee added automatically per business rules. */
  defaultLines?: DraftLine[];
  /** Amount in £ to bill (when no defaultLines) — used to pre-fill a single line */
  defaultAmount?: number;
  /** Optional pre-set description / memo */
  defaultDescription?: string;
  /** Default due days (overrides instructor preference if provided) */
  defaultDueDays?: number;
  /** Instructor id, used to look up instructor's default_invoice_due_days */
  instructorId?: string | null;
  /** Show Service Fee preview row (instructor invoices only). Default true. */
  includeServiceFee?: boolean;
  onSent?: () => void;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function poundsToCents(v: number): number {
  return Math.max(0, Math.round((Number(v) || 0) * 100));
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  pupilId,
  recipientEmail,
  recipientName,
  defaultLines,
  defaultAmount,
  defaultDescription,
  defaultDueDays,
  instructorId,
  includeServiceFee = true,
  onSent,
}: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState(recipientEmail);
  const [name, setName] = useState(recipientName);
  const [description, setDescription] = useState(defaultDescription || "Driving lessons");
  const [dueDate, setDueDate] = useState<string>(toDateInput(addDays(new Date(), defaultDueDays || 7)));
  const [lines, setLines] = useState<DraftLine[]>(
    defaultLines && defaultLines.length
      ? defaultLines
      : [{ name: "Driving lessons", quantity: 1, amount: defaultAmount || 0 }],
  );
  const [feeConfig, setFeeConfig] = useState<{ ratePercent: number; fixedFeePence: number } | null>(null);

  // Reset when reopened
  useEffect(() => {
    if (!open) return;
    setEmail(recipientEmail);
    setName(recipientName);
    setDescription(defaultDescription || "Driving lessons");
    setLines(
      defaultLines && defaultLines.length
        ? defaultLines
        : [{ name: "Driving lessons", quantity: 1, amount: defaultAmount || 0 }],
    );
    (async () => {
      // Pull instructor's preferred default due days if not overridden
      let days = defaultDueDays;
      if (!days && instructorId) {
        const { data } = await supabase
          .from("instructors")
          .select("default_invoice_due_days")
          .eq("id", instructorId)
          .maybeSingle();
        days = (data as any)?.default_invoice_due_days || 7;
      }
      setDueDate(toDateInput(addDays(new Date(), days || 7)));

      // Load platform fee config for Service Fee preview
      if (includeServiceFee) {
        const { data } = await supabase
          .from("platform_commission_config")
          .select("rate_percent, fixed_fee_pence")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (data) setFeeConfig({ ratePercent: data.rate_percent, fixedFeePence: data.fixed_fee_pence });
      }
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.amount) || 0) * (Number(l.quantity) || 0), 0),
    [lines],
  );
  const serviceFee = useMemo(() => {
    if (!includeServiceFee || !feeConfig || subtotal <= 0) return 0;
    return Math.round((subtotal * (feeConfig.ratePercent / 100) + feeConfig.fixedFeePence / 100) * 100) / 100;
  }, [includeServiceFee, feeConfig, subtotal]);
  const total = subtotal + serviceFee;

  const updateLine = (idx: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const addLine = () => setLines((prev) => [...prev, { name: "", quantity: 1, amount: 0 }]);

  const handleSend = async () => {
    if (!email || !name) {
      toast({ title: "Recipient required", description: "Add a name and email to send the invoice.", variant: "destructive" });
      return;
    }
    if (lines.length === 0 || subtotal <= 0) {
      toast({ title: "Add a line item", description: "Add at least one line with an amount greater than zero.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("square-invoice-manage", {
        body: {
          action: "create",
          pupil_id: pupilId || null,
          recipient_email: email,
          recipient_name: name,
          due_date: dueDate,
          description,
          service_fee_cents: poundsToCents(serviceFee),
          line_items: lines
            .filter((l) => l.name && (Number(l.amount) || 0) > 0)
            .map((l) => ({
              name: l.name,
              quantity: Math.max(1, Math.floor(Number(l.quantity) || 1)),
              amount_cents: poundsToCents(l.amount),
            })),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({ title: "Invoice sent", description: `${name} will receive an email from Square.` });
      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Could not send invoice",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Send invoice via Square
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Recipient name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recipient email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description / memo</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Line items</Label>
              <Button type="button" size="sm" variant="ghost" onClick={addLine} className="h-7 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add line
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  className="col-span-6 h-9"
                  placeholder="Description"
                  value={line.name}
                  onChange={(e) => updateLine(idx, { name: e.target.value })}
                />
                <Input
                  className="col-span-2 h-9 text-right"
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                />
                <Input
                  className="col-span-3 h-9 text-right"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="£"
                  value={line.amount}
                  onChange={(e) => updateLine(idx, { amount: Number(e.target.value) })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-span-1 h-9 w-9"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            {includeServiceFee && (
              <div className="flex justify-between text-muted-foreground">
                <span>Service Fee</span>
                <span>£{serviceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-1 border-t mt-1">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Send invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
