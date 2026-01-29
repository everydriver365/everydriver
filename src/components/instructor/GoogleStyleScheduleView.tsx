import { useState, useMemo, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, startOfWeek, endOfWeek, isToday, startOfDay, addHours } from 'date-fns';
import { ChevronLeft, ChevronRight, Palette, MapPin, Clock, User, Plus } from 'lucide-react';
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
  onClick 
}: { 
  event: CalendarEvent; 
  color: string; 
  onClick?: () => void;
}) {
  const startTime = format(event.start, 'h:mm a');
  const endTime = format(event.end, 'h:mm a');
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md px-3 py-2 mb-1 transition-all hover:opacity-90 active:scale-[0.99] touch-manipulation"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-white text-sm truncate flex-1">
          {event.title}
        </span>
        {event.type === 'lesson' && event.data?.payment_status !== 'paid' && (
          <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded">
            Unpaid
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1 text-white/80 text-xs">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {startTime} - {endTime}
        </span>
        {event.type === 'lesson' && event.data?.pickup_address && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.data.pickup_address}</span>
          </span>
        )}
      </div>
    </button>
  );
}

function DayRow({ 
  dayEvents, 
  colors, 
  onEventClick,
  onDayClick,
  isFirstInWeek,
  todayRef
}: { 
  dayEvents: DayEvents; 
  colors: CalendarColors; 
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  isFirstInWeek: boolean;
  todayRef?: React.RefObject<HTMLDivElement>;
}) {
  const dayName = format(dayEvents.date, 'EEE').toUpperCase();
  const dayNumber = format(dayEvents.date, 'd');
  const isCurrentDay = isToday(dayEvents.date);
  
  return (
    <div 
      ref={isCurrentDay ? todayRef : undefined}
      className={cn(
        "flex border-b border-border/50",
        isFirstInWeek && "border-t-2 border-t-border"
      )}
    >
      {/* Date column */}
      <div className={cn(
        "w-16 flex-shrink-0 py-3 px-2 text-center border-r border-border/30",
        isCurrentDay && "bg-primary/10"
      )}>
        <div className={cn(
          "text-xs font-medium",
          isCurrentDay ? "text-primary" : "text-muted-foreground"
        )}>
          {dayName}
        </div>
        <div className={cn(
          "text-lg font-bold",
          isCurrentDay ? "text-primary" : "text-foreground"
        )}>
          {dayNumber}
        </div>
      </div>
      
      {/* Events column - clickable to add */}
      <button
        onClick={() => onDayClick?.(dayEvents.date)}
        className="flex-1 py-2 px-2 min-h-[60px] text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        {dayEvents.events.length === 0 ? (
          <div className="h-full flex items-center">
            <span className="text-xs text-muted-foreground italic">Tap to add</span>
          </div>
        ) : (
          dayEvents.events.map(event => (
            <EventBar
              key={event.id}
              event={event}
              color={getEventColor(event, colors)}
              onClick={() => onEventClick?.(event)}
            />
          ))
        )}
      </button>
    </div>
  );
}

function WeekHeader({ weekStart, weekEnd }: { weekStart: Date; weekEnd: Date }) {
  const startMonth = format(weekStart, 'MMMM');
  const endMonth = format(weekEnd, 'MMMM');
  const sameMonth = startMonth === endMonth;
  
  const label = sameMonth
    ? `${startMonth.toUpperCase()} ${format(weekStart, 'd')} - ${format(weekEnd, 'd')}`
    : `${startMonth.toUpperCase()} ${format(weekStart, 'd')} - ${endMonth.toUpperCase()} ${format(weekEnd, 'd')}`;
  
  return (
    <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground tracking-wide">
      {label}
    </div>
  );
}

function MonthBanner({ month }: { month: Date }) {
  const monthName = format(month, 'MMMM');
  const year = format(month, 'yyyy');
  
  return (
    <div className="relative py-4 px-4 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-primary rounded-full" />
        <div>
          <h3 className="text-xl font-bold text-foreground">{monthName}</h3>
          <p className="text-sm text-muted-foreground">{year}</p>
        </div>
      </div>
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
  loading
}: GoogleStyleScheduleViewProps) {
  const todayRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

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
      
      currentWeekStart = addMonths(currentWeekStart, 0);
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
          {onColorSettingsClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onColorSettingsClick}
              className="h-7 w-7 sm:h-8 sm:w-8"
            >
              <Palette className="h-4 w-4" />
            </Button>
          )}
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
            
            {/* Weeks */}
            {groupedData.weeks.map((week, weekIndex) => (
              <div key={weekIndex}>
                <WeekHeader weekStart={week.weekStart} weekEnd={week.weekEnd} />
                {week.days.map((dayEvents, dayIndex) => (
                  <DayRow
                    key={dayEvents.date.toISOString()}
                    dayEvents={dayEvents}
                    colors={calendarColors}
                    onEventClick={onEventClick}
                    onDayClick={(date) => onAddEvent?.(addHours(startOfDay(date), 9))}
                    isFirstInWeek={dayIndex === 0}
                    todayRef={todayRef}
                  />
                ))}
              </div>
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
