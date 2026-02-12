import { useState, useEffect } from "react";
import { Calendar, List, CalendarDays, ChevronDown, Check, Plus } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { NewMobileScheduleView } from "@/components/instructor/NewMobileScheduleView";
import { InstructorCalendar } from "@/components/instructor/InstructorCalendar";
import { GoogleStyleScheduleView } from "@/components/instructor/GoogleStyleScheduleView";
import { CalendarColorSettings } from "@/components/instructor/CalendarColorSettings";
import { AddCalendarEventDialog } from "@/components/instructor/AddCalendarEventDialog";
import { CalendarEventSheet } from "@/components/instructor/CalendarEventSheet";
import { ScheduleFAB } from "@/components/instructor/ScheduleFAB";
import { WeeklySummaryWidget } from "@/components/instructor/WeeklySummaryWidget";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorCalendar, type CalendarEvent } from "@/hooks/useInstructorCalendar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [fabLessonSheetOpen, setFabLessonSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Use the calendar hook for schedule view data
  const calendar = useInstructorCalendar(instructorId || '');

  useEffect(() => {
    if (viewMode === 'schedule') {
      calendar.goToDate(new Date());
      calendar.setExtendedRange(true);
    } else {
      calendar.setExtendedRange(false);
    }
  }, [viewMode]);

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
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 sticky top-0 z-20 bg-background py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b sm:border-b-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#0075c9]/10 dark:bg-[#0075c9]/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-[#0075c9]" />
            </div>
            <h1 className="text-xl font-bold">Schedule</h1>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  {viewMode === 'list' && <List className="h-3.5 w-3.5" />}
                  {viewMode === 'schedule' && <CalendarDays className="h-3.5 w-3.5" />}
                  {viewMode === 'calendar' && <Calendar className="h-3.5 w-3.5" />}
                  <span className="text-xs capitalize">{viewMode === 'calendar' ? 'Calendar' : viewMode === 'schedule' ? 'Schedule' : 'List'}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-popover border shadow-lg z-50">
                <DropdownMenuItem onClick={() => setViewMode('list')} className="cursor-pointer gap-2">
                  <List className="h-4 w-4" />
                  List
                  {viewMode === 'list' && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('schedule')} className="cursor-pointer gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Schedule
                  {viewMode === 'schedule' && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('calendar')} className="cursor-pointer gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                  {viewMode === 'calendar' && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setFabLessonSheetOpen(true)}
            >
              <Plus className="h-4 w-4" />
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


      {/* FAB Add Lesson Sheet */}
      <AddLessonSheet
        open={fabLessonSheetOpen}
        onOpenChange={setFabLessonSheetOpen}
        instructorId={instructorId}
        onSuccess={() => {
          setFabLessonSheetOpen(false);
          calendar.refetch();
        }}
      />
    </InstructorPortalLayout>
  );
}
