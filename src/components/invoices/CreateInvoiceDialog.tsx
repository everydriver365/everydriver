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
}

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CreateInvoiceDialog({ onCreated, scope }: Props) {
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
  };

  const submit = async () => {
    if (!recipientEmail || !recipientName) {
      toast({ title: "Recipient name and email are required", variant: "destructive" });
      return;
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
      return;
    }
    if (!dueDate) {
      toast({ title: "Due date is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("square-invoice-manage", {
        body: {
          action: "create",
          pupil_id: pupilId !== "none" ? pupilId : null,
          recipient_email: recipientEmail.trim(),
          recipient_name: recipientName.trim(),
          line_items: cleanItems,
          service_fee_cents: Math.max(0, Math.round(Number(serviceFeePounds) * 100) || 0),
          due_date: dueDate,
          description: description.trim() || undefined,
        },
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> New invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create &amp; send invoice</DialogTitle>
          <DialogDescription>
            {scope === "admin"
              ? "Sends a Square invoice from the platform account."
              : "Sends a Square invoice from your connected Square account."}
          </DialogDescription>
        </DialogHeader>

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
            <span className="font-semibold">
              {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
                total,
              )}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Send invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
