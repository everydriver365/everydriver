import { useState } from 'react';
import { format, isSameDay, isToday, startOfWeek, startOfMonth, addDays, addHours, startOfDay, differenceInMinutes, isSameWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useInstructorCalendar, CalendarEvent, CalendarView } from '@/hooks/useInstructorCalendar';
import { CalendarEventSheet } from './CalendarEventSheet';
import { AddCalendarEventDialog } from './AddCalendarEventDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface InstructorCalendarProps {
  instructorId: string;
}

const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export function InstructorCalendar({ instructorId }: InstructorCalendarProps) {
  const { 
    events, 
    loading, 
    currentDate, 
    view, 
    setView, 
    navigate,
    refetch,
    addBlock,
    deleteBlock 
  } = useInstructorCalendar(instructorId);
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventStyle = (event: CalendarEvent, dayStart: Date) => {
    const eventStart = event.start;
    const eventEnd = event.end;
    
    const startMinutes = differenceInMinutes(eventStart, addHours(startOfDay(dayStart), START_HOUR));
    const duration = differenceInMinutes(eventEnd, eventStart);
    
    const top = Math.max(0, (startMinutes / 60) * HOUR_HEIGHT);
    const height = Math.max(30, (duration / 60) * HOUR_HEIGHT);
    
    return { top, height };
  };

  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'lesson':
        const lesson = event.data;
        if (lesson?.payment_status === 'paid') {
          return 'bg-emerald-500/90 hover:bg-emerald-500 border-emerald-600';
        }
        return 'bg-primary/90 hover:bg-primary border-primary';
      case 'external':
        return 'bg-muted hover:bg-muted/80 border-muted-foreground/30 text-muted-foreground';
      case 'block':
        return 'bg-blue-500/90 hover:bg-blue-500 border-blue-600';
      default:
        return 'bg-primary/90 hover:bg-primary';
    }
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const clickedTime = addHours(startOfDay(day), hour);
    setAddDialogDate(clickedTime);
    setShowAddDialog(true);
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  const getViewTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekEnd = addDays(weekStart, 6);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`;
        }
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('today')}
            className={cn(
              isSameWeek(currentDate, new Date(), { weekStartsOn: 1 }) && view === 'week' && 'bg-primary/10'
            )}
          >
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold ml-2">{getViewTitle()}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-1">
            {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
              <Button
                key={v}
                variant={view === v ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(v)}
                className="capitalize px-3"
              >
                {v}
              </Button>
            ))}
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {view === 'week' && (
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="flex border-b sticky top-0 bg-card z-10">
              <div className="w-16 flex-shrink-0" /> {/* Time column spacer */}
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 text-center py-3 border-l",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className="text-sm text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className={cn(
                    "text-2xl font-semibold",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="flex relative">
              {/* Time Column */}
              <div className="w-16 flex-shrink-0">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-[60px] text-xs text-muted-foreground text-right pr-2 -mt-2"
                  >
                    {format(addHours(startOfDay(new Date()), hour), 'ha')}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex-1 border-l relative",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {/* Hour slots */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="h-[60px] border-b border-dashed border-muted cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleTimeSlotClick(day, hour)}
                      />
                    ))}

                    {/* Events */}
                    <AnimatePresence>
                      {dayEvents.map((event) => {
                        const style = getEventStyle(event, day);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              "absolute left-1 right-1 rounded-md px-2 py-1 text-xs cursor-pointer border-l-4 overflow-hidden",
                              getEventColor(event),
                              event.type !== 'external' && "text-white"
                            )}
                            style={{
                              top: style.top,
                              height: style.height,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {style.height > 40 && (
                              <div className="text-[10px] opacity-80">
                                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Current time indicator */}
                    {isToday(day) && (
                      <CurrentTimeIndicator />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'day' && (
          <DayView 
            date={currentDate}
            events={events.filter(e => isSameDay(e.start, currentDate))}
            onEventClick={setSelectedEvent}
            onTimeSlotClick={handleTimeSlotClick}
            getEventStyle={getEventStyle}
            getEventColor={getEventColor}
          />
        )}

        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={setSelectedEvent}
            onDayClick={(day) => {
              setAddDialogDate(addHours(startOfDay(day), 9));
              setShowAddDialog(true);
            }}
          />
        )}
      </div>

      {/* Event Detail Sheet */}
      <CalendarEventSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={async (id) => {
          if (selectedEvent?.type === 'block') {
            await deleteBlock(id);
          }
          setSelectedEvent(null);
        }}
        onRefetch={refetch}
      />

      {/* Add Event Dialog */}
      <AddCalendarEventDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        instructorId={instructorId}
        defaultDate={addDialogDate}
        onSuccess={() => {
          setShowAddDialog(false);
          refetch();
        }}
      />
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = START_HOUR * 60;
  const top = ((minutes - startMinutes) / 60) * HOUR_HEIGHT;

  if (top < 0 || top > (END_HOUR - START_HOUR) * HOUR_HEIGHT) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (day: Date, hour: number) => void;
  getEventStyle: (event: CalendarEvent, dayStart: Date) => { top: number; height: number };
  getEventColor: (event: CalendarEvent) => string;
}

function DayView({ date, events, onEventClick, onTimeSlotClick, getEventStyle, getEventColor }: DayViewProps) {
  return (
    <div className="flex">
      {/* Time Column */}
      <div className="w-16 flex-shrink-0">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-[60px] text-xs text-muted-foreground text-right pr-2 -mt-2"
          >
            {format(addHours(startOfDay(new Date()), hour), 'ha')}
          </div>
        ))}
      </div>

      {/* Day Column */}
      <div className="flex-1 relative border-l">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-[60px] border-b border-dashed border-muted cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onTimeSlotClick(date, hour)}
          />
        ))}

        {/* Events */}
        <AnimatePresence>
          {events.map((event) => {
            const style = getEventStyle(event, date);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "absolute left-1 right-1 rounded-md px-3 py-2 cursor-pointer border-l-4 overflow-hidden",
                  getEventColor(event),
                  event.type !== 'external' && "text-white"
                )}
                style={{
                  top: style.top,
                  height: style.height,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-sm opacity-80">
                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Current time indicator */}
        {isToday(date) && <CurrentTimeIndicator />}
      </div>
    </div>
  );
}

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (day: Date) => void;
}

function MonthView({ currentDate, events, onEventClick, onDayClick }: MonthViewProps) {
  const monthStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const weeks = Array.from({ length: 6 }, (_, weekIndex) => 
    Array.from({ length: 7 }, (_, dayIndex) => addDays(monthStart, weekIndex * 7 + dayIndex))
  );

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

  return (
    <div className="h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b bg-card">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-rows-6 h-[calc(100%-2.5rem)]">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b">
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] p-1 border-r cursor-pointer hover:bg-muted/30 transition-colors",
                    !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => onDayClick(day)}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs px-1 py-0.5 rounded truncate cursor-pointer",
                          event.type === 'lesson' && "bg-primary/20 text-primary",
                          event.type === 'external' && "bg-muted text-muted-foreground",
                          event.type === 'block' && "bg-blue-500/20 text-blue-600"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
