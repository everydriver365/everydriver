import { useState, useEffect } from "react";
import { Smartphone, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "tracker_reminder_dismissed";

interface TrackerReminderBannerProps {
  lessonId: string;
  minutesUntil: number;
  onAutoHide?: () => void;
}

// Check if a specific lesson has been dismissed
const isDismissed = (lessonId: string): boolean => {
  try {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "{}");
    return dismissed[lessonId] === true;
  } catch {
    return false;
  }
};

// Dismiss reminder for a specific lesson
const dismissReminder = (lessonId: string) => {
  try {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "{}");
    
    // Clean up old entries (keep only entries from today)
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem("tracker_reminder_date");
    
    if (storedDate !== today) {
      // New day - clear old dismissals
      localStorage.setItem(DISMISSED_KEY, JSON.stringify({ [lessonId]: true }));
      localStorage.setItem("tracker_reminder_date", today);
    } else {
      dismissed[lessonId] = true;
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  } catch {
    // Fallback: just set the single value
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({ [lessonId]: true }));
  }
};

// Tracker uses hardware - no app to open
const openTrackerApp = () => {
  // No-op - hardware trackers, no app to open
};

export function TrackerReminderBanner({ 
  lessonId, 
  minutesUntil,
  onAutoHide 
}: TrackerReminderBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this lesson's reminder was already dismissed
    if (!isDismissed(lessonId)) {
      setIsVisible(true);
    }
  }, [lessonId]);

  const handleDismiss = () => {
    dismissReminder(lessonId);
    setIsVisible(false);
    onAutoHide?.();
  };

  const handleOpenTracker = () => {
    openTrackerApp();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="mx-4 mt-4"
      >
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-none p-3 shadow-sm">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 p-2 bg-amber-100 dark:bg-amber-800/30 rounded-none">
              <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Open Tracker
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Start the app to record your lesson in {minutesUntil} min
                  </p>
                </div>
                
                {/* Dismiss button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-800/30 flex-shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Open Tracker Button */}
              <Button
                size="sm"
                className="mt-2 h-8 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
                onClick={handleOpenTracker}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open Tracker
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

