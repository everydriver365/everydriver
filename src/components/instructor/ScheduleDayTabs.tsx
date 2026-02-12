import { useRef, useEffect } from "react";
import { format, addDays, isToday, isTomorrow, startOfWeek } from "date-fns";
import { motion } from "framer-motion";

interface ScheduleDayTabsProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function ScheduleDayTabs({ selectedDate, onSelectDate }: ScheduleDayTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Generate 365 days starting from today (full year ahead)
  const days = Array.from({ length: 365 }, (_, i) => addDays(new Date(), i));
  
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
              px-2.5 py-1.5 rounded-lg min-w-[56px] transition-all
              ${selected 
                ? "bg-[#0075c9] text-white shadow-md" 
                : "bg-card text-foreground hover:bg-muted border border-border"
              }
            `}
          >
            <span className={`text-[10px] font-medium ${selected ? "text-white" : "text-muted-foreground"}`}>
              {getDateLabel(date)}
            </span>
            <span className={`text-xs font-bold ${selected ? "" : ""}`}>
              {format(date, "d MMM").toUpperCase()}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
