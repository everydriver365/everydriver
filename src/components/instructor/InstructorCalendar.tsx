import { useState, useEffect } from 'react';
import { format, isSameDay, isToday, startOfWeek, startOfMonth, addDays, addHours, startOfDay, differenceInMinutes, isSameWeek, isSameMonth, addMonths, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Palette, GripVertical, PanelLeftClose, PanelLeft, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useInstructorCalendar, CalendarEvent, CalendarView } from '@/hooks/useInstructorCalendar';
import { CalendarEventSheet } from './CalendarEventSheet';
import { AddCalendarEventDialog } from './AddCalendarEventDialog';
import { CalendarColorSettings, CalendarColors, DEFAULT_CALENDAR_COLORS } from './CalendarColorSettings';
import { CalendarExportDialog } from './CalendarExportDialog';
import { CalendarShareSettings } from './CalendarShareSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInstructorAuth } from '@/context/InstructorAuthContext';

interface InstructorCalendarProps {
  instructorId: string;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export function InstructorCalendar({ instructorId }: InstructorCalendarProps) {
  const isMobile = useIsMobile();
  const { instructor } = useInstructorAuth();
  const { 
    events, 
    loading, 
    currentDate, 
    view, 
    setView, 
    navigate,
    goToDate,
    refetch,
    deleteBlock,
    rescheduleLesson,
    resizeLesson,
    rescheduleBlock,
    calendarColors,
    setCalendarColors,
  } = useInstructorCalendar(instructorId);
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState<Date | null>(null);
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareSettings, setShowShareSettings] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{ event: CalendarEvent; startY: number; originalHeight: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('calendar-sidebar-open');
    return saved !== null ? saved === 'true' : !isMobile;
  });

  useEffect(() => {
    localStorage.setItem('calendar-sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

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

  const getEventColor = (event: CalendarEvent, colors: CalendarColors) => {
    switch (event.type) {
      case 'lesson':
        const isPaid = event.data?.payment_status === 'paid';
        return isPaid ? colors.lesson : colors.lesson_unpaid;
      case 'external':
        return event.data?.color || colors.external;
      case 'block':
        const blockType = event.data?.block_type || 'personal';
        switch (blockType) {
          case 'break':
            return colors.block_break;
          case 'meeting':
            return colors.block_meeting;
          default:
            return colors.block_personal;
        }
      default:
        return colors.lesson;
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (event.type === 'external') return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  };

  const handleDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ day, hour });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    if (!draggedEvent) return;
    
    try {
      const newStartTime = `${hour.toString().padStart(2, '0')}:00`;
      
      if (draggedEvent.type === 'lesson') {
        await rescheduleLesson(draggedEvent.id, day, newStartTime);
        toast.success('Lesson rescheduled');
      } else if (draggedEvent.type === 'block') {
        const duration = differenceInMinutes(draggedEvent.end, draggedEvent.start);
        const newStart = addHours(startOfDay(day), hour);
        const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);
        await rescheduleBlock(draggedEvent.id, newStart, newEnd);
        toast.success('Block rescheduled');
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast.error('Failed to reschedule');
    }
    
    setDraggedEvent(null);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverSlot(null);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent, currentHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setResizingEvent({ event, startY, originalHeight: currentHeight });
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!resizingEvent) return;
    e.preventDefault();
  };

  const handleResizeEnd = async (e: MouseEvent | TouchEvent) => {
    if (!resizingEvent) return;
    
    const endY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = endY - resizingEvent.startY;
    const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60);
    
    const originalDuration = differenceInMinutes(resizingEvent.event.end, resizingEvent.event.start);
    const newDuration = originalDuration + deltaMinutes;
    
    // Minimum 30 minutes
    if (newDuration >= 30 && resizingEvent.event.type === 'lesson') {
      try {
        await resizeLesson(resizingEvent.event.id, newDuration);
        toast.success(`Lesson duration updated to ${Math.floor(newDuration / 60)}h ${newDuration % 60}m`);
      } catch (error) {
        console.error('Error resizing lesson:', error);
        toast.error('Failed to resize lesson');
      }
    }
    
    setResizingEvent(null);
  };

  useEffect(() => {
    if (resizingEvent) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = (e: MouseEvent) => handleResizeEnd(e);
      const handleTouchMove = (e: TouchEvent) => handleResizeMove(e);
      const handleTouchEnd = (e: TouchEvent) => handleResizeEnd(e);
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [resizingEvent]);

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
    <div className="flex h-full gap-0">
      {/* Mini Calendar Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (view === 'week' || view === 'day') && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isMobile ? 220 : 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r bg-card overflow-hidden flex-shrink-0"
          >
            <MiniCalendarSidebar
              currentDate={currentDate}
              events={events}
              calendarColors={calendarColors}
              getEventColor={getEventColor}
              onDateSelect={(date) => goToDate(date)}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col bg-background rounded-2xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {(view === 'week' || view === 'day') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? 'Hide mini calendar' : 'Show mini calendar'}
              >
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
            )}
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
            <h2 className="text-lg font-semibold ml-2 hidden sm:block">{getViewTitle()}</h2>
            <h2 className="text-sm font-semibold ml-2 sm:hidden">{format(currentDate, 'MMM d')}</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-2xl border bg-muted p-1">
              {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
                <Button
                  key={v}
                  variant={view === v ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView(v)}
                  className="capitalize px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">{v}</span>
                  <span className="sm:hidden">{v.charAt(0).toUpperCase()}</span>
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowExportDialog(true)}
              title="Export calendar"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowShareSettings(true)}
              title="Share availability"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowColorSettings(true)}
              title="Customize colors"
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {view === 'week' && (
            <WeekView
              weekDays={weekDays}
              events={events}
              currentDate={currentDate}
              calendarColors={calendarColors}
              getEventStyle={getEventStyle}
              getEventColor={getEventColor}
              getEventsForDay={getEventsForDay}
              onTimeSlotClick={handleTimeSlotClick}
              onEventClick={setSelectedEvent}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              draggedEvent={draggedEvent}
              dragOverSlot={dragOverSlot}
              onResizeStart={handleResizeStart}
              resizingEvent={resizingEvent}
            />
          )}

          {view === 'day' && (
            <DayView 
              date={currentDate}
              events={events.filter(e => isSameDay(e.start, currentDate))}
              onEventClick={setSelectedEvent}
              onTimeSlotClick={handleTimeSlotClick}
              getEventStyle={getEventStyle}
              calendarColors={calendarColors}
              getEventColor={getEventColor}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              draggedEvent={draggedEvent}
              dragOverSlot={dragOverSlot}
              onResizeStart={handleResizeStart}
              resizingEvent={resizingEvent}
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
              calendarColors={calendarColors}
              getEventColor={getEventColor}
            />
          )}
        </div>
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

      {/* Color Settings Dialog */}
      <CalendarColorSettings
        open={showColorSettings}
        onOpenChange={setShowColorSettings}
        instructorId={instructorId}
        colors={calendarColors}
        onColorsChange={setCalendarColors}
      />

      {/* Export Dialog */}
      <CalendarExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        events={events}
        currentDate={currentDate}
        view={view}
        instructorName={instructor?.name}
      />

      {/* Share Settings Dialog */}
      <CalendarShareSettings
        open={showShareSettings}
        onOpenChange={setShowShareSettings}
        instructorId={instructorId}
        instructorName={instructor?.name}
      />
    </div>
  );
}

