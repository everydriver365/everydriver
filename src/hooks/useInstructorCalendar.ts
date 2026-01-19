import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { CalendarColors, DEFAULT_CALENDAR_COLORS } from '@/components/instructor/CalendarColorSettings';

export type CalendarView = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'lesson' | 'external' | 'block';
  color?: string;
  data?: any;
}

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string | null;
  pickup_location: string | null;
  status: string;
  payment_status: string | null;
  pupils: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

interface CalendarExternalEvent {
  id: string;
  external_event_id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  is_busy: boolean | null;
}

interface ManualBlock {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  block_type: string;
  notes: string | null;
}

export function useInstructorCalendar(instructorId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [calendarColors, setCalendarColors] = useState<CalendarColors>(DEFAULT_CALENDAR_COLORS);

  // Fetch instructor's calendar color preferences
  useEffect(() => {
    const fetchColors = async () => {
      if (!instructorId) return;
      const { data } = await supabase
        .from('instructors')
        .select('calendar_colors')
        .eq('id', instructorId)
        .single();
      
      if (data?.calendar_colors) {
        setCalendarColors(data.calendar_colors as unknown as CalendarColors);
      }
    };
    fetchColors();
  }, [instructorId]);

  const getDateRange = useCallback((date: Date, viewType: CalendarView) => {
    switch (viewType) {
      case 'day':
        return { start: startOfDay(date), end: endOfDay(date) };
      case 'week':
        return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(date), end: endOfMonth(date) };
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!instructorId) return;
    
    setLoading(true);
    const { start, end } = getDateRange(currentDate, view);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    try {
      // Fetch scheduled lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('scheduled_lessons')
        .select(`
          id, lesson_date, start_time, duration_minutes, lesson_type,
          pickup_location, status, payment_status,
          pupils (id, name, phone)
        `)
        .eq('instructor_id', instructorId)
        .gte('lesson_date', startStr)
        .lte('lesson_date', endStr)
        .neq('status', 'cancelled');

      if (lessonsError) throw lessonsError;

      // Fetch external calendar events
      const { data: externalEvents, error: externalError } = await supabase
        .from('instructor_calendar_events')
        .select('id, external_event_id, title, start_time, end_time, is_busy')
        .eq('instructor_id', instructorId)
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString());

      if (externalError) throw externalError;

      // Fetch manual blocks
      const { data: blocks, error: blocksError } = await supabase
        .from('instructor_manual_blocks')
        .select('id, title, start_datetime, end_datetime, block_type, notes')
        .eq('instructor_id', instructorId)
        .gte('start_datetime', start.toISOString())
        .lte('end_datetime', end.toISOString());

      if (blocksError) throw blocksError;

      // Transform to unified CalendarEvent format
      const calendarEvents: CalendarEvent[] = [];

      // Add lessons
      (lessons as ScheduledLesson[] || []).forEach(lesson => {
        const pupil = lesson.pupils;
        const startDate = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
        // Calculate end time from duration_minutes
        const endDate = new Date(startDate.getTime() + (lesson.duration_minutes || 60) * 60 * 1000);
        
        calendarEvents.push({
          id: lesson.id,
          title: pupil?.name || 'Lesson',
          start: startDate,
          end: endDate,
          type: 'lesson',
          data: {
            ...lesson,
            duration_hours: (lesson.duration_minutes || 60) / 60,
            pickup_address: lesson.pickup_location,
          },
        });
      });

      // Add external events
      (externalEvents as CalendarExternalEvent[] || []).forEach(event => {
        calendarEvents.push({
          id: event.id,
          title: event.title || 'Busy',
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          type: 'external',
          data: event,
        });
      });

      // Add manual blocks
      (blocks as ManualBlock[] || []).forEach(block => {
        calendarEvents.push({
          id: block.id,
          title: block.title,
          start: new Date(block.start_datetime),
          end: new Date(block.end_datetime),
          type: 'block',
          data: block,
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [instructorId, currentDate, view, getDateRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const navigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    setCurrentDate(current => {
      if (direction === 'today') return new Date();
      
      const modifier = direction === 'prev' ? -1 : 1;
      switch (view) {
        case 'day':
          return direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        case 'week':
          return direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1);
        case 'month':
          return direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
      }
    });
  }, [view]);

  const addBlock = useCallback(async (block: {
    title: string;
    start: Date;
    end: Date;
    blockType: string;
    notes?: string;
  }) => {
    const { error } = await supabase
      .from('instructor_manual_blocks')
      .insert({
        instructor_id: instructorId,
        title: block.title,
        start_datetime: block.start.toISOString(),
        end_datetime: block.end.toISOString(),
        block_type: block.blockType,
        notes: block.notes || null,
      });

    if (error) throw error;
    await fetchEvents();
  }, [instructorId, fetchEvents]);

  const updateBlock = useCallback(async (blockId: string, updates: {
    title?: string;
    start?: Date;
    end?: Date;
    blockType?: string;
    notes?: string;
  }) => {
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.start) updateData.start_datetime = updates.start.toISOString();
    if (updates.end) updateData.end_datetime = updates.end.toISOString();
    if (updates.blockType) updateData.block_type = updates.blockType;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('instructor_manual_blocks')
      .update(updateData)
      .eq('id', blockId);

    if (error) throw error;
    await fetchEvents();
  }, [fetchEvents]);

  const deleteBlock = useCallback(async (blockId: string) => {
    const { error } = await supabase
      .from('instructor_manual_blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw error;
    await fetchEvents();
  }, [fetchEvents]);

  // Reschedule a lesson (drag and drop)
  const rescheduleLesson = useCallback(async (lessonId: string, newDate: Date, newStartTime: string) => {
    const { error } = await supabase
      .from('scheduled_lessons')
      .update({
        lesson_date: format(newDate, 'yyyy-MM-dd'),
        start_time: newStartTime,
      })
      .eq('id', lessonId);

    if (error) throw error;
    await fetchEvents();
  }, [fetchEvents]);

  // Reschedule a block (drag and drop)
  const rescheduleBlock = useCallback(async (blockId: string, newStart: Date, newEnd: Date) => {
    const { error } = await supabase
      .from('instructor_manual_blocks')
      .update({
        start_datetime: newStart.toISOString(),
        end_datetime: newEnd.toISOString(),
      })
      .eq('id', blockId);

    if (error) throw error;
    await fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    currentDate,
    view,
    setView,
    navigate,
    refetch: fetchEvents,
    addBlock,
    updateBlock,
    deleteBlock,
    rescheduleLesson,
    rescheduleBlock,
    calendarColors,
    setCalendarColors,
    getDateRange,
  };
}
