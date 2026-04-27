import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Banknote, CreditCard, ArrowLeftRight, Mic } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { usePaymentLimit } from "@/hooks/usePaymentLimit";
import { PaymentLimitBanner } from "@/components/instructor/PaymentLimitBanner";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";
import { titleCaseName } from "@/lib/titleCase";
import { useVoiceToText } from "@/hooks/useVoiceToText";

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  instructorId: string;
  /**
   * Pupil account balance using the existing convention: negative = owed,
   * positive = credit, zero = paid up. Defaults to 0.
   */
  currentBalance?: number;
  onPaymentRecorded?: () => void;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const C = {
  bg: "#FFFFFF",
  surface: "#F2F2F4",
  hairline: "#E5E5EA",
  text: "#000000",
  muted: "#6E6E73",
  link: "#2B7BC8",
  red: "#C8434F",
  green: "#3B8B3B",
  smartTint: "#E6F1FB",
  optional: "#C7C7CC",
};

type PaymentMethod = "cash" | "card" | "bank_transfer";

const METHOD_OPTIONS = [
  { value: "cash" as const, label: "Cash", Icon: Banknote },
  { value: "card" as const, label: "Card", Icon: CreditCard },
  { value: "bank_transfer" as const, label: "Transfer", Icon: ArrowLeftRight },
];

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.005;
  return `£${isWhole ? Math.round(rounded).toString() : rounded.toFixed(2)}`;
}

/* ---------- mic button (mirrors EditPupilSheet pattern) ---------- */
function MicButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const { isListening, isSupported, startListening, stopListening, transcript, resetTranscript } =
    useVoiceToText();
  const lastSentRef = useRef<string>("");

  useEffect(() => {
    if (transcript && transcript !== lastSentRef.current) {
      lastSentRef.current = transcript;
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      aria-label={isListening ? "Stop dictation" : "Start dictation"}
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          lastSentRef.current = "";
          resetTranscript();
          startListening();
        }
      }}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        color: isListening ? C.red : C.muted,
        display: "inline-flex",
        marginTop: 2,
      }}
    >
      <Mic size={16} strokeWidth={1.5} />
    </button>
  );
}

export function RecordPaymentModal({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  instructorId,
  currentBalance = 0,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();
  const paymentLimit = usePaymentLimit();

  const displayName = useMemo(() => titleCaseName(pupilName) || pupilName, [pupilName]);
  // Existing convention: balance < 0 means pupil owes. Outstanding shown positively.
  const outstanding = currentBalance < 0 ? Math.abs(currentBalance) : 0;
  const credit = currentBalance > 0 ? currentBalance : 0;

  const balanceLabel = outstanding > 0
    ? formatCurrency(outstanding)
    : credit > 0
      ? `${formatCurrency(credit)} credit`
      : formatCurrency(0);
  const balanceColour = outstanding > 0 ? C.red : C.green;

  const parsedAmount = parseFloat(amount) || 0;
  const canSave = parsedAmount > 0 && !!paymentMethod && !saving && !paymentLimit.isAtLimit;

  const handleClose = (next: boolean) => {
    if (!next) {
      // Preserve existing reset-on-close behaviour
      setAmount("");
      setPaymentMethod("cash");
      setNotes("");
      setAmountFocused(false);
      setNotesFocused(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const { error: historyError } = await supabase
        .from("payment_history")
        .insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          amount: parsedAmount,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
        });
      if (historyError) throw historyError;

      const newBalance = currentBalance + parsedAmount;
      const { error: updateError } = await supabase
        .from("pupils")
        .update({ account_balance: newBalance })
        .eq("id", pupilId);
      if (updateError) throw updateError;

      toast.success(`${formatCurrency(parsedAmount)} payment recorded for ${displayName}`);
      invalidatePaymentQueries({ pupilId, instructorId });
      handleClose(false);
      onPaymentRecorded?.();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const suggestedAmounts = [30, 40, 50, 100];

  const headerBtn = (disabled: boolean, danger?: boolean): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    padding: 4,
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 500,
    color: danger ? C.muted : C.link,
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
        {/* Header bar */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `0.5px solid ${C.hairline}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => handleClose(false)}
            style={headerBtn(false)}
            aria-label="Cancel"
          >
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
            Record payment
          </h2>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave}
            style={headerBtn(!canSave)}
            aria-label="Save"
          >
            {saving ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>

        {/* Pupil context bar */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `0.5px solid ${C.hairline}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <UserAvatar name={displayName} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 1px",
              }}
            >
              Receiving from
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                letterSpacing: "-0.1px",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </p>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 1px",
              }}
            >
              Outstanding
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: balanceColour,
                letterSpacing: "-0.1px",
                margin: 0,
              }}
            >
              {balanceLabel}
            </p>
          </div>
        </div>

        {/* Form content */}
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
          {paymentLimit.isLimited && (
            <PaymentLimitBanner
              remaining={paymentLimit.remaining}
              limit={paymentLimit.limit}
              isAtLimit={paymentLimit.isAtLimit}
            />
          )}

          {paymentLimit.isAtLimit ? null : (
            <>
              {/* Amount */}
              <section>
                <EyebrowLabel>Amount</EyebrowLabel>
                <div
                  style={{
                    background: C.bg,
                    border: `0.5px solid ${amountFocused ? C.link : C.hairline}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                    transition: "border-color 0.15s",
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
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      setAmount(v);
                    }}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
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
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {suggestedAmounts.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v.toString())}
                      style={{
                        background: C.surface,
                        border: "none",
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.text,
                        cursor: "pointer",
                        fontFamily: FONT_STACK,
                      }}
                    >
                      £{v}
                    </button>
                  ))}
                  {outstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(outstanding.toString())}
                      style={{
                        background: C.smartTint,
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
                      {formatCurrency(outstanding)} full
                    </button>
                  )}
                </div>
              </section>

              {/* Payment method */}
              <section>
                <EyebrowLabel>Payment method</EyebrowLabel>
                <SegmentedControl<PaymentMethod>
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  ariaLabel="Payment method"
                  options={METHOD_OPTIONS.map(({ value, label, Icon }) => ({
                    value,
                    label: (
                      <span
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Icon size={16} strokeWidth={2} />
                        <span>{label}</span>
                      </span>
                    ),
                  }))}
                />
              </section>

              {/* Notes */}
              <section>
                <EyebrowLabel>
                  Notes
                  <span style={{ color: C.optional, fontWeight: 400 }}> — optional</span>
                </EyebrowLabel>
                <div
                  style={{
                    background: C.surface,
                    border: `0.5px solid ${notesFocused ? C.link : "transparent"}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    minHeight: 60,
                    transition: "border-color 0.15s",
                  }}
                >
                  <textarea
                    value={notes}
                    placeholder="e.g. Paid for 2 hours"
                    onChange={(e) => setNotes(e.target.value)}
                    onFocus={() => setNotesFocused(true)}
                    onBlur={() => setNotesFocused(false)}
                    rows={2}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontSize: 13,
                      color: C.text,
                      fontFamily: FONT_STACK,
                      lineHeight: 1.4,
                      padding: 0,
                      maxHeight: 120,
                    }}
                  />
                  <MicButton
                    onTranscript={(t) =>
                      setNotes((prev) => (prev ? `${prev} ${t}`.trim() : t))
                    }
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
