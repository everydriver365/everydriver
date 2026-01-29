import { useMemo, useEffect, useRef, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isToday, startOfDay, addHours } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useInstructorCalendar';
import { CalendarColors, DEFAULT_CALENDAR_COLORS } from './CalendarColorSettings';

interface GoogleStyleScheduleViewProps {
  events: CalendarEvent[];
  calendarColors: CalendarColors;
  onEventClick?: (event: CalendarEvent) => void;
  onColorSettingsClick?: () => void;
  onAddEvent?: (date?: Date) => void;
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  loading?: boolean;
  onDeleteEvent?: (event: CalendarEvent) => void;
}

interface DayEvents {
  date: Date;
  events: CalendarEvent[];
}

interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  days: DayEvents[];
}

interface MonthGroup {
  month: Date;
  weeks: WeekGroup[];
}

function getEventColor(event: CalendarEvent, colors: CalendarColors): string {
  if (event.type === 'lesson') {
    const isPaid = event.data?.payment_status === 'paid';
    return isPaid ? colors.lesson : colors.lesson_unpaid;
  }
  if (event.type === 'external') {
    return colors.external;
  }
  if (event.type === 'block') {
    const blockType = event.data?.block_type || 'personal';
    switch (blockType) {
      case 'break': return colors.block_break;
      case 'meeting': return colors.block_meeting;
      default: return colors.block_personal;
    }
  }
  return colors.external;
}

function EventBar({
  event,
  color,
  onClick,
}: {
  event: CalendarEvent;
  color: string;
  onClick?: () => void;
}) {
  const startTime = format(event.start, 'HH:mm');
  const endTime = format(event.end, 'HH:mm');
  const hasSecondLine = event.type === 'lesson' && event.data?.pickup_address;
  
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }
      }}
      className="w-full rounded-md px-3 py-2 mb-1.5 transition-all hover:opacity-90 active:scale-[0.99] touch-manipulation"
      style={{ backgroundColor: color }}
    >
      <div className="text-black/90 font-medium text-sm truncate">
        {event.title}
      </div>
      {hasSecondLine && (
        <div className="text-black/70 text-xs truncate mt-0.5">
          {startTime} – {endTime} at {event.data.pickup_address}
        </div>
      )}
      {!hasSecondLine && (
        <div className="text-black/70 text-xs truncate mt-0.5">
          {startTime} – {endTime}
        </div>
      )}
    </div>
  );
}

