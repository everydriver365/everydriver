import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface ClashSlot {
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  kind: 'lesson' | 'event';
}

export interface ClashResult {
  hardOverlap: boolean;
  bufferOnly: boolean;
  clashes: ClashSlot[];
  message: string | null;
}

interface CheckArgs {
  instructorId: string;
  date: Date | string;       // Date object or YYYY-MM-DD
  startTime: string;          // HH:mm
  durationMinutes: number;
  bufferMinutes?: number;
  excludeLessonId?: string;
}

const ALL_DAY_BLOCKING = /(holiday|annual leave|vacation|bank holiday|time off|\bleave\b|off work|out of office|\booo\b)/i;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fromMinutes(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Centralised lesson clash check.
 * Queries existing scheduled_lessons + busy calendar events for the instructor on the given day.
 * Returns hard overlap (true time conflict) and buffer-only (within buffer but not overlapping).
 */
export async function checkLessonClash(args: CheckArgs): Promise<ClashResult> {
  const {
    instructorId,
    date,
    startTime,
    durationMinutes,
    bufferMinutes = 0,
    excludeLessonId,
  } = args;

  const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
  const newStart = toMinutes(startTime);
  const newEnd = newStart + durationMinutes;

  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999`);

  let lessonsQuery = supabase
    .from('scheduled_lessons')
    .select('id, start_time, duration_minutes, pupils(name)')
    .eq('instructor_id', instructorId)
    .eq('lesson_date', dateStr)
    .neq('status', 'cancelled')
    .is('deleted_at', null);

  if (excludeLessonId) {
    lessonsQuery = lessonsQuery.neq('id', excludeLessonId);
  }

  const [lessonsRes, eventsRes, blocksRes] = await Promise.all([
    lessonsQuery,
    supabase
      .from('instructor_calendar_events')
      .select('title, start_time, end_time, is_busy')
      .eq('instructor_id', instructorId)
      .eq('is_busy', true)
      .gte('end_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString()),
    supabase
      .from('instructor_manual_blocks')
      .select('title, start_datetime, end_datetime')
      .eq('instructor_id', instructorId)
      .gte('end_datetime', dayStart.toISOString())
      .lte('start_datetime', dayEnd.toISOString()),
  ]);

  const lessons = lessonsRes.data || [];
  const events = eventsRes.data || [];
  const blocks = blocksRes.data || [];

  type Slot = { start: number; end: number; name: string; kind: 'lesson' | 'event' };

  const lessonSlots: Slot[] = lessons.map((l: any) => {
    const s = toMinutes(l.start_time || '00:00');
    return {
      start: s,
      end: s + (l.duration_minutes || 60),
      name: l.pupils?.name || 'Lesson',
      kind: 'lesson',
    };
  });

  const tsToMin = (iso: string) => {
    const d = new Date(iso);
    if (d < dayStart) return 0;
    if (d > dayEnd) return 24 * 60;
    return d.getHours() * 60 + d.getMinutes();
  };

  const eventSlots: Slot[] = events
    .filter((e: any) => {
      const dur = new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
      const isAllDay = dur >= 24 * 60 * 60 * 1000;
      return !isAllDay || ALL_DAY_BLOCKING.test(e.title || '');
    })
    .map((e: any) => ({
      start: tsToMin(e.start_time),
      end: tsToMin(e.end_time),
      name: e.title || 'Calendar event',
      kind: 'event' as const,
    }))
    .filter((s) => s.end > s.start);

  const all = [...lessonSlots, ...eventSlots];

  const hardClashes = all.filter((s) => newStart < s.end && newEnd > s.start);
  const buffer = Math.max(bufferMinutes, 0);
  const bufferClashes = buffer > 0
    ? all.filter((s) =>
        !(newStart < s.end && newEnd > s.start) &&
        newStart < s.end + buffer && newEnd > s.start - buffer
      )
    : [];

  const hardOverlap = hardClashes.length > 0;
  const bufferOnly = !hardOverlap && bufferClashes.length > 0;

  const reported = hardOverlap ? hardClashes : bufferClashes;
  const clashes: ClashSlot[] = reported.map((s) => ({
    name: s.name,
    startTime: fromMinutes(s.start),
    endTime: fromMinutes(s.end),
    kind: s.kind,
  }));

  let message: string | null = null;
  if (hardOverlap) {
    message = `Overlaps with ${clashes.map((c) => c.name).join(', ')}`;
  } else if (bufferOnly) {
    message = `Too close to ${clashes.map((c) => c.name).join(', ')} (needs ${buffer} min buffer)`;
  }

  return { hardOverlap, bufferOnly, clashes, message };
}

/**
 * Maps a Supabase / Postgres error from an insert or update on
 * `scheduled_lessons` into a human-friendly clash message, or returns null
 * when the error is unrelated. The DB trigger `prevent_lesson_clash` raises
 * with ERRCODE `check_violation` (23514) and a message starting with
 * "Lesson clash:". Some clients surface the code, others only the message.
 */
export function describeLessonClashError(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as { code?: string; message?: string };
  const msg = e.message || '';
  if (e.code === '23514' || e.code === 'check_violation' || /Lesson clash/i.test(msg)) {
    return "That slot is already booked. Please pick another time.";
  }
  return null;
}

