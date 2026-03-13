import { Info } from "lucide-react";

interface AdminFeeBreakdownProps {
  baseAmount: number;
  adminFee: number;
  totalCharge: number;
  hasFee: boolean;
}

/**
 * Displays admin fee breakdown when a fee is applied to the payment.
 */
export function AdminFeeBreakdown({ baseAmount, adminFee, totalCharge, hasFee }: AdminFeeBreakdownProps) {
  if (!hasFee || adminFee <= 0) return null;

  return (
    <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5 text-sm">
      <div className="flex items-center justify-between text-muted-foreground">
        <span>Lesson credit</span>
        <span>£{baseAmount.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="flex items-center gap-1">
          Admin fee
          <Info className="h-3 w-3" />
        </span>
        <span>£{adminFee.toFixed(2)}</span>
      </div>
      <div className="border-t border-border pt-1.5 flex items-center justify-between font-semibold text-foreground">
        <span>Total</span>
        <span>£{totalCharge.toFixed(2)}</span>
      </div>
    </div>
  );
}
