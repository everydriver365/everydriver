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
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lessonOptions, setLessonOptions] = useState<
    { id: string; label: string; sub: string }[]
  >([]);
  const { invalidatePaymentQueries } = usePaymentInvalidation();
  const paymentLimit = usePaymentLimit();

  // Fetch recent + upcoming lessons for this pupil so the instructor can
  // optionally link the payment to a specific lesson. Pure additive feature —
  // selecting nothing keeps the existing "general top-up" behaviour.
  useEffect(() => {
    if (!open || !pupilId) return;
    let cancelled = false;
    const today = new Date();
    const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    (async () => {
      const { data } = await (supabase as any)
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes")
        .eq("pupil_id", pupilId)
        .gte("lesson_date", fmt(from))
        .lte("lesson_date", fmt(to))
        .order("lesson_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(20);
      if (cancelled) return;
      const opts = (data || []).map((l: any) => {
        const date = new Date(`${l.lesson_date}T${l.start_time ?? "00:00"}`);
        const datePart = date.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const timePart = (l.start_time || "").slice(0, 5);
        const dur = l.duration_minutes ? `${l.duration_minutes}m` : "";
        return {
          id: l.id as string,
          label: `${datePart}${timePart ? ` · ${timePart}` : ""}`,
          sub: dur,
        };
      });
      setLessonOptions(opts);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, pupilId]);

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
      setLessonId(null);
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
      // 1. Insert payment_history row (with optional lesson link)
      const { error: historyError } = await (supabase as any)
        .from("payment_history")
        .insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          amount: parsedAmount,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
          lesson_id: lessonId,
        });
      if (historyError) throw historyError;

      // 2. Atomically credit the pupil balance via the existing RPC.
      // Using the RPC (instead of read-modify-write) prevents lost updates
      // when two payments land in the same second.
      const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
        p_pupil_id: pupilId,
        p_amount: parsedAmount,
      });
      if (balErr) throw balErr;

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

              {/* For lesson (optional) — gracefully hidden if no lessons in window */}
              {lessonOptions.length > 0 && (
                <section>
                  <EyebrowLabel>
                    For lesson
                    <span style={{ color: C.optional, fontWeight: 400 }}> — optional</span>
                  </EyebrowLabel>
                  <div
                    style={{
                      background: C.surface,
                      border: `0.5px solid transparent`,
                      borderRadius: 10,
                      padding: "4px 6px",
                    }}
                  >
                    <select
                      value={lessonId ?? ""}
                      onChange={(e) => setLessonId(e.target.value || null)}
                      aria-label="Link payment to a specific lesson"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        color: C.text,
                        fontFamily: FONT_STACK,
                        padding: "8px 6px",
                        appearance: "none",
                        WebkitAppearance: "none",
                      }}
                    >
                      <option value="">Not linked to a lesson</option>
                      {lessonOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                          {opt.sub ? ` · ${opt.sub}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
              )}

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
