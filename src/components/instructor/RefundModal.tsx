import { useEffect, useMemo, useState } from "react";
import { Loader2, Banknote, CreditCard, ArrowLeftRight, Zap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";
import { titleCaseName } from "@/lib/titleCase";

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
}

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  pupils: Pupil[];
  squareConnected?: boolean;
  onRefunded?: () => void;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const C = {
  bg: "#FFFFFF",
  hairline: "#E5E5EA",
  text: "#000000",
  muted: "#6E6E73",
  link: "#2B7BC8",
  red: "#C8434F",
};



type RefundMethod = "square" | "cash" | "card" | "bank_transfer";

const METHOD_OPTIONS_BASE = [
  { value: "cash" as const, label: "Cash", Icon: Banknote },
  { value: "card" as const, label: "Card", Icon: CreditCard },
  { value: "bank_transfer" as const, label: "Transfer", Icon: ArrowLeftRight },
];
const SQUARE_OPTION = { value: "square" as const, label: "Square", Icon: Zap };

interface SquarePayment {
  id: string;
  amount: number;
  recorded_at: string;
  notes: string | null;
  payout_status: string | null;
}

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.005;
  return `£${isWhole ? Math.round(rounded).toString() : rounded.toFixed(2)}`;
}

export function RefundModal({
  open,
  onOpenChange,
  instructorId,
  pupils,
  squareConnected = false,
  onRefunded,
}: RefundModalProps) {
  const [pupilId, setPupilId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<RefundMethod>(squareConnected ? "square" : "cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [squarePayments, setSquarePayments] = useState<SquarePayment[]>([]);
  const [selectedSquarePaymentId, setSelectedSquarePaymentId] = useState<string>("");
  const [loadingPayments, setLoadingPayments] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  const sortedPupils = useMemo(
    () => [...pupils].sort((a, b) => a.name.localeCompare(b.name)),
    [pupils]
  );
  const pupil = pupils.find((p) => p.id === pupilId);
  const credit = pupil && (pupil.account_balance || 0) > 0 ? pupil.account_balance! : 0;

  const parsedAmount = parseFloat(amount) || 0;
  const selectedSquarePayment = squarePayments.find((p) => p.id === selectedSquarePaymentId);
  const canSave =
    !!pupilId &&
    parsedAmount > 0 &&
    !saving &&
    (method !== "square" || !!selectedSquarePaymentId);

  const METHOD_OPTIONS = squareConnected ? [SQUARE_OPTION, ...METHOD_OPTIONS_BASE] : METHOD_OPTIONS_BASE;

  // Fetch this pupil's refundable Square payments when in Square mode
  useEffect(() => {
    if (!open || method !== "square" || !pupilId || !instructorId) {
      setSquarePayments([]);
      setSelectedSquarePaymentId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingPayments(true);
      const { data } = await supabase
        .from("payment_history")
        .select("id, amount, recorded_at, notes, payout_status, payment_method")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .gt("amount", 0)
        .ilike("payment_method", "square%")
        .not("payout_status", "in", "(refunded)")
        .order("recorded_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      const rows = (data || []).filter((r: any) => /ID:\s*[A-Za-z0-9_-]+/.test(r.notes || ""));
      setSquarePayments(rows as SquarePayment[]);
      setLoadingPayments(false);
    })();
    return () => { cancelled = true; };
  }, [open, method, pupilId, instructorId]);

  // Auto-fill amount when a Square payment is picked
  useEffect(() => {
    if (selectedSquarePayment) {
      setAmount(String(selectedSquarePayment.amount));
    }
  }, [selectedSquarePaymentId]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setPupilId("");
      setAmount("");
      setMethod(squareConnected ? "square" : "cash");
      setNotes("");
      setSelectedSquarePaymentId("");
      setSquarePayments([]);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!pupilId) {
      toast.error("Select a pupil");
      return;
    }
    if (parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      if (method === "square") {
        if (!selectedSquarePaymentId) {
          toast.error("Pick the Square payment to refund");
          setSaving(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("square-refund", {
          body: {
            paymentHistoryId: selectedSquarePaymentId,
            amount: Math.abs(parsedAmount),
            reason: notes.trim() || undefined,
          },
        });
        if (error || (data as any)?.error) {
          throw new Error((data as any)?.error || error?.message || "Square refund failed");
        }
        toast.success(
          `${formatCurrency(parsedAmount)} refunded via Square to ${titleCaseName(pupil?.name || "pupil")}`
        );
      } else {
        const { error: histErr } = await (supabase as any)
          .from("payment_history")
          .insert({
            pupil_id: pupilId,
            instructor_id: instructorId,
            amount: -Math.abs(parsedAmount),
            payment_method: method,
            notes: `Refund${notes.trim() ? ` — ${notes.trim()}` : ""}`,
          });
        if (histErr) throw histErr;

        const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
          p_pupil_id: pupilId,
          p_amount: -Math.abs(parsedAmount),
        });
        if (balErr) throw balErr;

        toast.success(
          `${formatCurrency(parsedAmount)} refunded to ${titleCaseName(pupil?.name || "pupil")}`
        );
      }
      invalidatePaymentQueries({ pupilId, instructorId });
      handleClose(false);
      onRefunded?.();
    } catch (e: any) {
      console.error("Refund error:", e);
      toast.error(e?.message || "Failed to process refund");
    } finally {
      setSaving(false);
    }
  };

  const headerBtn = (disabled: boolean): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    padding: 4,
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 500,
    color: C.link,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    fontFamily: FONT_STACK,
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[420px] max-w-[92vw] p-0 gap-0 overflow-hidden border-0"
        style={{ background: C.bg, borderRadius: 16, fontFamily: FONT_STACK }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `0.5px solid ${C.hairline}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button type="button" onClick={() => handleClose(false)} style={headerBtn(false)}>
            Cancel
          </button>
          <h2
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 15,
              fontWeight: 500,
              color: C.text,
              letterSpacing: "-0.2px",
              margin: 0,
            }}
          >
            Refund payment
          </h2>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave}
            style={headerBtn(!canSave)}
          >
            {saving ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </span>
            ) : (
              "Refund"
            )}
          </button>
        </div>

        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {/* Pupil */}
          <section>
            <EyebrowLabel>Pupil</EyebrowLabel>
            <Select value={pupilId} onValueChange={setPupilId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a pupil" />
              </SelectTrigger>
              <SelectContent>
                {sortedPupils.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {titleCaseName(p.name)}
                    {(p.account_balance || 0) !== 0 &&
                      ` · ${formatCurrency(Math.abs(p.account_balance || 0))} ${
                        (p.account_balance || 0) > 0 ? "credit" : "owed"
                      }`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pupil && credit > 0 && (
              <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                Available credit: {formatCurrency(credit)}
              </p>
            )}
          </section>

          {/* Amount */}
          <section>
            <EyebrowLabel>Amount</EyebrowLabel>
            <div
              style={{
                background: C.bg,
                border: `0.5px solid ${C.hairline}`,
                borderRadius: 12,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  color: C.muted,
                  letterSpacing: "-0.5px",
                  lineHeight: 1,
                }}
              >
                £
              </span>
              <input
                inputMode="decimal"
                type="text"
                value={amount}
                placeholder="0.00"
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                style={{
                  flex: 1,
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 28,
                  fontWeight: 500,
                  color: C.text,
                  letterSpacing: "-0.5px",
                  padding: 0,
                  lineHeight: 1.1,
                  fontFamily: FONT_STACK,
                }}
              />
            </div>
            {credit > 0 && (
              <button
                type="button"
                onClick={() => setAmount(credit.toString())}
                style={{
                  marginTop: 8,
                  background: "#E6F1FB",
                  border: "none",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.link,
                  cursor: "pointer",
                  fontFamily: FONT_STACK,
                }}
              >
                Refund full credit ({formatCurrency(credit)})
              </button>
            )}
          </section>

          {/* Method */}
          <section>
            <EyebrowLabel>Refund method</EyebrowLabel>
            <SegmentedControl<RefundMethod>
              value={method}
              onChange={setMethod}
              ariaLabel="Refund method"
              options={METHOD_OPTIONS.map(({ value, label, Icon }) => ({
                value,
                label: (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon size={14} strokeWidth={1.75} />
                    {label}
                  </span>
                ),
              }))}
            />
          </section>

          {/* Square payment picker */}
          {method === "square" && pupilId && (
            <section>
              <EyebrowLabel>Square payment to refund</EyebrowLabel>
              {loadingPayments ? (
                <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Loading payments…</p>
              ) : squarePayments.length === 0 ? (
                <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
                  No refundable Square payments found for this pupil.
                </p>
              ) : (
                <Select value={selectedSquarePaymentId} onValueChange={setSelectedSquarePaymentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick the original payment" />
                  </SelectTrigger>
                  <SelectContent>
                    {squarePayments.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {formatCurrency(p.amount)} · {new Date(p.recorded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {p.payout_status === "partially_refunded" ? " · partial refund" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </section>
          )}

          {/* Notes */}
          <section>
            <EyebrowLabel>Reason (optional)</EyebrowLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cancelled lesson"
              rows={2}
              style={{
                width: "100%",
                background: C.bg,
                border: `0.5px solid ${C.hairline}`,
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: C.text,
                fontFamily: FONT_STACK,
                outline: "none",
                resize: "none",
              }}
            />
          </section>

          <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
            {method === "square"
              ? "Funds will be returned to the pupil's original card via Square. Their balance is reduced automatically."
              : "This logs a refund and reduces the pupil's balance by the refunded amount. You'll need to return the cash, card or transfer payment to the pupil yourself."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
