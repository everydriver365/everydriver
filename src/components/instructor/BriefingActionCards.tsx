import { forwardRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CreditCard, Cloud, Users, Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefingAction {
  id: string;
  icon: React.ElementType;
  label: string;
  detail: string;
  color: string;
  bgColor: string;
}

interface BriefingActionCardsProps {
  briefingText: string;
  todayLessons?: number;
  expectedEarnings?: number;
  onActionClick?: (actionId: string) => void;
}

function extractActions(text: string): BriefingAction[] {
  const actions: BriefingAction[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("payment") || lower.includes("overdue") || lower.includes("outstanding") || lower.includes("balance")) {
    actions.push({
      id: "payments",
      icon: CreditCard,
      label: "Review payments",
      detail: "Check outstanding balances",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    });
  }

  if (lower.includes("rain") || lower.includes("weather") || lower.includes("storm") || lower.includes("wind") || lower.includes("snow") || lower.includes("ice")) {
    actions.push({
      id: "weather",
      icon: Cloud,
      label: "Weather alert",
      detail: "Notify pupils about conditions",
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-500/10",
    });
  }

  if (lower.includes("cancel") || lower.includes("gap") || lower.includes("waitlist") || lower.includes("available slot")) {
    actions.push({
      id: "waitlist",
      icon: Users,
      label: "Fill gaps",
      detail: "Check waitlist matches",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10",
    });
  }

  if (lower.includes("test") || lower.includes("exam") || lower.includes("driving test")) {
    actions.push({
      id: "tests",
      icon: AlertTriangle,
      label: "Test prep",
      detail: "Pupils with upcoming tests",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "schedule",
      icon: Calendar,
      label: "View schedule",
      detail: "Check today's lessons",
      color: "text-primary",
      bgColor: "bg-primary/10",
    });
  }

  return actions.slice(0, 3);
}

const DAILY_TIPS = [
  "💡 Ask pupils to narrate what they see — builds hazard awareness.",
  "💡 Start each lesson by reviewing the previous session's goals.",
  "💡 Mix busy and quiet roads to build progressive confidence.",
  "💡 Use the 'what if?' technique at junctions for critical thinking.",
  "💡 End lessons with one thing the pupil did well and one to improve.",
  "💡 Encourage pupils to check mirrors before signaling, not after.",
  "💡 Practice parallel parking in different road widths.",
];

export const BriefingActionCards = forwardRef<HTMLDivElement, BriefingActionCardsProps>(({ briefingText, todayLessons, expectedEarnings, onActionClick }, ref) => {
  const actions = extractActions(briefingText);
  const tipIndex = new Date().getDate() % DAILY_TIPS.length;

  return (
    <div ref={ref} className="space-y-3 mt-3">
      {/* Quick Stats Strip */}
      {(todayLessons !== undefined || expectedEarnings !== undefined) && (
        <div className="flex gap-2">
          {todayLessons !== undefined && (
            <div className="flex-1 bg-primary/5 rounded-2xl px-3 py-2 text-center">
              <div className="text-lg font-bold text-foreground">{todayLessons}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Lessons today</div>
            </div>
          )}
          {expectedEarnings !== undefined && (
            <div className="flex-1 bg-emerald-500/5 rounded-2xl px-3 py-2 text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">£{expectedEarnings}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Expected</div>
            </div>
          )}
        </div>
      )}

      {/* Action Cards */}
      <div className="space-y-1.5">
        {actions.map((action, i) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            onClick={() => onActionClick?.(action.id)}
            className={cn(
              "w-full flex items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
              action.bgColor,
              "hover:ring-1 hover:ring-border"
            )}
          >
            <div className={cn("h-8 w-8 rounded-2xl flex items-center justify-center shrink-0", action.bgColor)}>
              <action.icon className={cn("h-4 w-4", action.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("text-xs font-semibold", action.color)}>{action.label}</div>
              <div className="text-[11px] text-muted-foreground">{action.detail}</div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* Daily Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="bg-muted/50 rounded-2xl px-3 py-2 text-[11px] text-muted-foreground leading-relaxed"
      >
        {DAILY_TIPS[tipIndex]}
      </motion.div>
    </div>
  );
});
BriefingActionCards.displayName = "BriefingActionCards";
