import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Bell, Link2, Plus, Mail, MessageSquare, MessageCircle,
  Trash2, Check, X, Edit3, Loader2, History, PoundSterling, AlertCircle, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";

interface PaymentRow {
  id: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  recorded_at: string;
  lesson_id: string | null;
}

interface Props {
  pupilId: string;
  pupilName: string;
  pupilPhone?: string | null;
  pupilEmail?: string | null;
  instructorId: string;
  instructorName: string;
  currentBalance: number;
  onChanged?: () => void;
}

// Canonical labels — must match the `validate_payment_method` trigger on payment_history
const METHODS = [
  { value: "Cash", label: "Cash" },
  { value: "Square", label: "Card" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Klarna", label: "Klarna" },
  { value: "Clearpay", label: "Clearpay" },
  { value: "SumUp", label: "SumUp" },
  { value: "GoCardless Bank Pay", label: "Bank Pay" },
  { value: "GoCardless Direct Debit", label: "Direct Debit" },
];

const formatMethod = (m: string) =>
  METHODS.find((x) => x.value === m)?.label || m || "Payment";

export function PupilPaymentsManager({
  pupilId, pupilName, pupilPhone, pupilEmail,
  instructorId, instructorName, currentBalance, onChanged,
}: Props) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMethod, setEditMethod] = useState("Cash");
  const [editNotes, setEditNotes] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeNote, setChargeNote] = useState("");
  const [chargeSaving, setChargeSaving] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  const hasContact = !!(pupilEmail || pupilPhone);

  const notifyChanged = () => {
    invalidatePaymentQueries({ pupilId, instructorId });
    onChanged?.();
  };

  const addCharge = async () => {
    const amt = parseFloat(chargeAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setChargeSaving(true);
    try {
      const { error } = await supabase.rpc("increment_pupil_balance", {
        p_pupil_id: pupilId, p_amount: -amt,
      });
      if (error) throw error;
      // Also log as a negative payment_history row so it shows in the audit trail
      await supabase.from("payment_history").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        amount: -amt,
        payment_method: "Lesson Charge",
        notes: chargeNote.trim() || "Amount owed",
        recorded_at: new Date().toISOString(),
      });
      toast.success(`£${amt.toFixed(2)} added to amount owed`);
      setChargeOpen(false);
      setChargeAmount("");
      setChargeNote("");
      await fetchRows();
      notifyChanged();
    } catch (e: any) {
      console.error(e); toast.error(e?.message || "Failed to add charge");
    } finally { setChargeSaving(false); }
  };

  const outstanding = currentBalance < 0 ? Math.abs(currentBalance) : 0;

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_history")
      .select("id, amount, payment_method, notes, recorded_at, lesson_id")
      .eq("pupil_id", pupilId)
      .is("deleted_at", null)
      .order("recorded_at", { ascending: false })
      .limit(50);
    if (error) { console.error(error); toast.error("Could not load payments"); }
    setPayments((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, [pupilId]);

  const startEdit = (p: PaymentRow) => {
    setEditId(p.id);
    setEditAmount(String(p.amount));
    setEditMethod(p.payment_method || "Cash");
    setEditNotes(p.notes || "");
    setEditDate(p.recorded_at.slice(0, 16));
  };

  const saveEdit = async (p: PaymentRow) => {
    const next = parseFloat(editAmount);
    if (isNaN(next) || next <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const delta = Math.round((next - Number(p.amount)) * 100) / 100;
      const { error } = await supabase.from("payment_history").update({
        amount: next,
        payment_method: editMethod,
        notes: editNotes.trim() || null,
        recorded_at: new Date(editDate).toISOString(),
      }).eq("id", p.id);
      if (error) throw error;
      if (delta !== 0) {
        const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
          p_pupil_id: pupilId, p_amount: delta,
        });
        if (balErr) throw balErr;
      }
      toast.success("Payment updated");
      setEditId(null);
      await fetchRows();
      notifyChanged();
    } catch (e: any) {
      console.error(e); toast.error(e?.message || "Failed to update payment");
    } finally { setSaving(false); }
  };

  const deletePayment = async (p: PaymentRow) => {
    if (!confirm(`Delete £${Number(p.amount).toFixed(2)} payment? This will reverse the balance credit.`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("payment_history")
        .update({ deleted_at: new Date().toISOString() }).eq("id", p.id);
      if (error) throw error;
      const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
        p_pupil_id: pupilId, p_amount: -Number(p.amount),
      });
      if (balErr) throw balErr;
      toast.success("Payment deleted");
      await fetchRows();
      notifyChanged();
    } catch (e: any) {
      console.error(e); toast.error(e?.message || "Failed to delete");
    } finally { setSaving(false); }
  };

  // Generate a real Square hosted checkout link when there's an outstanding balance,
  // otherwise fall back to the generic instructor pay page (same logic as TakePaymentModal).
  const buildPaymentLink = async (): Promise<string> => {
    const fallback = `${window.location.origin}/pay/${instructorId}?pupil=${pupilId}`;
    if (!(outstanding > 0)) return fallback;
    try {
      const orderRef = `PR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const { data, error } = await supabase.functions.invoke("square-checkout", {
        body: {
          amount: outstanding,
          orderReference: orderRef,
          customerEmail: pupilEmail || undefined,
          customerPhone: pupilPhone || undefined,
          customerName: pupilName,
          description: `Payment Request from ${instructorName}`,
          returnUrl: `https://drive365.co.uk/pay/${instructorId}?success=true`,
          cancelUrl: `https://drive365.co.uk/pay/${instructorId}?cancelled=true`,
          instructorId,
          pupilId,
        },
      });
      if (error || !data?.checkoutUrl) {
        throw new Error(data?.error || error?.message || "Failed to generate payment link");
      }
      return data.checkoutUrl as string;
    } catch (e: any) {
      console.error("square-checkout failed, falling back to generic link", e);
      toast.error(e?.message || "Could not create Square link, using generic link");
      return fallback;
    }
  };

  const sendVia = async (
    kind: "reminder" | "link",
    channel: "email" | "sms" | "whatsapp",
  ) => {
    const key = `${kind}-${channel}`;
    if (channel === "email" && !pupilEmail) { toast.error("No email on file"); return; }
    if ((channel === "sms" || channel === "whatsapp") && !pupilPhone) { toast.error("No phone on file"); return; }
    setSending(key);
    try {
      const link = await buildPaymentLink();
      if (channel === "whatsapp") {
        const msg = kind === "reminder"
          ? `Hi ${pupilName}, you have an outstanding balance of £${outstanding.toFixed(2)} for lessons with ${instructorName}. Pay here: ${link}`
          : `Hi ${pupilName}, here's your payment link from ${instructorName}: ${link}`;
        const { data, error } = await supabase.functions.invoke("send-whatsapp", {
          body: { to: pupilPhone, message: msg },
        });
        if (error || (data && data.error)) throw new Error(error?.message || data?.error || "WhatsApp send failed");
        toast.success("WhatsApp sent");
      } else {
        const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
          body: {
            instructorId,
            instructorName,
            pupilIds: [pupilId],
            method: channel,
            paymentLink: link,
          },
        });
        if (error) throw error;
        const sent = (data?.sent ?? 0) + (data?.emailSent ?? 0);
        if (sent > 0) toast.success(`${channel === "email" ? "Email" : "SMS"} sent`);
        else if (data?.skipped > 0) toast.error("Skipped — no contact info");
        else toast.error("Failed to send");
      }
    } catch (e: any) {
      console.error(e); toast.error(e?.message || "Send failed");
    } finally { setSending(null); }
  };

  const copyLink = async () => {
    try {
      const link = await buildPaymentLink();
      await navigator.clipboard.writeText(link);
      toast.success(outstanding > 0 ? `Square link copied (£${outstanding.toFixed(2)})` : "Link copied");
    } catch (e: any) {
      toast.error(e?.message || "Could not copy link");
    }
  };

  const ChannelMenu = ({ kind }: { kind: "reminder" | "link" }) => (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={() => sendVia(kind, "email")} disabled={!pupilEmail}>
        <Mail className="h-4 w-4 mr-2" /> Email
        {!pupilEmail && <span className="ml-auto text-xs text-muted-foreground">(none)</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => sendVia(kind, "sms")} disabled={!pupilPhone}>
        <MessageSquare className="h-4 w-4 mr-2" /> SMS
        {!pupilPhone && <span className="ml-auto text-xs text-muted-foreground">(none)</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => sendVia(kind, "whatsapp")} disabled={!pupilPhone}>
        <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
        {!pupilPhone && <span className="ml-auto text-xs text-muted-foreground">(none)</span>}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setRecordOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Record payment
        </Button>
        <Button size="sm" variant="outline" onClick={() => setChargeOpen((v) => !v)} className="gap-1.5">
          <Minus className="h-4 w-4" /> Add amount owed
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!!sending || !hasContact}>
              {sending?.startsWith("reminder") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Send reminder
            </Button>
          </DropdownMenuTrigger>
          <ChannelMenu kind="reminder" />
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!!sending || !hasContact}>
              {sending?.startsWith("link") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Send payment link
            </Button>
          </DropdownMenuTrigger>
          <ChannelMenu kind="link" />
        </DropdownMenu>
        <Button size="sm" variant="ghost" className="gap-1.5 ml-auto" onClick={copyLink}>
          <Link2 className="h-4 w-4" /> Copy link
        </Button>
      </div>

      {!hasContact && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            Add an email or phone to {pupilName}'s profile to send reminders or payment links. You can still <strong>Copy link</strong> and share it manually.
          </p>
        </div>
      )}

      {chargeOpen && (
        <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
          <div className="text-sm font-medium">Add an amount owed</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">
              Amount (£)
              <input
                type="number" step="0.01" min="0" autoFocus
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full mt-1 border border-border rounded-md px-2 py-1 text-sm bg-background"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Reason (optional)
              <input
                type="text"
                value={chargeNote}
                onChange={(e) => setChargeNote(e.target.value)}
                placeholder="e.g. Cancellation fee"
                className="w-full mt-1 border border-border rounded-md px-2 py-1 text-sm bg-background"
              />
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => { setChargeOpen(false); setChargeAmount(""); setChargeNote(""); }} disabled={chargeSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={addCharge} disabled={chargeSaving || !chargeAmount}>
              {chargeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Add charge
            </Button>
          </div>
        </div>
      )}


      {/* History */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Payment History</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {payments.length} record{payments.length === 1 ? "" : "s"}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 px-4">
            <PoundSterling className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No payments recorded yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="p-3">
                {editId === p.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-muted-foreground">
                        Amount
                        <div className="flex items-center gap-1 mt-1">
                          <span>£</span>
                          <input
                            type="number" step="0.01" min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full border border-border rounded-md px-2 py-1 text-sm"
                          />
                        </div>
                      </label>
                      <label className="text-xs text-muted-foreground">
                        Method
                        <select
                          value={editMethod}
                          onChange={(e) => setEditMethod(e.target.value)}
                          className="w-full mt-1 border border-border rounded-md px-2 py-1 text-sm bg-background"
                        >
                          {METHODS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="text-xs text-muted-foreground block">
                      Date
                      <input
                        type="datetime-local"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full mt-1 border border-border rounded-md px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="text-xs text-muted-foreground block">
                      Notes
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full mt-1 border border-border rounded-md px-2 py-1 text-sm"
                      />
                    </label>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)} disabled={saving}>
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deletePayment(p)} disabled={saving}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(p)} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`font-semibold text-sm ${Number(p.amount) < 0 ? "text-destructive" : "text-foreground"}`}>
                        {Number(p.amount) < 0 ? "−" : ""}£{Math.abs(Number(p.amount)).toFixed(2)}
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          {Number(p.amount) < 0 ? "Charge" : formatMethod(p.payment_method)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(p.recorded_at), "d MMM yyyy, HH:mm")}
                        {p.notes && <span className="ml-2">• {p.notes}</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <RecordPaymentModal
        open={recordOpen}
        onOpenChange={setRecordOpen}
        pupilId={pupilId}
        pupilName={pupilName}
        instructorId={instructorId}
        currentBalance={currentBalance}
        onPaymentRecorded={() => { fetchRows(); notifyChanged(); }}
      />
    </div>
  );
}