// Mini Calendar Sidebar Component
interface MiniCalendarSidebarProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendarColors: CalendarColors;
  getEventColor: (event: CalendarEvent, colors: CalendarColors) => string;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

function MiniCalendarSidebar({ 
  currentDate, 
  events, 
  calendarColors,
  getEventColor,
  onDateSelect,
  onClose 
}: MiniCalendarSidebarProps) {
  const [miniMonth, setMiniMonth] = useState(startOfMonth(currentDate));

  useEffect(() => {
    setMiniMonth(startOfMonth(currentDate));
  }, [currentDate]);

  const monthStart = startOfWeek(miniMonth, { weekStartsOn: 1 });
  const weeks = Array.from({ length: 6 }, (_, weekIndex) => 
    Array.from({ length: 7 }, (_, dayIndex) => addDays(monthStart, weekIndex * 7 + dayIndex))
  );

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

  return (
    <div className="p-3 h-full flex flex-col">
      {/* Mini Month Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{format(miniMonth, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setMiniMonth(subMonths(miniMonth, 1))}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setMiniMonth(addMonths(miniMonth, 1))}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Mini Calendar Grid */}
      <div className="flex-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0">
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, miniMonth);
              const isSelected = isSameDay(day, currentDate);
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    "relative h-8 w-full text-xs rounded-2xl transition-colors",
                    "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isToday(day) && "font-bold text-primary",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {format(day, 'd')}
                  {/* Event indicators */}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: getEventColor(event, calendarColors) }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="pt-3 border-t mt-3 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={() => onDateSelect(new Date())}
        >
          Jump to Today
        </Button>
      </div>

      {/* Legend */}
      <div className="pt-3 border-t mt-3 space-y-1.5">
        <div className="text-xs font-medium text-muted-foreground mb-2">Legend</div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.lesson }} />
            <span className="text-muted-foreground">Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.lesson_unpaid }} />
            <span className="text-muted-foreground">Unpaid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.block_personal }} />
            <span className="text-muted-foreground">Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-2xl" style={{ backgroundColor: calendarColors.external }} />
            <span className="text-muted-foreground">External</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Week View Component
