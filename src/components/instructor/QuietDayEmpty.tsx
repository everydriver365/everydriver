import { motion } from "framer-motion";
import { Coffee, Sun, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface QuietDayEmptyProps {
  className?: string;
}

const tips = [
  { icon: Coffee, text: "Enjoy a well-deserved break", color: "text-amber-500" },
  { icon: BookOpen, text: "Catch up on CPD training", color: "text-blue-500" },
  { icon: Sun, text: "Perfect day for admin tasks", color: "text-orange-500" },
  { icon: Sparkles, text: "Update your pupil records", color: "text-purple-500" },
];

export function QuietDayEmpty({ className = "" }: QuietDayEmptyProps) {
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  const TipIcon = randomTip.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mx-4 text-center ${className}`}
    >
      <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl border border-dashed border-border p-8">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
        >
          <Coffee className="h-8 w-8 text-primary" />
        </motion.div>
        
        <h3 className="font-semibold text-lg text-foreground mb-2">
          No lessons today
        </h3>
        
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
          <TipIcon className={`h-4 w-4 ${randomTip.color}`} />
          <span className="text-sm">{randomTip.text}</span>
        </div>
        
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
