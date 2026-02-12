import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

interface PaymentStatusBadgeProps {
  balance: number;
  showAmount?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PaymentStatusBadge({
  balance,
  showAmount = true,
  size = "sm",
  className = "",
}: PaymentStatusBadgeProps) {
  const isCredit = balance > 0;
  const isDebt = balance < 0;
  const isCleared = balance === 0;

  if (isCleared) {
    return (
      <Badge
        variant="outline"
        className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ${
          size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
        } ${className}`}
      >
        <CheckCircle className={size === "sm" ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
        Paid
      </Badge>
    );
  }

  if (isCredit) {
    return (
      <Badge
        variant="outline"
        className={`border-[#0075c9]/30 bg-[#0075c9]/10 text-[#0075c9] ${
          size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
        } ${className}`}
      >
        <CreditCard className={size === "sm" ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
        {showAmount ? `£${balance.toFixed(0)} credit` : "Credit"}
      </Badge>
    );
  }

  // isDebt
  return (
    <Badge
      variant="outline"
      className={`border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 ${
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      } ${className}`}
    >
      <AlertTriangle className={size === "sm" ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
      {showAmount ? `£${Math.abs(balance).toFixed(0)} due` : "Due"}
    </Badge>
  );
}