interface WeekViewProps {
  weekDays: Date[];
  events: CalendarEvent[];
  currentDate: Date;
  calendarColors: CalendarColors;
  getEventStyle: (event: CalendarEvent, dayStart: Date) => { top: number; height: number };
  getEventColor: (event: CalendarEvent, colors: CalendarColors) => string;
  getEventsForDay: (day: Date) => CalendarEvent[];
  onTimeSlotClick: (day: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDragOver: (e: React.DragEvent, day: Date, hour: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: Date, hour: number) => Promise<void>;
  onDragEnd: () => void;
  draggedEvent: CalendarEvent | null;
  dragOverSlot: { day: Date; hour: number } | null;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent, currentHeight: number) => void;
  resizingEvent: { event: CalendarEvent; startY: number; originalHeight: number } | null;
}

function WeekView({
  weekDays,
  calendarColors,
  getEventStyle,
  getEventColor,
  getEventsForDay,
  onTimeSlotClick,
  onEventClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedEvent,
  dragOverSlot,
  onResizeStart,
  resizingEvent,
}: WeekViewProps) {
  return (
    <div className="min-w-[800px]">
      {/* Day Headers */}
      <div className="flex border-b sticky top-0 bg-card z-10">
        <div className="w-16 flex-shrink-0" />
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
                  className={cn(
                    "h-[60px] border-b border-dashed border-muted cursor-pointer hover:bg-muted/30 transition-colors",
                    dragOverSlot?.day.toISOString() === day.toISOString() && 
                    dragOverSlot?.hour === hour && "bg-primary/20"
                  )}
                  onClick={() => onTimeSlotClick(day, hour)}
                  onDragOver={(e) => onDragOver(e, day, hour)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, day, hour)}
                />
              ))}

              {/* Events */}
              <AnimatePresence>
                {dayEvents.map((event) => {
                  const style = getEventStyle(event, day);
                  const color = getEventColor(event, calendarColors);
                  const isDraggable = event.type !== 'external';
                  const isResizable = event.type === 'lesson';
                  const isBeingResized = resizingEvent?.event.id === event.id;
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: draggedEvent?.id === event.id ? 0.5 : 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable={isDraggable && !isBeingResized}
                      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, event)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "absolute left-1 right-1 rounded-2xl px-2 py-1 text-xs cursor-pointer border-l-4 overflow-hidden text-white group",
                        isDraggable && !isBeingResized && "cursor-grab active:cursor-grabbing",
                        event.type === 'external' && "text-muted-foreground"
                      )}
                      style={{
                        top: style.top,
                        height: style.height,
                        backgroundColor: color,
                        borderLeftColor: color,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {isDraggable && (
                        <GripVertical className="h-3 w-3 absolute right-1 top-1 opacity-0 group-hover:opacity-50" />
                      )}
                      <div className="font-medium truncate">{event.title}</div>
                      {style.height > 40 && (
                        <div className="text-[10px] opacity-80">
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </div>
                      )}
                      {/* Resize Handle */}
                      {isResizable && style.height >= 30 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onResizeStart(e, event, style.height);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            onResizeStart(e, event, style.height);
                          }}
                        >
                          <div className="w-8 h-1 bg-white/60 rounded-full" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Current time indicator */}
              {isToday(day) && <CurrentTimeIndicator />}
            </div>
          );
        })}
      </div>
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
  calendarColors: CalendarColors;
  getEventColor: (event: CalendarEvent, colors: CalendarColors) => string;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDragOver: (e: React.DragEvent, day: Date, hour: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: Date, hour: number) => Promise<void>;
  onDragEnd: () => void;
  draggedEvent: CalendarEvent | null;
  dragOverSlot: { day: Date; hour: number } | null;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent, currentHeight: number) => void;
  resizingEvent: { event: CalendarEvent; startY: number; originalHeight: number } | null;
}

