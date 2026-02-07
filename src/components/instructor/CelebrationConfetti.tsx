import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

export interface CelebrationConfettiProps {
  trigger: boolean;
  type?: "day-complete" | "streak-milestone" | "earnings-milestone";
  message?: string;
  onComplete?: () => void;
}

export function CelebrationConfetti({
  trigger,
  type = "day-complete",
  message,
  onComplete,
}: CelebrationConfettiProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setShowBanner(true);

    const timer = setTimeout(() => {
      setShowBanner(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  const getDefaultMessage = () => {
    switch (type) {
      case "day-complete": return "Great work today!";
      case "streak-milestone": return "Streak milestone reached!";
      case "earnings-milestone": return "Earnings milestone reached!";
      default: return "Well done!";
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-sm"
        >
          <div className="bg-primary text-primary-foreground p-4 border border-border shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {message || getDefaultMessage()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
