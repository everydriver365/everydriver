import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface PupilOption {
  id: string;
  name: string | null;
  email: string | null;
}

interface LineItemInput {
  name: string;
  quantity: number;
  amount_pounds: string; // entered in pounds
}

interface Props {
  onCreated?: () => void;
  scope: "admin" | "instructor";
  disabled?: boolean;
  disabledReason?: string;
}

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CreateInvoiceDialog({ onCreated, scope, disabled, disabledReason }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [submitting, setSubmitting] = useState(false);
  const [pupils, setPupils] = useState<PupilOption[]>([]);
  const [pupilId, setPupilId] = useState<string>("none");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [dueDate, setDueDate] = useState(todayPlus(7));
  const [description, setDescription] = useState("");
  const [serviceFeePounds, setServiceFeePounds] = useState("0");
  const [items, setItems] = useState<LineItemInput[]>([
    { name: "Driving lesson", quantity: 1, amount_pounds: "" },
  ]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("pupils")
          .select("id, name, email")
          .order("name", { ascending: true })
          .limit(500);
        setPupils((data as PupilOption[]) || []);
      } catch {
        // non-fatal
      }
    })();
  }, [open]);

  const onSelectPupil = (id: string) => {
    setPupilId(id);
    if (id === "none") return;
    const p = pupils.find((x) => x.id === id);
    if (p) {
      if (p.name) setRecipientName(p.name);
      if (p.email) setRecipientEmail(p.email);
    }
  };

  const updateItem = (i: number, patch: Partial<LineItemInput>) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const addItem = () =>
    setItems((arr) => [...arr, { name: "", quantity: 1, amount_pounds: "" }]);
  const removeItem = (i: number) =>
    setItems((arr) => (arr.length === 1 ? arr : arr.filter((_, idx) => idx !== i)));

  const total =
    items.reduce(
      (sum, it) => sum + (Number(it.amount_pounds) || 0) * (Number(it.quantity) || 0),
      0,
    ) + (Number(serviceFeePounds) || 0);

  const reset = () => {
    setPupilId("none");
    setRecipientName("");
    setRecipientEmail("");
    setDueDate(todayPlus(7));
    setDescription("");
    setServiceFeePounds("0");
    setItems([{ name: "Driving lesson", quantity: 1, amount_pounds: "" }]);
    setStep("form");
  };

  // Validate inputs and return the normalized payload for the edge function.
  // Returns null when validation fails (and shows a toast).
  const buildPayload = () => {
    if (!recipientEmail || !recipientName) {
      toast({ title: "Recipient name and email are required", variant: "destructive" });
      return null;
    }
    const cleanItems = items
      .filter((it) => it.name.trim() && Number(it.amount_pounds) > 0)
      .map((it) => ({
        name: it.name.trim(),
        quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
        amount_cents: Math.round(Number(it.amount_pounds) * 100),
      }));
    if (cleanItems.length === 0) {
      toast({ title: "Add at least one line item with an amount", variant: "destructive" });
      return null;
    }
    if (!dueDate) {
      toast({ title: "Due date is required", variant: "destructive" });
      return null;
    }
    return {
      pupil_id: pupilId !== "none" ? pupilId : null,
      recipient_email: recipientEmail.trim(),
      recipient_name: recipientName.trim(),
      line_items: cleanItems,
      service_fee_cents: Math.max(0, Math.round(Number(serviceFeePounds) * 100) || 0),
      due_date: dueDate,
      description: description.trim() || undefined,
    };
  };

  const goPreview = () => {
    if (buildPayload()) setStep("preview");
  };

  const submit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("square-invoice-manage", {
        body: { action: "create", ...payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({
        title: "Invoice sent",
        description: `Emailed to ${recipientEmail}`,
      });
      reset();
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast({
        title: "Couldn't send invoice",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Preview-only derived values
  const fmtGBP = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

  const previewItems = useMemo(
    () =>
      items
        .filter((it) => it.name.trim() && Number(it.amount_pounds) > 0)
        .map((it) => {
          const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
          const unit = Number(it.amount_pounds) || 0;
          return { name: it.name.trim(), qty, unit, line: qty * unit };
        }),
    [items],
  );
  const previewFee = Math.max(0, Number(serviceFeePounds) || 0);
  const previewSubtotal = previewItems.reduce((s, it) => s + it.line, 0);
  const previewTotal = previewSubtotal + previewFee;
  const issuerLabel = scope === "admin" ? "Platform" : "Your Square account";


  const selectedPupilName = pupils.find((p) => p.id === pupilId)?.name;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setStep("form");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> New invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "form" ? "Create & send invoice" : "Preview invoice"}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? scope === "admin"
                ? "Sends a Square invoice from the platform account."
                : "Sends a Square invoice from your connected Square account."
              : `Review the invoice — nothing is sent until you click "Send invoice".`}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            {pupils.length > 0 && (
              <div className="space-y-1.5">
                <Label>Pupil (optional)</Label>
                <Select value={pupilId} onValueChange={onSelectPupil}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pupil to pre-fill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {pupils.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name || "Unnamed"} {p.email ? `· ${p.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Recipient name</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Recipient email</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add line
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <Input
                      className="col-span-6"
                      placeholder="Description"
                      value={it.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Unit £"
                      value={it.amount_pounds}
                      onChange={(e) => updateItem(i, { amount_pounds: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-1"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Service fee (£)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceFeePounds}
                  onChange={(e) => setServiceFeePounds(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description / note (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Visible to the recipient on the invoice"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{fmtGBP(total)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b bg-muted/30">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Invoice
                </div>
                <div className="text-lg font-semibold">
                  {description || "Driving lessons invoice"}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Issued {format(new Date(), "d MMM yyyy")}</div>
                <div>Due {dueDate ? format(new Date(dueDate), "d MMM yyyy") : "—"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  From
                </div>
                <div className="font-medium">{issuerLabel}</div>
                <div className="text-xs text-muted-foreground">via Square</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Bill to
                </div>
                <div className="font-medium">{recipientName || "—"}</div>
                <div className="text-xs text-muted-foreground">{recipientEmail || "—"}</div>
                {pupilId !== "none" && selectedPupilName && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Pupil: {selectedPupilName}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 pb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 font-medium text-right w-16">Qty</th>
                    <th className="py-2 pr-3 font-medium text-right w-24">Unit</th>
                    <th className="py-2 font-medium text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewItems.map((it, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-3">{it.name}</td>
                      <td className="py-2 pr-3 text-right">{it.qty}</td>
                      <td className="py-2 pr-3 text-right">{fmtGBP(it.unit)}</td>
                      <td className="py-2 text-right font-medium">{fmtGBP(it.line)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t bg-muted/20 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{fmtGBP(previewSubtotal)}</span>
              </div>
              {previewFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Service Fee</span>
                  <span>{fmtGBP(previewFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-1">
                <span>Total</span>
                <span>{fmtGBP(previewTotal)}</span>
              </div>
            </div>

            {description && (
              <div className="px-5 py-3 border-t text-xs text-muted-foreground whitespace-pre-wrap">
                {description}
              </div>
            )}

            <div className="px-5 py-3 border-t text-xs text-muted-foreground">
              An email with a secure payment link will be sent to{" "}
              <span className="font-medium text-foreground">{recipientEmail}</span> from Square.
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "form" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={goPreview} disabled={submitting}>
                Preview invoice
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to edit
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Send invoice
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
