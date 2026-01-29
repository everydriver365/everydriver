import { useState, useEffect } from "react";
import { Calendar, List, CalendarDays } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { NewMobileScheduleView } from "@/components/instructor/NewMobileScheduleView";
import { InstructorCalendar } from "@/components/instructor/InstructorCalendar";
import { GoogleStyleScheduleView } from "@/components/instructor/GoogleStyleScheduleView";
import { CalendarColorSettings } from "@/components/instructor/CalendarColorSettings";
import { AddCalendarEventDialog } from "@/components/instructor/AddCalendarEventDialog";
import { CalendarEventSheet } from "@/components/instructor/CalendarEventSheet";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorCalendar, type CalendarEvent } from "@/hooks/useInstructorCalendar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ViewMode = 'list' | 'calendar' | 'schedule';

export default function InstructorSchedule() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const isMobile = useIsMobile();
  
  // Default to list on mobile, calendar on desktop
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('instructor-schedule-view');
    if (saved && ['list', 'calendar', 'schedule'].includes(saved)) return saved as ViewMode;
    return isMobile ? 'list' : 'calendar';
  });

  const [colorSettingsOpen, setColorSettingsOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Use the calendar hook for schedule view data
  const calendar = useInstructorCalendar(instructorId || '');

  // When switching into the Schedule view, reset the underlying calendar anchor date to today
  // so the fetched range (and month banners) are centered correctly.
  useEffect(() => {
    if (viewMode === 'schedule') {
      calendar.goToDate(new Date());
      // Schedule view expects an extended window (multi-month)
      calendar.refetch(true);
    } else {
      // Other views can keep the default (non-extended) range
      calendar.refetch(false);
    }
  }, [viewMode, calendar.goToDate, calendar.refetch]);

  useEffect(() => {
    localStorage.setItem('instructor-schedule-view', viewMode);
  }, [viewMode]);

  const handleAddEvent = (date?: Date) => {
    // Ensure the data fetch range includes the date the user is adding an event for
    if (date) {
      calendar.goToDate(date);
    }
    setAddEventDate(date || null);
    setAddEventOpen(true);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (event.type === 'external') {
      toast.error('External events can’t be deleted here');
      return;
    }

    const ok = window.confirm(
      event.type === 'lesson'
        ? 'Cancel this lesson?'
        : 'Delete this time block?'
    );
    if (!ok) return;

    try {
      if (event.type === 'block') {
        await calendar.deleteBlock(event.id);
      } else if (event.type === 'lesson') {
        const { error } = await supabase
          .from('scheduled_lessons')
          .update({ status: 'cancelled' })
          .eq('id', event.id);

        if (error) throw error;
        await calendar.refetch();
      }

      // Close sheet if it was open for this event
      setSelectedEvent((curr) => (curr?.id === event.id ? null : curr));
      toast.success('Updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed');
    }
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Schedule</h1>
          </div>
          
          <div className="flex rounded-lg border bg-muted p-0.5 sm:p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1 px-2 sm:px-3 h-8"
            >
              <List className="h-4 w-4" />
              <span className="text-xs sm:text-sm">List</span>
            </Button>
            <Button
              variant={viewMode === 'schedule' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('schedule')}
              className="gap-1 px-2 sm:px-3 h-8"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Schedule</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-1 px-2 sm:px-3 h-8"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Calendar</span>
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <NewMobileScheduleView instructorId={instructorId} />
        ) : viewMode === 'schedule' ? (
          <div className="h-[calc(100vh-12rem)] overflow-hidden">
            <GoogleStyleScheduleView
              events={calendar.events}
              calendarColors={calendar.calendarColors}
              currentDate={calendar.currentDate}
              onNavigate={calendar.navigate}
              loading={calendar.loading}
              onColorSettingsClick={() => setColorSettingsOpen(true)}
              onAddEvent={handleAddEvent}
              onEventClick={(event) => setSelectedEvent(event)}
              onDeleteEvent={handleDeleteEvent}
              onGoToDate={calendar.goToDate}
            />
          </div>
        ) : (
          <div className="h-[calc(100vh-12rem)]">
            <InstructorCalendar instructorId={instructorId} />
          </div>
        )}
      </div>

      <CalendarEventSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={async () => {
          if (selectedEvent) await handleDeleteEvent(selectedEvent);
        }}
        onRefetch={calendar.refetch}
      />

      {/* Color Settings Dialog */}
      <CalendarColorSettings
        open={colorSettingsOpen}
        onOpenChange={setColorSettingsOpen}
        instructorId={instructorId}
        colors={calendar.calendarColors}
        onColorsChange={calendar.setCalendarColors}
      />

      {/* Add Event Dialog - for Schedule view */}
      <AddCalendarEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        instructorId={instructorId}
        defaultDate={addEventDate}
        onSuccess={() => {
          setAddEventOpen(false);
          calendar.refetch();
        }}
      />
    </InstructorPortalLayout>
  );
}
