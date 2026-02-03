import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coffee, Sun, BookOpen, Sparkles, ClipboardList, Award, Settings, Sunrise, Sunset, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnimatedCar } from "@/components/ui/ThemeIllustration";

interface QuietDayEmptyProps {
  className?: string;
}

const tips = [
  { icon: Coffee, text: "Enjoy a well-deserved break", color: "text-amber-500" },
  { icon: BookOpen, text: "Catch up on CPD training", color: "text-blue-500" },
  { icon: Sun, text: "Perfect day for admin tasks", color: "text-orange-500" },
  { icon: Sparkles, text: "Update your pupil records", color: "text-purple-500" },
];

const motivationalQuotes = [
  "Every expert was once a beginner.",
  "Success is the sum of small efforts repeated daily.",
  "The road to success is always under construction.",
  "Teaching someone to drive is teaching them freedom.",
  "Great instructors create confident drivers.",
  "Today's rest fuels tomorrow's lessons.",
];

const quickActions = [
  { icon: ClipboardList, label: "Waitlist", route: "/instructor/waitlist", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  { icon: Award, label: "Tests", route: "/instructor/test-results", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  { icon: Settings, label: "Settings", route: "/instructor/settings", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
];

function getTimeOfDay(): "morning" | "day" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getTimeIcon() {
  const time = getTimeOfDay();
  switch (time) {
    case "morning": return Sunrise;
    case "evening": return Sunset;
    case "night": return Moon;
    default: return Sun;
  }
}

export function QuietDayEmpty({ className = "" }: QuietDayEmptyProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  const TipIcon = randomTip.icon;
  const TimeIcon = getTimeIcon();

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mx-4 text-center ${className}`}
    >
      <div className="glass rounded-2xl border border-dashed border-border p-6 overflow-hidden">
        {/* Animated car */}
        <div className="relative h-12 mb-4 overflow-hidden">
          <AnimatedCar className="absolute top-2" />
          {/* Road line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground/20" />
        </div>
        
        {/* Main icon with time awareness */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
        >
          <TimeIcon className="h-8 w-8 text-primary" />
        </motion.div>
        
        <h3 className="font-semibold text-lg text-foreground mb-2">
          No lessons today
        </h3>
        
        {/* Daily tip */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
          <TipIcon className={`h-4 w-4 ${randomTip.color}`} />
          <span className="text-sm">{randomTip.text}</span>
        </div>
        
        {/* Motivational quote with rotation */}
        <motion.p
          key={quoteIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xs text-muted-foreground/70 italic mb-4"
        >
          "{motivationalQuotes[quoteIndex]}"
        </motion.p>
        
        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.route} to={action.route}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${action.color} transition-colors`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{action.label}</span>
                </motion.button>
              </Link>
            );
          })}
        </div>
        
        {/* Main actions */}
        <div className="flex flex-col gap-2">
          <Link to="/instructor/schedule">
            <Button variant="outline" className="w-full">
              View Schedule
            </Button>
          </Link>
          <Link to="/instructor/waitlist">
            <Button variant="ghost" className="w-full text-sm">
              Check Waitlist
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
