import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  CreditCard,
  ChevronDown,
  Lock,
  ShieldCheck,
  Info,
  Loader2,
  Banknote,
  Landmark,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORM_FEE_GBP } from "@/lib/pricing/platformFee";

type PaymentMethodId = "card" | "klarna" | "clearpay" | "bank" | "cash";

interface Props {
  courseName: string;
  hours: number;
  instructorName: string;
  locationName: string;
  totalPrice: number;
  upsellTotal: number;
  // deposit
  depositEnabled: boolean;
  depositAmount: number;
  depositDeadlineDays: number;
  paymentOption: "full" | "deposit";
  setPaymentOption: (v: "full" | "deposit") => void;
  // gating
  canSubmit: boolean;
  isPupilDetailsComplete: boolean;
  isFullyScheduled: boolean;
  requiresSlotSelection: boolean;
  hoursRemaining: number;
  // method availability
  klarnaEnabled: boolean;
  clearpayEnabled: boolean;
  instantBankPayEnabled: boolean;
  cashPaymentsEnabled: boolean;
  // gateway health
  squareAvailable: boolean;
  clearpayAvailable: boolean;
  // loading
  isElavonLoading: boolean;
  isKlarnaLoading: boolean;
  isClearpayLoading: boolean;
  isInstantBankPayLoading: boolean;
  isCashProcessing: boolean;
  // handlers
  onCardCheckout: () => void;
  onKlarnaCheckout: () => void;
  onClearpayCheckout: () => void;
  onBankCheckout: () => void;
  onCashCheckout: () => void;
}

