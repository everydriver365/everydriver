import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, ShoppingBag, Receipt, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
}

interface UpsellItem {
  id: string;
  name: string;
  price: number;
}

interface OrderReviewSummaryProps {
  courseName: string;
  courseHours: number;
  coursePrice: number;
  selectedSlots: SelectedSlot[];
  selectedUpsells: UpsellItem[];
  upsellTotal: number;
  depositEnabled: boolean;
  depositAmount: number;
  paymentOption: "full" | "deposit";
  adminFee?: number;
  hasFee?: boolean;
}

export function OrderReviewSummary({
  courseName,
  courseHours,
  coursePrice,
  selectedSlots,
  selectedUpsells,
  upsellTotal,
  depositEnabled,
  depositAmount,
  paymentOption,
  adminFee = 0,
  hasFee = false,
}: OrderReviewSummaryProps) {
  const [expanded, setExpanded] = useState(true);

  const payableAmount =
    paymentOption === "deposit" && depositEnabled ? depositAmount : coursePrice;
  const totalWithExtras = payableAmount + upsellTotal + (hasFee ? adminFee : 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Receipt className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">Review Your Booking</p>
            <p className="text-[11px] text-muted-foreground">
              £{totalWithExtras.toFixed(2)} total
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t pt-3">
              {/* Course */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {courseName} ({courseHours}h)
                </span>
                <span className="font-medium">£{coursePrice.toFixed(2)}</span>
              </div>

              {/* Scheduled Lessons Summary */}
              {selectedSlots.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Scheduled Lessons ({selectedSlots.length})
                  </p>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {selectedSlots.map((slot, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5"
                      >
                        <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>
                          {format(slot.date, "EEE d MMM")} · {slot.startTime}–
                          {slot.endTime} ({slot.duration}h)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upsells */}
              {selectedUpsells.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3 w-3" />
                    Extras
                  </p>
                  {selectedUpsells.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{u.name}</span>
                      <span>£{u.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin Fee */}
              {hasFee && adminFee > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Service fee</span>
                  <span>£{adminFee.toFixed(2)}</span>
                </div>
              )}

              {/* Deposit toggle info */}
              {depositEnabled && paymentOption === "deposit" && (
                <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-lg px-3 py-2">
                  Paying deposit of £{depositAmount.toFixed(2)} — remaining
                  balance due before first lesson
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span>
                  {paymentOption === "deposit" && depositEnabled
                    ? "Deposit Total"
                    : "Total"}
                </span>
                <span className="text-lg">£{totalWithExtras.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
