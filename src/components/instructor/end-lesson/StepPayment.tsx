import { useEffect, useState } from "react";
import { Loader2, Plus, Banknote, CreditCard, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { usePaymentLimit } from "@/hooks/usePaymentLimit";
import { PaymentLimitBanner } from "@/components/instructor/PaymentLimitBanner";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { titleCaseName } from "@/lib/titleCase";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const C = {
  bg: "#FFFFFF",
  surface: "#F8FAFB",
  segBg: "#F2F2F4",
  hairline: "#E5E5EA",
  text: "#000000",
  muted: "#6E6E73",
  link: "#2B7BC8",
  linkTint: "#E6F1FB",
  red: "#C8434F",
  green: "#3B8B3B",
  amber: "#B8801F",
  amberTint: "#FBF1DE",
};

interface StepPaymentProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
  currentBalance: number;
  lessonCost: number;
  lessonId?: string;
  paymentQrUrl?: string | null;
  onPaymentRecorded: () => void;
  onSkip: () => void;
  /** Lesson type label for subtitle. Defaults to "Standard lesson". */
  lessonType?: string;
}

const METHODS = [
  { value: "cash", label: "Cash", Icon: Banknote },
  { value: "card", label: "Card", Icon: CreditCard },
  { value: "bank_transfer", label: "Transfer", Icon: ArrowLeftRight },
] as const;

function needsNameReview(name: string): boolean {
  if (!name) return false;
  const t = name.trim();
  if (!t) return false;
  if (/^(unknown|n\/a|none)$/i.test(t)) return true;
  if (/[<>{}\\]/.test(t)) return true;
  return false;
}

function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatGBP(amount: number): string {
  return `£${Math.abs(Math.round(amount))}`;
}

