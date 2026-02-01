import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, PartyPopper } from "lucide-react";

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

    // Fire confetti
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const colors = type === "earnings-milestone" 
      ? ["#10b981", "#34d399", "#6ee7b7"] 
      : type === "streak-milestone"
      ? ["#f59e0b", "#fbbf24", "#fcd34d"]
      : ["#8b5cf6", "#a78bfa", "#c4b5fd"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
    setShowBanner(true);

    // Hide banner after delay
    const timer = setTimeout(() => {
      setShowBanner(false);
      onComplete?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [trigger, type, onComplete]);

  const getIcon = () => {
    switch (type) {
      case "day-complete": return PartyPopper;
      case "streak-milestone": return Trophy;
      case "earnings-milestone": return Star;
      default: return PartyPopper;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case "day-complete": return "Great work today! 🎉";
      case "streak-milestone": return "Incredible streak! 🔥";
      case "earnings-milestone": return "Milestone reached! 💰";
      default: return "Congratulations!";
    }
  };

  const Icon = getIcon();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-sm"
        >
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ repeat: 2, duration: 0.5 }}
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="font-bold text-white text-lg">
                  {message || getDefaultMessage()}
                </p>
                <p className="text-white/80 text-sm">
                  Keep up the amazing work!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
