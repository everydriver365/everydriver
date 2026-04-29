import { useState, useEffect } from "react";
import { Calendar, List, CalendarDays, ChevronDown, Check, Plus, RefreshCw, CalendarRange } from "lucide-react";
import { ScheduleSkeleton } from "@/components/ui/skeletons/ScheduleSkeleton";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { MultiDayScheduleView } from "@/components/instructor/MultiDayScheduleView";
import { MobileMonthCalendarView } from "@/components/instructor/MobileMonthCalendarView";
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
import { useInstructorAppearance } from "@/hooks/useInstructorAppearance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";

type ViewMode = 'list' | 'month' | 'calendar' | 'schedule';

export default function InstructorSchedule() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const isMobile = useIsMobile();
  const { wallpaperColor } = useInstructorAppearance(instructorId);
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('instructor-schedule-view');
    if (saved && ['list', 'month', 'calendar', 'schedule'].includes(saved)) return saved as ViewMode;
    return isMobile ? 'list' : 'calendar';
  });

  const [colorSettingsOpen, setColorSettingsOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [fabLessonSheetOpen, setFabLessonSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [mobileListRefreshKey, setMobileListRefreshKey] = useState(0);

  const calendar = useInstructorCalendar(instructorId || '');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!instructorId) return;
    setIsSyncing(true);
    try {
      await supabase.functions.invoke("google-calendar-service", {
        body: { action: "fetchExternalEvents", instructorId },
      });
      setMobileListRefreshKey((current) => current + 1);
      calendar.refetch();
      toast.success("Calendar synced");
    } catch {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

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
    if (date) {
      calendar.goToDate(date);
    }
    setAddEventDate(date || null);
    setAddEventOpen(true);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (event.type === 'external') {
      toast.error('External events can\'t be deleted here');
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
        <ScheduleSkeleton />
      </InstructorPortalLayout>
    );
  }

  // Syncing progress bar
  const syncProgressBar = isSyncing ? (
    <div style={{ height: 1, backgroundColor: "#2B7BC8", position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.6, animation: "pulse 1.5s ease-in-out infinite" }} />
  ) : null;

  return (
    <InstructorPortalLayout>
      <div
        className="h-full flex flex-col"
        style={{ backgroundColor: viewMode === 'list' && isMobile ? "#F2F2F4" : "transparent", margin: "-16px -16px 0", padding: viewMode === 'list' && isMobile ? "0" : "0 20px" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-2 sticky top-0 z-20 pt-3 pb-2"
          style={{ backgroundColor: viewMode === 'list' && isMobile ? "#F2F2F4" : "transparent", position: "relative", padding: viewMode === 'list' && isMobile ? "12px 20px 8px" : undefined }}
        >
          {isMobile ? (
            <>
              {/* Mobile toggle: Calendar / Schedule */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#FFFFFF",
                  border: "0.5px solid #E5E5EA",
                  padding: 3,
                  borderRadius: 10,
                }}
              >
                <button
                  onClick={() => setViewMode('month')}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all 0.2s",
                    ...(viewMode === 'month'
                      ? { backgroundColor: "#F2F2F4", color: "#000000" }
                      : { backgroundColor: "transparent", color: "#6E6E73" }),
                  }}
                >
                  <CalendarRange style={{ width: 14, height: 14 }} />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all 0.2s",
                    ...(viewMode === 'list'
                      ? { backgroundColor: "#F2F2F4", color: "#000000" }
                      : { backgroundColor: "transparent", color: "#6E6E73" }),
                  }}
                >
                  <List style={{ width: 14, height: 14 }} />
                  Schedule
                </button>
              </div>

              {/* Center: SCHEDULE label + month */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  Schedule
                </div>
                <div style={{ fontSize: 18, fontWeight: 500, color: "#000000", letterSpacing: "-0.3px" }}>
                  {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </div>
              </div>

              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                style={{
                  width: 38,
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#6E6E73",
                }}
              >
                <RefreshCw style={{ width: 18, height: 18, ...(isSyncing ? { animation: "spin 1s linear infinite" } : {}) }} />
              </button>
            </>
          ) : (
            <>
              <InstructorPageHeader
                lucideIcon={Calendar}
                title="Schedule"
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleSync}
                  disabled={isSyncing}
                  title="Sync Google Calendar"
                >
                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                </Button>
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
                      <List className="h-4 w-4" /> List
                      {viewMode === 'list' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewMode('schedule')} className="cursor-pointer gap-2">
                      <CalendarDays className="h-4 w-4" /> Schedule
                      {viewMode === 'schedule' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewMode('calendar')} className="cursor-pointer gap-2">
                      <Calendar className="h-4 w-4" /> Calendar
                      {viewMode === 'calendar' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
          {syncProgressBar}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto pb-4">
          {viewMode === 'list' ? (
            <MultiDayScheduleView key={mobileListRefreshKey} instructorId={instructorId} />
          ) : viewMode === 'month' ? (
            <MobileMonthCalendarView instructorId={instructorId} />
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
      </div>

      <CalendarEventSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={async () => {
          if (selectedEvent) await handleDeleteEvent(selectedEvent);
        }}
        onRefetch={calendar.refetch}
      />

      <CalendarColorSettings
        open={colorSettingsOpen}
        onOpenChange={setColorSettingsOpen}
        instructorId={instructorId}
        colors={calendar.calendarColors}
        onColorsChange={calendar.setCalendarColors}
      />

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
