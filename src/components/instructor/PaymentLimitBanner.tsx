import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PaymentLimitBannerProps {
  remaining: number;
  limit: number;
  isAtLimit: boolean;
  onSkip?: () => void;
}

export function PaymentLimitBanner({ remaining, limit, isAtLimit, onSkip }: PaymentLimitBannerProps) {
  const navigate = useNavigate();

  if (isAtLimit) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Crown className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Monthly limit reached</p>
          <p className="text-xs text-muted-foreground mt-1">
            You've used all {limit} free payments this month. Upgrade to record unlimited payments.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/instructor/plans")} className="gap-1.5">
          <Crown className="h-3.5 w-3.5" /> Upgrade to All-In
        </Button>
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-muted/50 rounded-none px-3 py-2 text-xs">
      <span className="text-muted-foreground">
        Free payments: <strong className="text-foreground">{remaining}</strong> of {limit} remaining
      </span>
      <button onClick={() => navigate("/instructor/plans")} className="text-primary font-medium hover:underline">
        Upgrade
      </button>
    </div>
  );
}
