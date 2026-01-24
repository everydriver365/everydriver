import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isLoading?: boolean;
  canProceed?: boolean;
  showBack?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  nextLabel = "Continue",
  isLoading = false,
  canProceed = true,
  showBack = true,
}: StepNavigationProps) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t">
      {showBack && onBack ? (
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      ) : (
        <div />
      )}

      {onNext && (
        <Button onClick={onNext} disabled={!canProceed || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