export function CoursePaymentBlock({
  courseName,
  hours,
  instructorName,
  locationName,
  totalPrice,
  upsellTotal,
  depositEnabled,
  depositAmount,
  depositDeadlineDays,
  paymentOption,
  setPaymentOption,
  canSubmit,
  isPupilDetailsComplete,
  isFullyScheduled,
  requiresSlotSelection,
  hoursRemaining,
  klarnaEnabled,
  clearpayEnabled,
  instantBankPayEnabled,
  cashPaymentsEnabled,
  squareAvailable,
  clearpayAvailable,
  isElavonLoading,
  isKlarnaLoading,
  isClearpayLoading,
  isInstantBankPayLoading,
  isCashProcessing,
  onCardCheckout,
  onKlarnaCheckout,
  onClearpayCheckout,
  onBankCheckout,
  onCashCheckout,
}: Props) {
  const grandTotal = totalPrice + upsellTotal;
  const [selected, setSelected] = useState<PaymentMethodId>("card");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const firstName = instructorName.split(" ")[0] || instructorName;
  const isDepositSelected = paymentOption === "deposit" && depositEnabled;
  const cardAmount = isDepositSelected ? depositAmount : grandTotal;
  const balanceLater = grandTotal - depositAmount;

  const inlineGatingMessage = !isPupilDetailsComplete
    ? "Complete your details above to continue."
    : requiresSlotSelection && !isFullyScheduled
      ? `Schedule the remaining ${hoursRemaining.toFixed(1)} hour${hoursRemaining === 1 ? "" : "s"} to continue.`
      : null;

  const methods: Array<{
    id: PaymentMethodId;
    show: boolean;
    title: string;
    subtitle: string;
    rightAmount: string;
    rightMeta: string;
  }> = [
    {
      id: "card",
      show: true,
      title: "Card",
      subtitle: "Pay in full or with a deposit · Visa, Mastercard, Amex",
      rightAmount: "",
      rightMeta: "",
    },
    {
      id: "klarna",
      show: klarnaEnabled,
      title: "Klarna",
      subtitle: "Pay in 3 interest-free instalments",
      rightAmount: `3 × £${(grandTotal / 3).toFixed(2)}`,
      rightMeta: "0% interest",
    },
    {
      id: "clearpay",
      show: clearpayEnabled,
      title: "Clearpay",
      subtitle: "Pay in 4 interest-free instalments",
      rightAmount: `4 × £${(grandTotal / 4).toFixed(2)}`,
      rightMeta: "0% interest",
    },
    {
      id: "bank",
      show: instantBankPayEnabled,
      title: "Pay by bank transfer",
      subtitle: "Instant confirmation · Direct from your bank app",
      rightAmount: `£${grandTotal}`,
      rightMeta: "In full",
    },
    {
      id: "cash",
      show: cashPaymentsEnabled,
      title: "Pay your instructor in cash",
      subtitle: `Hand to ${firstName} on your first lesson`,
      rightAmount: `£${grandTotal}`,
      rightMeta: "In person",
    },
  ];

  const isLoadingFor = (id: PaymentMethodId) =>
    (id === "card" && isElavonLoading) ||
    (id === "klarna" && isKlarnaLoading) ||
    (id === "clearpay" && isClearpayLoading) ||
    (id === "bank" && isInstantBankPayLoading) ||
    (id === "cash" && isCashProcessing);

  const ctaFor = (id: PaymentMethodId) => {
    switch (id) {
      case "card":
        return { label: `Pay £${cardAmount} securely`, handler: onCardCheckout, disabledExtra: !squareAvailable };
      case "klarna":
        return { label: `Continue to Klarna · £${grandTotal}`, handler: onKlarnaCheckout, disabledExtra: false };
      case "clearpay":
        return { label: `Continue to Clearpay · £${grandTotal}`, handler: onClearpayCheckout, disabledExtra: !clearpayAvailable };
      case "bank":
        return { label: `Get bank transfer details · £${grandTotal}`, handler: onBankCheckout, disabledExtra: false };
      case "cash":
        return { label: `Confirm cash payment · £${grandTotal}`, handler: onCashCheckout, disabledExtra: false };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      {/* 1. Order summary */}
      <div className="rounded-[12px] border border-border bg-card px-[22px] py-[18px]">
        <div className="flex items-center justify-between gap-4 max-[600px]:flex-col max-[600px]:items-start">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-[10px] bg-[#142040]/[0.06] flex items-center justify-center flex-shrink-0">
              <Receipt className="h-5 w-5 text-[#142040]" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-foreground truncate">
                {hours}-hour {courseName.toLowerCase().includes("intensive") ? "" : "course"}
                {courseName.toLowerCase().includes("intensive") ? "" : ""} · {courseName}
              </div>
              <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                With {instructorName}
                {locationName ? ` · ${locationName}` : ""}
              </div>
            </div>
          </div>
          <div className="text-right max-[600px]:w-full max-[600px]:text-left">
            <div className="text-[24px] font-extrabold leading-none text-foreground">£{grandTotal}</div>
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#142040] hover:underline"
            >
              Breakdown
              <ChevronDown className={cn("h-3 w-3 transition-transform", showBreakdown && "rotate-180")} />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Course ({hours}h)</span><span>£{(totalPrice - PLATFORM_FEE_GBP).toFixed(2)}</span></div>
                {upsellTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Extras</span><span>£{upsellTotal.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Booking fee</span><span>£{PLATFORM_FEE_GBP.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold pt-1.5 border-t border-border"><span>Total</span><span>£{grandTotal}</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Section label */}
      <div className="text-[13px] font-bold text-muted-foreground uppercase tracking-[1.5px] mt-2 mb-3">
        Choose how to pay
      </div>

      {/* 3. Payment methods */}
      <div className="flex flex-col gap-2.5">
        {methods.filter((m) => m.show).map((m) => {
          const isSelected = selected === m.id;
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-[12px] bg-card transition-all",
                isSelected ? "border-2 border-[#142040]" : "border border-border hover:border-foreground/20"
              )}
            >
              <button
                type="button"
                onClick={() => setSelected(m.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    isSelected ? "border-[#142040]" : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-[#142040]" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-foreground">{m.title}</span>
                    {m.id === "card" && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-600 text-white rounded px-1.5 py-0.5">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5 truncate">{m.subtitle}</div>
                </div>
                {isSelected ? (
                  <span className="text-muted-foreground flex-shrink-0">
                    {m.id === "card" && <CreditCard className="h-[22px] w-[22px]" />}
                    {m.id === "klarna" && <CreditCard className="h-[22px] w-[22px]" />}
                    {m.id === "clearpay" && <CreditCard className="h-[22px] w-[22px]" />}
                    {m.id === "bank" && <Landmark className="h-[22px] w-[22px]" />}
                    {m.id === "cash" && <HandCoins className="h-[22px] w-[22px]" />}
                  </span>
                ) : (
                  m.rightAmount && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-[16px] font-extrabold leading-tight">{m.rightAmount}</div>
                      <div className="text-[11px] text-muted-foreground">{m.rightMeta}</div>
                    </div>
                  )
                )}
              </button>

              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-4 pt-4 pb-4 space-y-4">
                      {/* Card-specific: pay in full / deposit */}
                      {m.id === "card" && depositEnabled && (
                        <>
                          <div className="grid grid-cols-2 gap-2.5 max-[480px]:grid-cols-1">
                            <button
                              type="button"
                              onClick={() => setPaymentOption("full")}
                              className={cn(
                                "text-left rounded-[10px] p-3.5 transition-all",
                                paymentOption === "full"
                                  ? "border-2 border-[#142040] bg-[#142040]/[0.04]"
                                  : "border-[1.5px] border-border hover:border-foreground/30"
                              )}
                            >
                              <div className="text-[12px] font-semibold text-muted-foreground">Pay in full</div>
                              <div className="text-[18px] font-extrabold mt-0.5">£{grandTotal}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">One-off payment</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentOption("deposit")}
                              className={cn(
                                "text-left rounded-[10px] p-3.5 transition-all",
                                paymentOption === "deposit"
                                  ? "border-2 border-[#142040] bg-[#142040]/[0.04]"
                                  : "border-[1.5px] border-border hover:border-foreground/30"
                              )}
                            >
                              <div className="text-[12px] font-semibold text-muted-foreground">Pay deposit</div>
                              <div className="text-[18px] font-extrabold mt-0.5">£{depositAmount}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                Today · £{balanceLater} balance later
                              </div>
                            </button>
                          </div>
                          {isDepositSelected && (
                            <div className="flex gap-2.5 rounded-lg bg-amber-50 border border-amber-200 p-3">
                              <Info className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                              <p className="text-[12px] text-amber-900 leading-relaxed">
                                <strong>Balance of £{balanceLater} due {depositDeadlineDays} days before your first lesson.</strong>{" "}
                                If unpaid by then, your booking will be cancelled and the deposit forfeited.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Cash-specific note */}
                      {m.id === "cash" && (
                        <p className="text-[12px] text-muted-foreground">
                          You'll pay £{grandTotal} in cash to {firstName} at the start of your first lesson. Your booking is confirmed now.
                        </p>
                      )}

                      {/* Bank-specific note */}
                      {m.id === "bank" && (
                        <p className="text-[12px] text-muted-foreground">
                          You'll be redirected to your bank app to authorise £{grandTotal}. Confirmation is instant.
                        </p>
                      )}

                      {/* Pay button + inline gating + trust row */}
                      <PayCta
                        method={m.id}
                        canSubmit={canSubmit}
                        loading={isLoadingFor(m.id)}
                        gatingMessage={inlineGatingMessage}
                        cta={ctaFor(m.id)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function PayCta({
  method,
  canSubmit,
  loading,
  gatingMessage,
  cta,
}: {
  method: PaymentMethodId;
  canSubmit: boolean;
  loading: boolean;
  gatingMessage: string | null;
  cta: { label: string; handler: () => void; disabledExtra: boolean };
}) {
  const disabled = !canSubmit || loading || cta.disabledExtra;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={cta.handler}
        disabled={disabled}
        className={cn(
          "w-full rounded-[10px] px-5 py-3.5 text-[14px] font-bold inline-flex items-center justify-center gap-2 transition-colors",
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-[#142040] text-white hover:bg-[#1c2c5a]"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            {cta.label}
          </>
        )}
      </button>
      {!canSubmit && gatingMessage && (
        <p className="text-[12px] text-muted-foreground text-center">{gatingMessage}</p>
      )}
      {canSubmit && method === "card" && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Secure payment · Encrypted end-to-end
        </div>
      )}
    </div>
  );
}
