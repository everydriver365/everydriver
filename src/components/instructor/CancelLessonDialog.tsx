import { useState, useEffect, useMemo } from "react";
import { Loader2, AlertTriangle, X, Save } from "lucide-react";
import { CancellationBackfillSheet } from "./CancellationBackfillSheet";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { triggerAutomations } from "@/utils/triggerAutomations";
import { format, parseISO } from "date-fns";

interface CancelLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  pupilId: string;
  pupilName: string;
  amountDue: number;
  pupilBalance: number;
  durationMinutes: number;
  lessonDate: string;
  lessonTime: string;
  endTime?: string;
  instructorId: string;
  onCancelled: () => void;
}

type ChargeOption = "no_charge" | "charge_half" | "charge";

const REASONS = [
  "Pupil unwell",
  "Instructor unwell",
  "Personal",
  "Weather",
  "Other",
] as const;
type CancellationReason = (typeof REASONS)[number];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export function CancelLessonDialog({
  open,
  onOpenChange,
  lessonId,
  pupilId,
  pupilName,
  amountDue,
  pupilBalance,
  durationMinutes,
  lessonDate,
  lessonTime,
  endTime,
  instructorId,
  onCancelled,
}: CancelLessonDialogProps) {
  const [chargeOption, setChargeOption] = useState<ChargeOption>("no_charge");
  const [cancelling, setCancelling] = useState(false);
  const [showBackfill, setShowBackfill] = useState(false);
  const [chargePercent, setChargePercent] = useState(100);
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [cancellationNote, setCancellationNote] = useState("");
  const [focused, setFocused] = useState(false);
  const [notifyPupil, setNotifyPupil] = useState(true);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  useEffect(() => {
    const fetchPolicy = async () => {
      const { data } = await supabase
        .from("instructors")
        .select("cancellation_charge_percent")
        .eq("id", instructorId)
        .single();
      if (data?.cancellation_charge_percent != null) {
        setChargePercent(data.cancellation_charge_percent);
      }
    };
    if (open) {
      fetchPolicy();
      setSelectedReason(null);
      setCancellationNote("");
      setChargeOption("no_charge");
    }
  }, [open, instructorId]);

  const fullChargeAmount = Math.round((amountDue * chargePercent / 100) * 100) / 100;
  const halfChargeAmount = Math.round((amountDue * 0.5) * 100) / 100;
  const chargeAmount =
    chargeOption === "charge"
      ? fullChargeAmount
      : chargeOption === "charge_half"
      ? halfChargeAmount
      : 0;

  const dateObj = useMemo(() => {
    try {
      return parseISO(lessonDate);
    } catch {
      return new Date();
    }
  }, [lessonDate]);
  const initials = getInitials(pupilName);
  const firstName = pupilName.split(/\s+/)[0] || pupilName;

  const handleCancel = async () => {
    if (!selectedReason) return;
    setCancelling (true);
    try {
      const reasonText = [selectedReason, cancellationNote.trim()]
        .filter(Boolean)
        .join(" — ");

      const { error: lessonError } = await supabase
        .from("scheduled_lessons")
        .update({
          status: "cancelled",
          cancelled_by: "instructor",
          cancellation_reason: reasonText || selectedReason,
          cancellation_note: cancellationNote.trim() || null,
          cancelled_at: new Date().toISOString(),
        } as any)
        .eq("id", lessonId);

      if (lessonError) throw lessonError;

      if (chargeAmount > 0) {
        const newBalance = pupilBalance - chargeAmount;
        const { error: balanceError } = await supabase
          .from("pupils")
          .update({ account_balance: newBalance })
          .eq("id", pupilId);

        if (balanceError) throw balanceError;

        const pct = chargeOption === "charge" ? chargePercent : 50;
        await supabase.from("payment_history").insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          amount: -chargeAmount,
          payment_method: "Cancellation Fee",
          notes: `Cancellation charge (${pct}%) for ${lessonDate} ${lessonTime}`,
        });

        invalidatePaymentQueries({ pupilId, instructorId });

        toast({
          title: "Lesson cancelled with charge",
          description: `£${chargeAmount.toFixed(2)} deducted from ${pupilName}'s balance`,
        });
      } else {
        toast({
          title: "Lesson cancelled",
          description: `No charge applied to ${pupilName}`,
        });
      }

      try {
        const { data: waitlistResult } = await supabase.functions.invoke("process-cancellation-waitlist", {
          body: {
            instructorId,
            lessonDate,
            startTime: lessonTime,
            endTime: endTime || lessonTime,
            durationMins: durationMinutes,
            originalLessonId: lessonId,
          },
        });

        if (waitlistResult?.offersCreated > 0) {
          toast({
            title: "Waitlist matches found!",
            description: `${waitlistResult.offersCreated} pupil(s) matched. Review offers in your Gaps section.`,
          });
        }
      } catch (waitlistError) {
        console.error("Failed to process waitlist:", waitlistError);
      }

      if (notifyPupil) {
        try {
          await supabase.functions.invoke("notify-instructor", {
            body: {
              instructorId,
              type: "cancellation",
              pupilName,
              lessonDate,
              lessonTime,
              chargeApplied: chargeAmount > 0,
            },
          });
        } catch (smsError) {
          console.error("Failed to send cancellation SMS:", smsError);
        }
      }

      triggerAutomations({
        triggerType: "cancellation",
        instructorId,
        pupilId,
        pupilName,
      });

      onCancelled();
      onOpenChange(false);
      setShowBackfill(true);
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      toast({
        title: "Error",
        description: "Failed to cancel lesson",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="p-0 border-0 max-w-md w-[calc(100%-24px)] gap-0 overflow-hidden [&>button]:hidden"
          style={{ borderRadius: 24, background: "#FFFFFF" }}
        >
          {/* Top accent bar */}
          <div style={{ height: 4, background: "#B23A3F" }} />

          {/* Header */}
          <div style={{ padding: "16px 18px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#FFF0F0",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} color="#B23A3F" strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.2 }}>
                  Cancel lesson
                </div>
                <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 1 }}>
                  {format(dateObj, "EEE")} {format(dateObj, "d MMM")} · {lessonTime.slice(0, 5)} · {durationMinutes} min
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#F2F4F8",
                  border: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={14} color="#5B6B8A" strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "14px 18px 0", maxHeight: "70vh", overflowY: "auto" }}>
            {/* Pupil identity strip */}
            <div
              style={{
                background: "#F2F4F8",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#B23A3F",
                  color: "#FFF",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{pupilName}</div>
                <div style={{ fontSize: 11, color: "#8E8E93" }}>
                  Standard Lesson · £{amountDue.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Section 1 — Cancellation policy */}
            <SectionLabel>CANCELLATION POLICY</SectionLabel>

            <PolicyOption
              selected={chargeOption === "no_charge"}
              onSelect={() => setChargeOption("no_charge")}
              label="No charge"
              subtitle="The lesson is cancelled and no fee is applied"
              feeLabel="£0"
              feeBg="#E8F8ED"
              feeColor="#1A7A3C"
            />
            <PolicyOption
              selected={chargeOption === "charge_half"}
              onSelect={() => setChargeOption("charge_half")}
              label="50% fee"
              subtitle="Charge half the lesson fee as a late cancellation"
              feeLabel={`£${halfChargeAmount.toFixed(2)}`}
              feeBg="#FFF6E6"
              feeColor="#B45309"
            />
            <PolicyOption
              selected={chargeOption === "charge"}
              onSelect={() => setChargeOption("charge")}
              label={`Full fee (${chargePercent}%)`}
              subtitle={`Deduct from ${firstName}'s balance`}
              feeLabel={`£${fullChargeAmount.toFixed(2)}`}
              feeBg="#FFF0F0"
              feeColor="#B23A3F"
              extra={
                <div
                  style={{
                    marginTop: 6,
                    marginLeft: 26,
                    background: "#FFF0F0",
                    borderRadius: 8,
                    padding: "5px 10px",
                    alignSelf: "flex-start",
                    display: "inline-block",
                  }}
                >
                  <span style={{ fontSize: 10, color: "#B23A3F", fontWeight: 600 }}>
                    Balance: £{pupilBalance.toFixed(2)} → £{(pupilBalance - fullChargeAmount).toFixed(2)}
                  </span>
                </div>
              }
            />

            {/* Section 2 — Cancellation reason */}
            <div style={{ height: 6 }} />
            <SectionLabel>CANCELLATION REASON</SectionLabel>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {REASONS.map((reason) => {
                const isSel = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setSelectedReason(reason);
                      setCancellationNote(reason === "Other" ? "" : reason);
                    }}
                    style={{
                      background: isSel ? "#FFF0F0" : "#F2F4F8",
                      borderRadius: 20,
                      padding: "5px 11px",
                      border: isSel ? "1.5px solid #B23A3F" : "0",
                      fontSize: 11,
                      fontWeight: isSel ? 600 : 500,
                      color: isSel ? "#B23A3F" : "#5B6B8A",
                      cursor: "pointer",
                    }}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>

            {!selectedReason && (
              <div style={{ fontSize: 11, color: "#B23A3F", marginBottom: 8 }}>
                Please select a reason to continue
              </div>
            )}

            <div
              style={{
                borderRadius: 12,
                border: focused ? "1.5px solid #B23A3F" : "1px solid #E0E5EE",
                marginBottom: 8,
              }}
            >
              <div style={{ background: "#FFF", borderRadius: 11, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", marginBottom: 5 }}>
                  Additional notes (optional)
                </div>
                <textarea
                  value={cancellationNote}
                  onChange={(e) => setCancellationNote(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Add more detail..."
                  style={{
                    width: "100%",
                    border: 0,
                    outline: "none",
                    fontSize: 12,
                    color: "#1A1A1A",
                    lineHeight: "18px",
                    minHeight: 48,
                    resize: "vertical",
                    background: "transparent",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 14,
              }}
            >
              <Save size={11} color="#0A0F29" />
              <span style={{ fontSize: 10, color: "#0A0F29", fontWeight: 500 }}>
                Saved to {firstName}'s lesson record
              </span>
            </div>

            {/* Section 3 — Notify pupil */}
            <div
              style={{
                background: "#F2F4F8",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
                  Notify {firstName} by SMS
                </div>
                <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>
                  Send cancellation message
                </div>
              </div>
              <Switch checked={notifyPupil} onCheckedChange={setNotifyPupil} />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "0 18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={!selectedReason || cancelling}
              style={{
                background: selectedReason && !cancelling ? "#B23A3F" : "#C7C7CC",
                borderRadius: 14,
                padding: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: 0,
                cursor: selectedReason && !cancelling ? "pointer" : "default",
                width: "100%",
              }}
            >
              {cancelling && <Loader2 className="h-4 w-4 animate-spin" color="#FFF" />}
              <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF" }}>
                Cancel lesson
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                background: "#FFF",
                borderRadius: 14,
                border: "0.5px solid #0A0F29",
                padding: 14,
                cursor: "pointer",
                width: "100%",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0A0F29" }}>
                Keep lesson
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CancellationBackfillSheet
        open={showBackfill}
        onOpenChange={setShowBackfill}
        instructorId={instructorId}
        lessonDate={lessonDate}
        startTime={lessonTime}
        endTime={endTime || lessonTime}
        durationMinutes={durationMinutes}
        originalLessonId={lessonId}
      />
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#8E8E93",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

interface PolicyOptionProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  subtitle: string;
  feeLabel: string;
  feeBg: string;
  feeColor: string;
  extra?: React.ReactNode;
}

function PolicyOption({
  selected,
  onSelect,
  label,
  subtitle,
  feeLabel,
  feeBg,
  feeColor,
  extra,
}: PolicyOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        background: "#FFF",
        border: selected ? "2px solid #0A0F29" : "0.5px solid #E0E5EE",
        borderRadius: 14,
        padding: 11,
        marginBottom: 7,
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        display: "block",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: selected ? "#0A0F29" : "transparent",
            border: selected ? "0" : "1.5px solid #C7C7CC",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {selected && (
            <span
              style={{ width: 7, height: 7, borderRadius: 4, background: "#FFF" }}
            />
          )}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", flex: 1 }}>
          {label}
        </span>
        <span
          style={{
            background: feeBg,
            color: feeColor,
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 999,
            padding: "3px 9px",
          }}
        >
          {feeLabel}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#5B6B8A",
          paddingLeft: 26,
          marginTop: 4,
        }}
      >
        {subtitle}
      </div>
      {extra}
    </button>
  );
}
