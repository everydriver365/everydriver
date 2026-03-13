import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingBottomBarProps {
  totalPrice: number;
  upsellTotal: number;
  canSubmit: boolean;
  onPayClick: () => void;
  isPupilDetailsComplete?: boolean;
  isFullyScheduled?: boolean;
  requiresSlotSelection?: boolean;
}

export function BookingBottomBar({ 
  totalPrice, 
  upsellTotal, 
  canSubmit, 
  onPayClick,
  isPupilDetailsComplete = false,
  isFullyScheduled = false,
  requiresSlotSelection = true,
}: BookingBottomBarProps) {
  // Determine contextual button text
  let buttonText = "Fill Your Details";
  let ButtonIcon = CreditCard;
  
  if (!isPupilDetailsComplete) {
    buttonText = "Fill Your Details";
  } else if (requiresSlotSelection && !isFullyScheduled) {
    buttonText = "Choose Your Lessons";
  } else {
    buttonText = `Pay £${totalPrice + upsellTotal}`;
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe"
    >
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-bold">
            £{totalPrice + upsellTotal}
          </p>
          {upsellTotal > 0 && (
            <p className="text-[10px] text-muted-foreground">incl. £{upsellTotal.toFixed(2)} extras</p>
          )}
        </div>
        <Button
          size="lg"
          className="h-12 px-8 shadow-lg"
          disabled={!canSubmit}
          onClick={onPayClick}
        >
          <ButtonIcon className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </div>
    </motion.div>
  );
}
