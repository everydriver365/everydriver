import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingRecoveryBannerProps {
  onResume: () => void;
  onDiscard: () => void;
}

export function BookingRecoveryBanner({ onResume, onDiscard }: BookingRecoveryBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-4 mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Welcome back! 👋</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            You have an unfinished booking. Pick up where you left off?
          </p>
        </div>
        <button onClick={onDiscard} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={onResume} className="gap-1.5">
          Continue <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          Start Fresh
        </Button>
      </div>
    </motion.div>
  );
}