export function StepPayment({
  pupilId,
  pupilName,
  instructorId,
  currentBalance,
  lessonCost,
  lessonId,
  onPaymentRecorded,
  onSkip,
  lessonType = "Standard lesson",
}: StepPaymentProps) {
  const balanceAfterLesson = currentBalance - lessonCost;
  const outstanding = balanceAfterLesson < 0 ? Math.abs(balanceAfterLesson) : 0;
  const credit = balanceAfterLesson > 0 ? balanceAfterLesson : 0;

  const [amount, setAmount] = useState(outstanding > 0 ? outstanding.toFixed(2) : "");
  const [method, setMethod] = useState<string>("cash");
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const { invalidatePaymentQueries } = usePaymentInvalidation();
  const paymentLimit = usePaymentLimit();

  // Pre-populate when outstanding changes (e.g. after refresh)
  useEffect(() => {
    if (outstanding > 0 && !amount) setAmount(outstanding.toFixed(2));
  }, [outstanding]);

  const displayName = titleCaseName(pupilName) || pupilName;
  const showReview = needsNameReview(pupilName);
  const parsed = parseFloat(amount);
  const canRecord = !saving && !isNaN(parsed) && parsed > 0 && !!method;

  const handleRecord = async () => {
    if (!canRecord) return;
    setSaving(true);
    try {
      const { error: hErr } = await (supabase as any).from("payment_history").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        amount: parsed,
        payment_method: method,
        notes: note.trim() ? note.trim() : "Recorded at end of lesson",
        lesson_id: lessonId ?? null,
      });
      if (hErr) throw hErr;

      const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
        p_pupil_id: pupilId,
        p_amount: parsed,
      });
      if (balErr) throw balErr;

      toast.success(`£${parsed.toFixed(2)} recorded`);
      invalidatePaymentQueries({ pupilId, instructorId });
      onPaymentRecorded();
    } catch (e) {
      console.error(e);
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  // Outstanding label / colour mapping
  const balLabel = "Outstanding";
  let balText: string;
  let balColor: string;
  if (outstanding > 0) {
    balText = formatGBP(outstanding);
    balColor = C.red;
  } else if (credit > 0) {
    balText = `${formatGBP(credit)} credit`;
    balColor = C.green;
  } else {
    balText = "Paid";
    balColor = C.green;
  }

  const defaultChips = [30, 40, 50, 100];

  return (
    <div style={{ fontFamily: FONT_STACK, color: C.text }}>
      {/* Pupil identity bar with outstanding balance */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `0.5px solid ${C.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "-8px -24px 0",
        }}
      >
        <UserAvatar name={displayName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                letterSpacing: -0.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </span>
            {showReview && (
              <span
                style={{
                  background: C.amberTint,
                  color: C.amber,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  padding: "2px 5px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                Review
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            {lessonType} · {formatDuration(60)}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.muted, margin: "0 0 1px" }}>{balLabel}</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: -0.1,
              color: balColor,
              margin: 0,
            }}
          >
            {balText}
          </div>
        </div>
      </div>

      {/* Form content */}
      <div style={{ padding: "16px 0 4px" }}>
        {paymentLimit.isLimited && (
          <div style={{ marginBottom: 16 }}>
            <PaymentLimitBanner
              remaining={paymentLimit.remaining}
              limit={paymentLimit.limit}
              isAtLimit={paymentLimit.isAtLimit}
              onSkip={onSkip}
            />
          </div>
        )}

        {!paymentLimit.isAtLimit && (
          <>
            {/* Section: Amount */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Amount
            </div>

            <div
              style={{
                background: C.bg,
                border: `0.5px solid ${focused ? C.link : C.hairline}`,
                borderRadius: 12,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
                transition: "border-color 0.15s ease",
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  color: C.muted,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                }}
              >
                £
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="0.00"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: FONT_STACK,
                  fontSize: 28,
                  fontWeight: 500,
                  color: C.text,
                  letterSpacing: -0.5,
                  padding: 0,
                  minWidth: 0,
                  width: "100%",
                }}
              />
            </div>

            {/* Quick-amount chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
              {defaultChips.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v.toString())}
                  style={{
                    background: C.segBg,
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontFamily: FONT_STACK,
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.text,
                    cursor: "pointer",
                  }}
                >
                  £{v}
                </button>
              ))}
              {outstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(outstanding.toFixed(2))}
                  style={{
                    background: C.linkTint,
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontFamily: FONT_STACK,
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.link,
                    cursor: "pointer",
                  }}
                >
                  £{Math.round(outstanding)} clear
                </button>
              )}
            </div>

            {/* Section: Payment method */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Payment method
            </div>

            <div
              role="tablist"
              aria-label="Payment method"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${METHODS.length}, minmax(0, 1fr))`,
                gap: 4,
                background: C.segBg,
                borderRadius: 10,
                padding: 4,
                marginBottom: 14,
              }}
            >
              {METHODS.map((m) => {
                const active = method === m.value;
                const Icon = m.Icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setMethod(m.value)}
                    style={{
                      padding: "10px 0",
                      borderRadius: 8,
                      border: "none",
                      background: active ? "#FFFFFF" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      fontFamily: FONT_STACK,
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      color: active ? C.text : C.muted,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={16} strokeWidth={2} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional note */}
            {!showNote ? (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: FONT_STACK,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.link,
                  cursor: "pointer",
                }}
              >
                <Plus size={12} strokeWidth={1.6} />
                Add note
              </button>
            ) : (
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Lesson 12 — paid in full"
                autoFocus
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `0.5px solid ${C.hairline}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontFamily: FONT_STACK,
                  fontSize: 13,
                  color: C.text,
                  outline: "none",
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Footer: Skip + Record & next */}
      <div
        style={{
          padding: "12px 16px",
          background: C.surface,
          borderTop: `0.5px solid ${C.hairline}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          margin: "8px -24px -8px",
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: "transparent",
            border: "none",
            padding: "8px 14px",
            fontFamily: FONT_STACK,
            fontSize: 14,
            fontWeight: 500,
            color: C.muted,
            cursor: "pointer",
          }}
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleRecord}
          disabled={!canRecord}
          style={{
            background: C.link,
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONT_STACK,
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            cursor: canRecord ? "pointer" : "not-allowed",
            opacity: canRecord ? 1 : 0.4,
          }}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Record &amp; next
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
