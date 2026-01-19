import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, isSameDay, isToday, startOfWeek, startOfMonth, addDays, addHours, startOfDay, differenceInMinutes, addMonths, subMonths, isSameMonth, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ShareSettings {
  id: string;
  instructor_id: string;
  share_token: string;
  is_enabled: boolean;
  show_lesson_details: boolean;
  show_blocks: boolean;
  show_external_events: boolean;
  title: string | null;
}

interface Instructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  brand_colour: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'lesson' | 'block' | 'external';
}

const HOUR_HEIGHT = 48;
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export default function PublicAvailability() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ShareSettings | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (shareToken) {
      fetchData();
    }
  }, [shareToken, currentDate, view]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch share settings
      const { data: shareData, error: shareError } = await supabase
        .from('instructor_calendar_shares')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_enabled', true)
        .maybeSingle();

      if (shareError) throw shareError;
      if (!shareData) {
        setError('This calendar is not available or the link has expired.');
        setLoading(false);
        return;
      }

      setSettings(shareData as ShareSettings);

      // Fetch instructor details
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructors')
        .select('id, name, profile_image_url, brand_colour')
        .eq('id', shareData.instructor_id)
        .single();

      if (instructorError) throw instructorError;
      setInstructor(instructorData);

      // Calculate date range
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = addDays(startOfMonth(addMonths(currentDate, 1)), -1);
      
      const rangeStart = view === 'week' ? weekStart : monthStart;
      const rangeEnd = view === 'week' ? weekEnd : monthEnd;

      const calendarEvents: CalendarEvent[] = [];

      // Fetch lessons (always fetch, but control what to show)
      const { data: lessons } = await supabase
        .from('scheduled_lessons')
        .select('id, lesson_date, start_time, duration_minutes, pupils (name)')
        .eq('instructor_id', shareData.instructor_id)
        .gte('lesson_date', format(rangeStart, 'yyyy-MM-dd'))
        .lte('lesson_date', format(rangeEnd, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');

      if (lessons) {
        lessons.forEach((lesson: any) => {
          const startDate = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
          const endDate = new Date(startDate.getTime() + (lesson.duration_minutes || 60) * 60 * 1000);
          
          calendarEvents.push({
            id: lesson.id,
            title: shareData.show_lesson_details && lesson.pupils?.name 
              ? lesson.pupils.name 
              : 'Busy',
            start: startDate,
            end: endDate,
            type: 'lesson',
          });
        });
      }

      // Fetch blocks if enabled
      if (shareData.show_blocks) {
        const { data: blocks } = await supabase
          .from('instructor_manual_blocks')
          .select('id, title, start_datetime, end_datetime')
          .eq('instructor_id', shareData.instructor_id)
          .gte('start_datetime', rangeStart.toISOString())
          .lte('end_datetime', rangeEnd.toISOString());

        if (blocks) {
          blocks.forEach((block: any) => {
            calendarEvents.push({
              id: block.id,
              title: block.title || 'Busy',
              start: new Date(block.start_datetime),
              end: new Date(block.end_datetime),
              type: 'block',
            });
          });
        }
      }

      // Fetch external events if enabled
      if (shareData.show_external_events) {
        const { data: externalEvents } = await supabase
          .from('instructor_calendar_events')
          .select('id, title, start_time, end_time')
          .eq('instructor_id', shareData.instructor_id)
          .gte('start_time', rangeStart.toISOString())
          .lte('end_time', rangeEnd.toISOString());

        if (externalEvents) {
          externalEvents.forEach((event: any) => {
            calendarEvents.push({
              id: event.id,
              title: 'Busy',
              start: new Date(event.start_time),
              end: new Date(event.end_time),
              type: 'external',
            });
          });
        }
      }

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(current => {
      if (view === 'week') {
        return direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1);
      }
      return direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
    });
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

  const getEventStyle = (event: CalendarEvent, dayStart: Date) => {
    const startMinutes = differenceInMinutes(event.start, addHours(startOfDay(dayStart), START_HOUR));
    const duration = differenceInMinutes(event.end, event.start);
    const top = Math.max(0, (startMinutes / 60) * HOUR_HEIGHT);
    const height = Math.max(24, (duration / 60) * HOUR_HEIGHT);
    return { top, height };
  };

  const brandColor = instructor?.brand_colour || '#10b981';

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Calendar Not Available</h1>
            <p className="text-muted-foreground">{error}</p>
            <Link to="/">
              <Button className="mt-6">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div 
        className="py-6 px-4 sm:px-8"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {instructor?.profile_image_url ? (
              <img 
                src={instructor.profile_image_url} 
                alt={instructor.name}
                className="w-12 h-12 rounded-full object-cover border-2"
                style={{ borderColor: brandColor }}
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: brandColor }}
              >
                {instructor?.name?.charAt(0) || 'I'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{settings?.title || `${instructor?.name}'s Availability`}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {view === 'week' 
                  ? `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-muted p-1">
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
              >
                Month
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {view === 'week' ? (
          <div className="bg-card rounded-lg border overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b bg-muted/30">
              <div className="p-2 text-xs text-muted-foreground" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 text-center border-l",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-8 relative">
              {/* Time Column */}
              <div>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 text-xs text-muted-foreground text-right pr-2 -mt-2"
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
                      "border-l relative",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="h-12 border-b border-dashed border-muted"
                      />
                    ))}

                    {dayEvents.map((event) => {
                      const style = getEventStyle(event, day);
                      return (
                        <div
                          key={event.id}
                          className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs text-white overflow-hidden"
                          style={{
                            top: style.top,
                            height: style.height,
                            backgroundColor: event.type === 'lesson' ? brandColor : '#6b7280',
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {style.height > 30 && (
                            <div className="text-[10px] opacity-80">
                              {format(event.start, 'h:mm a')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <MonthCalendarView
            currentDate={currentDate}
            events={events}
            brandColor={brandColor}
          />
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: brandColor }}
            />
            <span>Booked</span>
          </div>
          {(settings?.show_blocks || settings?.show_external_events) && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-500" />
              <span>Busy</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MonthCalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  brandColor: string;
}

function MonthCalendarView({ currentDate, events, brandColor }: MonthCalendarViewProps) {
  const monthStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const weeks = Array.from({ length: 6 }, (_, weekIndex) => 
    Array.from({ length: 7 }, (_, dayIndex) => addDays(monthStart, weekIndex * 7 + dayIndex))
  );

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-rows-6">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[80px] p-1 border-r last:border-r-0",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1 py-0.5 rounded truncate text-white"
                        style={{ 
                          backgroundColor: event.type === 'lesson' ? brandColor : '#6b7280' 
                        }}
                      >
                        {format(event.start, 'h:mma')}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayEvents.length - 2} more
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
