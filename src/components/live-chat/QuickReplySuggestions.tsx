import { motion, AnimatePresence } from "framer-motion";
import { Car, Target, GraduationCap, RefreshCw, Zap, Calendar, User } from "lucide-react";

const STEPS = [
  {
    label: "What type of lessons are you looking for?",
    options: [
      { text: "Standard Lessons", icon: Car },
      { text: "Intensive Course", icon: Target },
      { text: "Test Prep", icon: GraduationCap },
      { text: "Refresher", icon: RefreshCw },
    ],
  },
  {
    label: "Manual or automatic?",
    options: [
      { text: "Manual", icon: Car },
      { text: "Automatic", icon: Car },
      { text: "No Preference", icon: Zap },
    ],
  },
  {
    label: "Do you have an instructor preference?",
    options: [
      { text: "Male Instructor", icon: User },
      { text: "Female Instructor", icon: User },
      { text: "No Preference", icon: Zap },
    ],
  },
  {
    label: "When would you like to start?",
    options: [
      { text: "ASAP", icon: Zap },
      { text: "This Week", icon: Calendar },
      { text: "Next Week", icon: Calendar },
      { text: "Next Month", icon: Calendar },
    ],
  },
  {
    label: "Enter your postcode below to find instructors near you 📍",
    options: [],
  },
];

export const TOTAL_QUICK_REPLY_STEPS = STEPS.length;

interface QuickReplySuggestionsProps {
  currentStep: number;
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function QuickReplySuggestions({
  currentStep,
  onSelect,
  disabled,
}: QuickReplySuggestionsProps) {
  if (currentStep >= STEPS.length) return null;

  const step = STEPS[currentStep];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-3 border-t border-border/50 bg-muted/30"
      >
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {step.label}
        </p>
        {step.options.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {step.options.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.text}
                  onClick={() => onSelect(option.text)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/15 hover:border-primary/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Icon className="h-3 w-3" />
                  {option.text}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
