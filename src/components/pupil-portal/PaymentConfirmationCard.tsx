import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentConfirmationCardProps {
  amount: number;
  remainingBalance: number;
  onDismiss: () => void;
}

export function PaymentConfirmationCard({
  amount,
  remainingBalance,
  onDismiss,
}: PaymentConfirmationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="mx-4 mt-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 relative"
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-emerald-800 dark:text-emerald-200">
            Payment Received
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Thank you for your payment
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Amount paid</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">
            +£{amount.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Remaining balance</span>
          <span
            className={`font-semibold ${
              remainingBalance < 0
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {remainingBalance < 0 ? "-" : ""}£
            {Math.abs(remainingBalance).toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
