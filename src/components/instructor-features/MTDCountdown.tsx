import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MTD_DEADLINE = new Date("2026-04-06T00:00:00Z");

function getTimeRemaining() {
  const now = new Date();
  const diff = MTD_DEADLINE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

interface MTDCountdownProps {
  variant?: "banner" | "full";
}

export function MTDCountdown({ variant = "banner" }: MTDCountdownProps) {
  const [time, setTime] = useState(getTimeRemaining);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  const blocks = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hours" },
    { value: time.minutes, label: "Mins" },
    { value: time.seconds, label: "Secs" },
  ];

  if (variant === "banner") {
    return (
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500/10 via-destructive/10 to-amber-500/10 border border-destructive/20 rounded-xl p-5"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                HMRC MTD Deadline: 6 April 2026
              </p>
              <p className="text-xs text-muted-foreground">
                Digital record-keeping becomes mandatory for self-employed ADIs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blocks.map((b) => (
              <div key={b.label} className="text-center">
                <div className="bg-destructive/10 text-destructive font-bold text-lg rounded-md w-12 h-10 flex items-center justify-center">
                  {String(b.value).padStart(2, "0")}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase">{b.label}</span>
              </div>
            ))}
          </div>

          <Button size="sm" variant="destructive" asChild>
            <Link to="/instructor-app/mtd">
              Get MTD Ready
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </motion.section>
    );
  }

  // Full variant — used on the dedicated MTD page
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center gap-3 sm:gap-5">
        {blocks.map((b) => (
          <motion.div
            key={b.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: blocks.indexOf(b) * 0.1 }}
            className="text-center"
          >
            <div className="bg-destructive text-destructive-foreground font-bold text-3xl sm:text-5xl rounded-xl w-16 sm:w-24 h-16 sm:h-24 flex items-center justify-center shadow-lg">
              {String(b.value).padStart(2, "0")}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground mt-2 block uppercase tracking-wider">{b.label}</span>
          </motion.div>
        ))}
      </div>
      {time.expired && (
        <p className="text-destructive font-semibold text-lg">The MTD deadline has passed!</p>
      )}
    </div>
  );
}
