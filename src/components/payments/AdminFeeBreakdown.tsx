import { Info } from "lucide-react";

interface AdminFeeBreakdownProps {
  baseAmount: number;
  adminFee: number;
  totalCharge: number;
  hasFee: boolean;
  instructorAbsorbs?: number;
  fullFee?: number;
}

/**
 * Displays admin fee breakdown when a fee is applied to the payment.
 * Shows split details when the instructor absorbs part of the fee.
 */
export function AdminFeeBreakdown({ baseAmount, adminFee, totalCharge, hasFee, instructorAbsorbs, fullFee }: AdminFeeBreakdownProps) {
  if (!hasFee || adminFee <= 0) return null;

  const showSplit = instructorAbsorbs != null && instructorAbsorbs > 0 && fullFee != null;

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
      {showSplit && (
        <div className="text-[11px] text-muted-foreground/70 pl-1">
          Full fee £{fullFee!.toFixed(2)} — instructor absorbs £{instructorAbsorbs!.toFixed(2)}
        </div>
      )}
      <div className="border-t border-border pt-1.5 flex items-center justify-between font-semibold text-foreground">
        <span>Total</span>
        <span>£{totalCharge.toFixed(2)}</span>
      </div>
    </div>
  );
}