function DayRow({ 
  dayEvents, 
  colors, 
  onEventClick,
  onDayClick,
  eventColorOverrides,
  todayRef
}: { 
  dayEvents: DayEvents; 
  colors: CalendarColors; 
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  eventColorOverrides: Record<string, string>;
  todayRef?: React.RefObject<HTMLDivElement>;
}) {
  const dayName = format(dayEvents.date, 'EEE').toUpperCase();
  const dayNumber = format(dayEvents.date, 'd');
  const isCurrentDay = isToday(dayEvents.date);
  
  return (
    <div 
      ref={isCurrentDay ? todayRef : undefined}
      className="flex py-3"
    >
      {/* Date column - Google style */}
      <div className="w-14 flex-shrink-0 text-center pt-1">
        <div className={cn(
          "text-[11px] font-medium tracking-wide",
          isCurrentDay ? "text-primary" : "text-muted-foreground"
        )}>
          {dayName}
        </div>
        <div className={cn(
          "text-2xl font-light",
          isCurrentDay 
            ? "w-10 h-10 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center" 
            : "text-foreground"
        )}>
          {dayNumber}
        </div>
      </div>
      
      {/* Events column */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onDayClick?.(dayEvents.date)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDayClick?.(dayEvents.date);
          }
        }}
        className="flex-1 min-w-0 pr-3"
      >
        {dayEvents.events.length === 0 ? (
          <div className="h-10 flex items-center">
            <span className="text-xs text-muted-foreground/50">Tap to add</span>
          </div>
        ) : (
          dayEvents.events.map((event) => {
            const baseColor = getEventColor(event, colors);
            const displayColor = eventColorOverrides[event.id] || baseColor;

            return (
              <EventBar
                key={event.id}
                event={event}
                color={displayColor}
                onClick={() => onEventClick?.(event)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function MonthBanner({ month }: { month: Date }) {
  const monthName = format(month, 'MMMM yyyy');
  
  return (
    <div className="px-4 py-3 border-b border-border/30">
      <h3 className="text-lg font-semibold text-foreground">{monthName}</h3>
    </div>
  );
}

export function GoogleStyleScheduleView({
  events,
  calendarColors,
  onEventClick,
  onColorSettingsClick,
  onAddEvent,
  currentDate,
  onNavigate,
  loading,
  onDeleteEvent,
}: GoogleStyleScheduleViewProps) {
  const todayRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const [eventColorOverrides, setEventColorOverrides] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('schedule-event-colors');
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('schedule-event-colors', JSON.stringify(eventColorOverrides));
    } catch {
      // ignore
    }
  }, [eventColorOverrides]);

  // Scroll to today on initial load
  useEffect(() => {
    if (!loading && todayRef.current && !hasScrolledRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolledRef.current = true;
      }, 100);
    }
  }, [loading]);

  // Reset scroll flag when month changes to allow re-scroll if today is in new month
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [currentDate]);

  // Group events by month, then by week, then by day
  const groupedData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Get all days in the month
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Group by weeks
    const weeks: WeekGroup[] = [];
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    while (currentWeekStart <= monthEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      
      // Get days in this week that are in the current month
      const weekDays = eachDayOfInterval({ 
        start: currentWeekStart > monthStart ? currentWeekStart : monthStart,
        end: currentWeekEnd < monthEnd ? currentWeekEnd : monthEnd
      });
      
      const days: DayEvents[] = weekDays.map(date => ({
        date,
        events: events
          .filter(event => isSameDay(event.start, date))
          .sort((a, b) => a.start.getTime() - b.start.getTime())
      }));
      
      if (days.length > 0) {
        weeks.push({
          weekStart: weekDays[0],
          weekEnd: weekDays[weekDays.length - 1],
          days
        });
      }
      
      currentWeekStart = new Date(currentWeekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
    }
    
    return {
      month: monthStart,
      weeks
    };
  }, [events, currentDate]);

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-card gap-1 sm:gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('prev')}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('today')}
            className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-sm sm:text-lg font-semibold truncate px-1">
          <span className="hidden sm:inline">{format(currentDate, 'MMMM yyyy')}</span>
          <span className="sm:hidden">{format(currentDate, 'MMM yyyy')}</span>
        </h2>
        
        <div className="flex items-center gap-0.5 sm:gap-1">
          {onAddEvent && (
            <Button
              size="sm"
              onClick={() => onAddEvent()}
              className="h-7 sm:h-8 px-2 sm:px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Add</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div>
            {/* Month banner */}
            <MonthBanner month={groupedData.month} />
            
            {/* Days */}
            {groupedData.weeks.flatMap((week) => week.days).map((dayEvents) => (
              <DayRow
                key={dayEvents.date.toISOString()}
                dayEvents={dayEvents}
                colors={calendarColors}
                onEventClick={onEventClick}
                onDayClick={(date) => onAddEvent?.(addHours(startOfDay(date), 9))}
                eventColorOverrides={eventColorOverrides}
                todayRef={todayRef}
              />
            ))}
            
            {groupedData.weeks.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No events this month
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Color legend */}
      <div className="flex flex-wrap gap-3 p-3 border-t bg-card text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: calendarColors.lesson }} />
          <span className="text-muted-foreground">Paid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: calendarColors.lesson_unpaid }} />
          <span className="text-muted-foreground">Unpaid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: calendarColors.block_personal }} />
          <span className="text-muted-foreground">Personal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: calendarColors.external }} />
          <span className="text-muted-foreground">External</span>
        </div>
      </div>
    </div>
  );
}
