import { useRef, useEffect } from "react";
import { format, addDays, isToday, isTomorrow, startOfWeek } from "date-fns";
import { motion } from "framer-motion";

interface ScheduleDayTabsProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function ScheduleDayTabs({ selectedDate, onSelectDate }: ScheduleDayTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Generate 14 days starting from today
  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE");
  };

  const isSelected = (date: Date) => 
    format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

  // Scroll to selected date on mount
  useEffect(() => {
    const selectedIndex = days.findIndex(d => isSelected(d));
    if (scrollRef.current && selectedIndex > 0) {
      const tabWidth = 90; // approximate tab width
      scrollRef.current.scrollLeft = Math.max(0, (selectedIndex - 1) * tabWidth);
    }
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {days.map((date) => {
        const selected = isSelected(date);
        return (
          <motion.button
            key={date.toISOString()}
            onClick={() => onSelectDate(date)}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-shrink-0 flex flex-col items-center justify-center
              px-4 py-3 rounded-xl min-w-[80px] transition-all
              ${selected 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "bg-card text-foreground hover:bg-muted border border-border"
              }
            `}
          >
            <span className={`text-sm font-medium ${selected ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {getDateLabel(date)}
            </span>
            <span className={`text-lg font-bold ${selected ? "" : ""}`}>
              {format(date, "MMM d").toUpperCase()}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
