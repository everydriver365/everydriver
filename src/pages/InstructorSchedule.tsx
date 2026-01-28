import { useState, useEffect } from "react";
import { Calendar, List, CalendarDays } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { NewMobileScheduleView } from "@/components/instructor/NewMobileScheduleView";
import { InstructorCalendar } from "@/components/instructor/InstructorCalendar";
import { GoogleStyleScheduleView } from "@/components/instructor/GoogleStyleScheduleView";
import { CalendarColorSettings } from "@/components/instructor/CalendarColorSettings";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorCalendar } from "@/hooks/useInstructorCalendar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // Use the calendar hook for schedule view data
  const calendar = useInstructorCalendar(instructorId || '');

  useEffect(() => {
    localStorage.setItem('instructor-schedule-view', viewMode);
  }, [viewMode]);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Schedule</h1>
          </div>
          
          <div className="flex rounded-lg border bg-muted p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === 'schedule' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('schedule')}
              className="gap-1"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-1"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <NewMobileScheduleView instructorId={instructorId} />
        ) : viewMode === 'schedule' ? (
          <div className="h-[calc(100vh-12rem)]">
            <GoogleStyleScheduleView
              events={calendar.events}
              calendarColors={calendar.calendarColors}
              currentDate={calendar.currentDate}
              onNavigate={calendar.navigate}
              loading={calendar.loading}
              onColorSettingsClick={() => setColorSettingsOpen(true)}
              onEventClick={(event) => {
                // TODO: Open event detail sheet
                console.log('Event clicked:', event);
              }}
            />
          </div>
        ) : (
          <div className="h-[calc(100vh-12rem)]">
            <InstructorCalendar instructorId={instructorId} />
          </div>
        )}
      </div>

      {/* Color Settings Dialog */}
      <CalendarColorSettings
        open={colorSettingsOpen}
        onOpenChange={setColorSettingsOpen}
        instructorId={instructorId}
        colors={calendar.calendarColors}
        onColorsChange={calendar.setCalendarColors}
      />
    </InstructorPortalLayout>
  );
}
