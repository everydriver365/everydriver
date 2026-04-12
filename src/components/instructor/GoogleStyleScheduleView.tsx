import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { format, eachDayOfInterval, isSameDay, isToday, startOfDay, addHours, addDays, startOfMonth, getMonth, addMonths } from 'date-fns';
import { Palette, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  onGoToDate?: (date: Date) => void;
}

interface DayEvents {
  date: Date;
  events: CalendarEvent[];
}

function getEventColor(event: CalendarEvent, colors: CalendarColors): string {
  if (event.type === 'lesson') {
    const isPaid = event.data?.payment_status === 'paid' || (event.data?.pupil_account_balance || 0) > 0;
    return isPaid ? colors.lesson : colors.lesson_unpaid;
  }
  if (event.type === 'external') {
    return event.data?.color || colors.external;
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
  onDelete,
  onColorChange,
  presetColors,
}: {
  event: CalendarEvent;
  color: string;
  onClick?: () => void;
  onDelete?: () => void;
  onColorChange?: (color: string) => void;
  presetColors: string[];
}) {
  const startTime = format(event.start, 'HH:mm');
  const endTime = format(event.end, 'HH:mm');
  
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
      className="w-full rounded px-2.5 py-1.5 mb-1 transition-all hover:opacity-90 active:scale-[0.99] touch-manipulation flex items-center gap-2"
      style={{ backgroundColor: color }}
    >
      {/* Time - Clear and readable */}
      <span className="text-xs text-foreground/80 font-semibold shrink-0 min-w-[72px]">
        {startTime}–{endTime}
      </span>
      
      {/* Title */}
      <span className="text-foreground font-medium text-sm truncate flex-1 min-w-0">
        {event.title}
      </span>

      {/* Actions - only show on hover/focus for cleaner look */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-60 hover:opacity-100">
        {onColorChange && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-5 w-5 rounded bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                aria-label="Change color"
              >
                <Palette className="h-3 w-3 text-muted-foreground pointer-events-none" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-40 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-6 gap-1">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'h-5 w-5 rounded border',
                      c === color ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => onColorChange(c)}
                    aria-label="Select color"
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {onDelete && event.type !== 'external' && (
          <button
            type="button"
            className="h-5 w-5 rounded bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground pointer-events-none" />
          </button>
        )}
      </div>
    </div>
  );
}

