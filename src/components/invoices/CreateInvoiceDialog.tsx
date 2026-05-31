import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
import { QuickAddPupilButton, type QuickAddedPupil } from "@/components/instructor/pupils/QuickAddPupilButton";

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
  const [serviceFeePounds, setServiceFeePounds] = useState("1");
  const [items, setItems] = useState<LineItemInput[]>([
    { name: "Driving lesson", quantity: 1, amount_pounds: "" },
  ]);
  const bankStorageKey = `invoice-bank-details-${scope}`;
  const [showBank, setShowBank] = useState(false);
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankSortCode, setBankSortCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [allowClearpay, setAllowClearpay] = useState(false);
  const [allowKlarna, setAllowKlarna] = useState(false);
  const [instructorKlarnaEnabled, setInstructorKlarnaEnabled] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(bankStorageKey);
      if (raw) {
        const v = JSON.parse(raw);
        setBankAccountName(v.name || "");
        setBankSortCode(v.sort || "");
        setBankAccountNumber(v.number || "");
        if (v.enabled) setShowBank(true);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("pupils")
          .select("id, name, email")
          .eq("status", "active")
          .is("deleted_at", null)
          .order("name", { ascending: true })
          .limit(500);
        setPupils((data as PupilOption[]) || []);
      } catch {
        // non-fatal
      }
      // Fetch instructor klarna_enabled flag (instructor scope only)
      if (scope === "instructor") {
        try {
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth.user?.id;
          if (uid) {
            const { data: ins } = await supabase
              .from("instructors")
              .select("klarna_enabled")
              .eq("auth_user_id", uid)
              .maybeSingle();
            setInstructorKlarnaEnabled(!!(ins as any)?.klarna_enabled);
          }
        } catch {
          // non-fatal
        }
      } else {
        setInstructorKlarnaEnabled(true);
      }
    })();
  }, [open, scope]);

  const handlePupilCreated = (p: QuickAddedPupil) => {
    setPupils((arr) => [{ id: p.id, name: p.name, email: p.email }, ...arr]);
    setPupilId(p.id);
    if (p.name) setRecipientName(p.name);
    if (p.email) setRecipientEmail(p.email);
  };

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
    setServiceFeePounds("1");
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
    const bankBlock = buildBankBlock();
    const fullDescription = [description.trim(), bankBlock].filter(Boolean).join("\n\n");

    return {
      pupil_id: pupilId !== "none" ? pupilId : null,
      recipient_email: recipientEmail.trim(),
      recipient_name: recipientName.trim(),
      line_items: cleanItems,
      service_fee_cents: Math.max(0, Math.round(Number(serviceFeePounds) * 100) || 0),
      due_date: dueDate,
      description: fullDescription || undefined,
      accepted_payment_methods: {
        card: true,
        buy_now_pay_later: allowClearpay,
      },
      klarna_enabled: allowKlarna && instructorKlarnaEnabled,
    };
  };

  const buildBankBlock = () => {
    if (!showBank) return "";
    const lines: string[] = [];
    if (bankAccountName.trim()) lines.push(`Account name: ${bankAccountName.trim()}`);
    if (bankSortCode.trim()) lines.push(`Sort code: ${bankSortCode.trim()}`);
    if (bankAccountNumber.trim()) lines.push(`Account number: ${bankAccountNumber.trim()}`);
    if (bankReference.trim()) lines.push(`Reference: ${bankReference.trim()}`);
    if (lines.length === 0) return "";
    return ["Bank transfer details:", ...lines].join("\n");
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

      try {
        localStorage.setItem(
          bankStorageKey,
          JSON.stringify({
            enabled: showBank,
            name: bankAccountName,
            sort: bankSortCode,
            number: bankAccountNumber,
          }),
        );
      } catch {
        // ignore
      }

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
        <Button size="sm" disabled={disabled} title={disabled ? disabledReason : undefined}>
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Pupil (optional)</Label>
                <QuickAddPupilButton onCreated={handlePupilCreated} />
              </div>
              {pupils.length > 0 ? (
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
              ) : (
                <p className="text-xs text-muted-foreground">
                  No current pupils — add one above, or enter recipient details manually.
                </p>
              )}
            </div>

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
              <div className="grid grid-cols-12 gap-2 px-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                <div className="col-span-6">Name</div>
                <div className="col-span-2 text-right">Quantity</div>
                <div className="col-span-3 text-right">Value (£)</div>
                <div className="col-span-1" />
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <Input
                      className="col-span-6"
                      placeholder="e.g. Driving lesson"
                      value={it.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                    />
                    <Input
                      className="col-span-2 text-right"
                      type="number"
                      min={1}
                      step={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                    />
                    <Input
                      className="col-span-3 text-right"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
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
                <p className="text-xs text-muted-foreground">
                  Platform Service Fee is £1 per invoice.
                </p>
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Show bank details on invoice</Label>
                  <p className="text-xs text-muted-foreground">
                    Appended to the invoice notes so the recipient can pay by bank transfer.
                  </p>
                </div>
                <Switch checked={showBank} onCheckedChange={setShowBank} />
              </div>
              {showBank && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Account name</Label>
                    <Input
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="e.g. J Smith Driving School"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sort code</Label>
                    <Input
                      value={bankSortCode}
                      onChange={(e) => setBankSortCode(e.target.value)}
                      placeholder="00-00-00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account number</Label>
                    <Input
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="12345678"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Payment reference (optional)</Label>
                    <Input
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      placeholder="e.g. pupil name or invoice number"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div>
                <Label className="text-sm">Payment methods</Label>
                <p className="text-xs text-muted-foreground">
                  Choose which options the pupil can use on the Square payment page. Card is always enabled.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Card</div>
                  <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Clearpay — pay in 3</div>
                  <div className="text-xs text-muted-foreground">
                    Buyer eligibility and order amount are decided by Clearpay at checkout.
                  </div>
                </div>
                <Switch checked={allowClearpay} onCheckedChange={setAllowClearpay} />
              </div>
              {instructorKlarnaEnabled ? (
                <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">Klarna — pay in 3 / pay later</div>
                    <div className="text-xs text-muted-foreground">
                      Sends a separate Klarna payment link alongside the Square invoice. Eligibility decided by Klarna.
                    </div>
                  </div>
                  <Switch checked={allowKlarna} onCheckedChange={setAllowKlarna} />
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground px-1">
                  Enable Klarna in your payment settings to offer it on invoices.
                </p>
              )}
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

            {showBank && buildBankBlock() && (
              <div className="px-5 py-3 border-t">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Pay by bank transfer
                </div>
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans">
{buildBankBlock()}
                </pre>
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