function DayView({ 
  date, 
  events, 
  onEventClick, 
  onTimeSlotClick, 
  getEventStyle, 
  calendarColors,
  getEventColor,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedEvent,
  dragOverSlot,
  onResizeStart,
  resizingEvent,
}: DayViewProps) {
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
            className={cn(
              "h-[60px] border-b border-dashed border-muted cursor-pointer hover:bg-muted/30 transition-colors",
              dragOverSlot?.day.toISOString() === date.toISOString() && 
              dragOverSlot?.hour === hour && "bg-primary/20"
            )}
            onClick={() => onTimeSlotClick(date, hour)}
            onDragOver={(e) => onDragOver(e, date, hour)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, date, hour)}
          />
        ))}

        {/* Events */}
        <AnimatePresence>
          {events.map((event) => {
            const style = getEventStyle(event, date);
            const color = getEventColor(event, calendarColors);
            const isDraggable = event.type !== 'external';
            const isResizable = event.type === 'lesson';
            const isBeingResized = resizingEvent?.event.id === event.id;
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: draggedEvent?.id === event.id ? 0.5 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                draggable={isDraggable && !isBeingResized}
                onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, event)}
                onDragEnd={onDragEnd}
                className={cn(
                  "absolute left-1 right-1 rounded-2xl px-3 py-2 cursor-pointer border-l-4 overflow-hidden text-white group",
                  isDraggable && !isBeingResized && "cursor-grab active:cursor-grabbing",
                  event.type === 'external' && "text-muted-foreground"
                )}
                style={{
                  top: style.top,
                  height: style.height,
                  backgroundColor: color,
                  borderLeftColor: color,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                {isDraggable && (
                  <GripVertical className="h-3 w-3 absolute right-1 top-1 opacity-0 group-hover:opacity-50" />
                )}
                <div className="font-medium">{event.title}</div>
                <div className="text-sm opacity-80">
                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                </div>
                {/* Resize Handle */}
                {isResizable && style.height >= 30 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onResizeStart(e, event, style.height);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      onResizeStart(e, event, style.height);
                    }}
                  >
                    <div className="w-10 h-1 bg-white/60 rounded-full" />
                  </div>
                )}
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
  calendarColors: CalendarColors;
  getEventColor: (event: CalendarEvent, colors: CalendarColors) => string;
}

function MonthView({ currentDate, events, onEventClick, onDayClick, calendarColors, getEventColor }: MonthViewProps) {
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
                    {dayEvents.slice(0, 3).map((event) => {
                      const color = getEventColor(event, calendarColors);
                      return (
                        <div
                          key={event.id}
                          className="text-xs px-1 py-0.5 rounded truncate cursor-pointer text-white"
                          style={{ backgroundColor: color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      );
                    })}
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