function DayRow({ 
  dayEvents, 
  colors, 
  onEventClick,
  onDayClick,
  onDeleteEvent,
  onEventColorChange,
  eventColorOverrides,
  todayRef
}: { 
  dayEvents: DayEvents; 
  colors: CalendarColors; 
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onEventColorChange?: (eventId: string, color: string) => void;
  eventColorOverrides: Record<string, string>;
  todayRef?: React.RefObject<HTMLDivElement>;
}) {
  const dayName = format(dayEvents.date, 'EEE').toUpperCase();
  const dayNumber = format(dayEvents.date, 'd');
  const isCurrentDay = isToday(dayEvents.date);
  
  return (
    <div 
      ref={isCurrentDay ? todayRef : undefined}
      className="flex py-1.5 overflow-hidden border-b border-border/20"
    >
      {/* Date column - Compact */}
      <div className="w-12 flex-shrink-0 text-center">
        <div className={cn(
          "text-[9px] font-medium tracking-wide",
          isCurrentDay ? "text-primary" : "text-muted-foreground"
        )}>
          {dayName}
        </div>
        <div className={cn(
          "text-lg font-medium leading-tight",
          isCurrentDay 
            ? "w-7 h-7 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm" 
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
          <div className="h-6 flex items-center">
            <span className="text-[10px] text-muted-foreground/40">—</span>
          </div>
        ) : (
          dayEvents.events.map((event) => {
            const baseColor = getEventColor(event, colors);
            const displayColor = eventColorOverrides[event.id] || baseColor;

            const presetColors = [
              colors.lesson,
              colors.lesson_unpaid,
              colors.block_personal,
              colors.block_break,
              colors.block_meeting,
              colors.external,
              DEFAULT_CALENDAR_COLORS.lesson,
              DEFAULT_CALENDAR_COLORS.lesson_unpaid,
              DEFAULT_CALENDAR_COLORS.block_meeting,
              DEFAULT_CALENDAR_COLORS.external,
            ].filter(Boolean);

            return (
              <EventBar
                key={event.id}
                event={event}
                color={displayColor}
                onClick={() => onEventClick?.(event)}
                onDelete={onDeleteEvent ? () => onDeleteEvent(event) : undefined}
                onColorChange={onEventColorChange ? (c) => onEventColorChange(event.id, c) : undefined}
                presetColors={Array.from(new Set(presetColors))}
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
    <div className="sticky top-0 z-10 px-4 py-2 border-b border-border/30 bg-card/95 backdrop-blur-sm">
      <h3 className="text-base font-semibold text-foreground">{monthName}</h3>
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
  onGoToDate,
}: GoogleStyleScheduleViewProps) {
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  
  // Always base the view around TODAY, not currentDate from props
  const today = useMemo(() => new Date(), []);

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
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
        hasScrolledRef.current = true;
      }, 50);
    }
  }, [loading]);

  // Generate 365 days starting from today
  const allDays = useMemo(() => {
    const start = startOfDay(today);
    const end = addDays(today, 364); // 365 days total including today
    
    return eachDayOfInterval({ start, end });
  }, [today]);

  // Group days by month for rendering with month banners
  const groupedByMonth = useMemo(() => {
    const groups: { month: Date; days: DayEvents[] }[] = [];
    let currentMonth: number | null = null;
    let currentGroup: DayEvents[] = [];
    let currentMonthDate: Date | null = null;

    allDays.forEach((date) => {
      const month = getMonth(date);
      
      if (currentMonth !== month) {
        if (currentGroup.length > 0 && currentMonthDate) {
          groups.push({ month: currentMonthDate, days: currentGroup });
        }
        currentMonth = month;
        currentMonthDate = startOfMonth(date);
        currentGroup = [];
      }
      
      const dayEvents = events
        .filter(event => isSameDay(event.start, date))
        .sort((a, b) => a.start.getTime() - b.start.getTime());
      
      currentGroup.push({ date, events: dayEvents });
    });

    // Push the last group
    if (currentGroup.length > 0 && currentMonthDate) {
      groups.push({ month: currentMonthDate, days: currentGroup });
    }

    return groups;
  }, [allDays, events]);

  // No-op scroll handler - we display a fixed 3-month window around today
  const handleScroll = useCallback(() => {
    // Infinite scroll removed - showing fixed 3 months around today
  }, []);

  const scrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="h-full flex flex-col bg-background rounded-2xl border overflow-hidden">
      {/* Minimal header */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-card gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToToday}
            className="h-8 px-3 text-xs"
          >
            Today
          </Button>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {format(today, 'MMM yyyy')} – {format(addMonths(today, 12), 'MMM yyyy')}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {onColorSettingsClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onColorSettingsClick}
              className="h-8 w-8"
            >
              <Palette className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Infinite scroll content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        onScroll={handleScroll}
      >
        {/* Show loading indicator overlay without hiding content */}
        {loading && (
          <div className="sticky top-0 z-20 flex items-center justify-center py-2 bg-background/80 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          </div>
        )}
        
        <div className="overflow-hidden">
          {groupedByMonth.map((group) => (
            <div key={group.month.toISOString()}>
              <MonthBanner month={group.month} />
              {group.days.map((dayEvents) => (
                <DayRow
                  key={dayEvents.date.toISOString()}
                  dayEvents={dayEvents}
                  colors={calendarColors}
                  onEventClick={onEventClick}
                  onDayClick={(date) => onAddEvent?.(addHours(startOfDay(date), 9))}
                  onDeleteEvent={onDeleteEvent}
                  onEventColorChange={(eventId, color) =>
                    setEventColorOverrides((prev) => ({ ...prev, [eventId]: color }))
                  }
                  eventColorOverrides={eventColorOverrides}
                  todayRef={todayRef}
                />
              ))}
            </div>
          ))}
          
          {groupedByMonth.length === 0 && !loading && (
            <div className="py-12 text-center text-muted-foreground">
              No events
            </div>
          )}
        </div>
      </div>
      
      {/* Color legend */}
      <div className="flex flex-wrap gap-2 p-2 border-t bg-card text-[10px] flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.lesson }} />
          <span className="text-muted-foreground">Paid</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.lesson_unpaid }} />
          <span className="text-muted-foreground">Unpaid</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.block_personal }} />
          <span className="text-muted-foreground">Block</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.external }} />
          <span className="text-muted-foreground">External</span>
        </div>
      </div>
    </div>
  );
}