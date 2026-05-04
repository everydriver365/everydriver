import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { GoogleAddressAutocomplete } from '@/components/admin/GoogleAddressAutocomplete';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { checkLessonClash, describeLessonClashError } from '@/lib/lessonClashCheck';

const BLOCK_COLOR_PRESETS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#2A394F', // indigo
];

interface AddCalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  defaultDate?: Date | null;
  onSuccess: () => void;
}

interface Pupil {
  id: string;
  name: string;
  phone: string;
}

/* ---- iOS field primitives ------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 pb-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#3C3C43]/55">
      {children}
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E5E5EA] overflow-hidden divide-y divide-[#E5E5EA]">
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
  className = '',
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 py-3 min-h-[52px] flex flex-col justify-center gap-1', className)}>
      {label && (
        <div className="text-[12px] font-semibold text-[#3C3C43]/70">{label}</div>
      )}
      {children}
    </div>
  );
}

const iosInputClass =
  'w-full bg-transparent border-0 p-0 text-[16px] text-[#1C1C1E] placeholder:text-[#3C3C43]/40 focus-visible:ring-0 focus-visible:outline-none h-auto shadow-none';

const iosTriggerClass =
  'w-full bg-transparent border-0 p-0 h-auto text-[16px] text-[#1C1C1E] focus:ring-0 focus:ring-offset-0 shadow-none [&>svg]:opacity-50';

/* -------------------------------------------------------------------------- */

export function AddCalendarEventDialog({
  open,
  onOpenChange,
  instructorId,
  defaultDate,
  onSuccess,
}: AddCalendarEventDialogProps) {
  const [tab, setTab] = useState<'block' | 'lesson' | 'event'>('block');
  const [loading, setLoading] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);

  // Block form state
  const [blockTitle, setBlockTitle] = useState('');
  const [blockType, setBlockType] = useState('personal');
  const [blockColor, setBlockColor] = useState(BLOCK_COLOR_PRESETS[0]);
  const [blockDate, setBlockDate] = useState<Date | undefined>(defaultDate || new Date());
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockNotes, setBlockNotes] = useState('');

  // Lesson form state
  const [selectedPupil, setSelectedPupil] = useState('');
  const [lessonDate, setLessonDate] = useState<Date | undefined>(defaultDate || new Date());
  const [lessonStartTime, setLessonStartTime] = useState('09:00');
  const [lessonDuration, setLessonDuration] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(defaultDate || new Date());
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  // Inline error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchPupils();
      setErrors({});
      if (defaultDate) {
        const hours = defaultDate.getHours();
        const formattedTime = `${hours.toString().padStart(2, '0')}:00`;
        setBlockDate(defaultDate);
        setBlockStartTime(formattedTime);
        setBlockEndTime(`${(hours + 1).toString().padStart(2, '0')}:00`);
        setLessonDate(defaultDate);
        setLessonStartTime(formattedTime);
      }
    }
  }, [open, defaultDate]);

  const fetchPupils = async () => {
    const { data, error } = await supabase
      .from('pupils')
      .select('id, name, phone')
      .eq('instructor_id', instructorId)
      .order('name');

    if (!error && data) {
      setPupils(data);
    }
  };

  const resetForm = () => {
    setBlockTitle('');
    setBlockType('personal');
    setBlockColor(BLOCK_COLOR_PRESETS[0]);
    setBlockNotes('');
    setSelectedPupil('');
    setPickupAddress('');
    setErrors({});
  };

  const handleAddBlock = async () => {
    const nextErrors: Record<string, string> = {};
    if (!blockTitle) nextErrors.blockTitle = 'Title is required';
    if (!blockDate) nextErrors.blockDate = 'Date is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const startDateTime = new Date(blockDate!);
      const [startHour, startMin] = blockStartTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(blockDate!);
      const [endHour, endMin] = blockEndTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const { error } = await supabase
        .from('instructor_manual_blocks')
        .insert({
          instructor_id: instructorId,
          title: blockTitle,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          block_type: blockType,
          color: blockColor,
          notes: blockNotes || null,
        });

      if (error) throw error;

      toast.success('Time block added');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Failed to add time block');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedPupil) nextErrors.selectedPupil = 'Please select a pupil';
    if (!lessonDate) nextErrors.lessonDate = 'Date is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const durationHours = parseFloat(lessonDuration);
      const durationMinutes = durationHours * 60;
      const dateStr = format(lessonDate!, 'yyyy-MM-dd');

      // Pre-check for a clash so the user gets a friendly message.
      const clash = await checkLessonClash({
        instructorId,
        date: dateStr,
        startTime: lessonStartTime,
        durationMinutes,
      });
      if (clash.hardOverlap) {
        toast.error(clash.message ?? 'That slot is already booked.');
        return;
      }

      const { error } = await supabase
        .from('scheduled_lessons')
        .insert({
          instructor_id: instructorId,
          pupil_id: selectedPupil,
          lesson_date: dateStr,
          start_time: lessonStartTime,
          duration_minutes: durationMinutes,
          pickup_location: pickupAddress || null,
          status: 'scheduled',
          payment_status: 'unpaid',
        });

      if (error) {
        const friendly = describeLessonClashError(error);
        if (friendly) {
          toast.error(friendly);
          return;
        }
        throw error;
      }

      toast.success('Lesson scheduled');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error adding lesson:', error);
      const friendly = describeLessonClashError(error);
      toast.error(friendly ?? 'Failed to schedule lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    const nextErrors: Record<string, string> = {};
    if (!eventTitle) nextErrors.eventTitle = 'Title is required';
    if (!eventDate) nextErrors.eventDate = 'Date is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const startDateTime = new Date(eventDate!);
      const [sh, sm] = eventStartTime.split(':').map(Number);
      startDateTime.setHours(sh, sm, 0, 0);
      const endDateTime = new Date(eventDate!);
      const [eh, em] = eventEndTime.split(':').map(Number);
      endDateTime.setHours(eh, em, 0, 0);

      const notesParts = [eventLocation && `Location: ${eventLocation}`, eventNotes].filter(Boolean);

      const { error } = await supabase
        .from('instructor_manual_blocks')
        .insert({
          instructor_id: instructorId,
          title: eventTitle,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          block_type: 'event',
          color: '#6B21A8',
          notes: notesParts.join('\n') || null,
        });
      if (error) throw error;

      toast.success('Event added');
      setEventTitle('');
      setEventLocation('');
      setEventNotes('');
      onSuccess();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = Array.from({ length: 28 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  });

  const ErrorText = ({ id }: { id: string }) =>
    errors[id] ? (
      <div className="px-1 pt-1.5 text-[12px] font-medium text-[#E15D5A]">{errors[id]}</div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Override default centered dialog → bottom sheet on mobile, centered card on >=sm
          'p-0 gap-0 border-0 bg-[#F2F2F7] shadow-[0_-12px_40px_-8px_rgba(16,24,40,0.18)] overflow-hidden',
          'rounded-t-[28px] rounded-b-none sm:rounded-[24px]',
          'sm:max-w-[480px] w-full',
          'fixed left-1/2 -translate-x-1/2 bottom-0 top-auto translate-y-0 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2',
          'max-h-[92vh] sm:max-h-[88vh] flex flex-col',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0'
        )}
      >
        {/* Drag handle */}
        <div className="pt-2 pb-1 flex justify-center sm:hidden">
          <div className="h-[5px] w-[36px] rounded-full bg-[#3C3C43]/25" />
        </div>

        {/* Header */}
        <div className="relative px-5 pt-3 pb-4">
          <DialogTitle className="text-[20px] font-semibold tracking-tight text-[#1C1C1E]">
            Add to Calendar
          </DialogTitle>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-3 size-8 rounded-full bg-[#E5E5EA]/70 hover:bg-[#E5E5EA] flex items-center justify-center text-[#3C3C43]/70 active:scale-95 transition-all"
          >
            <X className="size-[16px]" />
          </button>
        </div>

        {/* Segmented control */}
        <div className="px-5 pb-4">
          <div
            role="tablist"
            aria-label="Event type"
            className="grid grid-cols-3 gap-1 p-[3px] rounded-[10px] bg-[#E5E5EA]/70"
          >
            {(['block', 'lesson', 'event'] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                  className={cn(
                    'py-1.5 rounded-[8px] text-[13px] transition-colors',
                    active
                      ? 'bg-white text-[#1C1C1E] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.08)]'
                      : 'text-[#3C3C43]/60 font-medium'
                  )}
                >
                  {t === 'block' ? 'Block Time' : t === 'lesson' ? 'Add Lesson' : 'Add Event'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-6"
          style={{ scrollbarWidth: 'thin' }}
        >
          {tab === 'event' ? (
            <div className="space-y-5">
              <div>
                <SectionLabel>Event</SectionLabel>
                <FieldGroup>
                  <FieldRow label="Title">
                    <Input
                      placeholder="e.g., Driving test, MOT, Training"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className={iosInputClass}
                    />
                  </FieldRow>
                  <FieldRow label="Location">
                    <Input
                      placeholder="Optional"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className={iosInputClass}
                    />
                  </FieldRow>
                </FieldGroup>
                <ErrorText id="eventTitle" />
              </div>

              <div>
                <SectionLabel>When</SectionLabel>
                <FieldGroup>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-4 py-3 min-h-[52px] flex items-center justify-between gap-3 text-left active:bg-black/[0.03] transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[12px] font-semibold text-[#3C3C43]/70">Date</div>
                          <div className="text-[16px] text-[#1C1C1E]">
                            {eventDate ? format(eventDate, 'EEE, d MMM yyyy') : 'Pick a date'}
                          </div>
                        </div>
                        <CalendarIcon className="size-[18px] text-[#3C3C43]/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus />
                    </PopoverContent>
                  </Popover>

                  <div className="grid grid-cols-2 divide-x divide-[#E5E5EA]">
                    <FieldRow label="Start">
                      <Select value={eventStartTime} onValueChange={setEventStartTime}>
                        <SelectTrigger className={iosTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="End">
                      <Select value={eventEndTime} onValueChange={setEventEndTime}>
                        <SelectTrigger className={iosTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                  </div>
                </FieldGroup>
                <ErrorText id="eventDate" />
              </div>

              <div>
                <SectionLabel>Notes</SectionLabel>
                <FieldGroup>
                  <FieldRow label="Notes" className="py-3">
                    <Textarea
                      placeholder="Optional details..."
                      value={eventNotes}
                      onChange={(e) => setEventNotes(e.target.value)}
                      rows={3}
                      className={cn(iosInputClass, 'resize-none min-h-[60px]')}
                    />
                  </FieldRow>
                </FieldGroup>
              </div>
            </div>
          ) : tab === 'block' ? (
            <div className="space-y-5">
              {/* Event */}
              <div>
                <SectionLabel>Event</SectionLabel>
                <FieldGroup>
                  <FieldRow label="Title">
                    <Input
                      placeholder="e.g., Lunch break, Personal appointment"
                      value={blockTitle}
                      onChange={(e) => setBlockTitle(e.target.value)}
                      className={iosInputClass}
                    />
                  </FieldRow>
                  <FieldRow label="Type">
                    <Select value={blockType} onValueChange={setBlockType}>
                      <SelectTrigger className={iosTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-4 py-3 min-h-[52px] flex items-center justify-between gap-3 text-left active:bg-black/[0.03] transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[12px] font-semibold text-[#3C3C43]/70">Colour</div>
                          <div className="text-[16px] text-[#1C1C1E]">Choose colour</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="size-[22px] rounded-full ring-1 ring-black/5"
                            style={{ backgroundColor: blockColor }}
                          />
                          <ChevronDown className="size-[16px] text-[#3C3C43]/50" />
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3 z-50 bg-popover" align="end">
                      <div className="grid grid-cols-5 gap-2">
                        {BLOCK_COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              'h-8 w-8 rounded-full border-2 transition-all',
                              blockColor === color
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'border-transparent hover:scale-110'
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setBlockColor(color)}
                            aria-label={`Select ${color}`}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </FieldGroup>
                <ErrorText id="blockTitle" />
              </div>

              {/* When */}
              <div>
                <SectionLabel>When</SectionLabel>
                <FieldGroup>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-4 py-3 min-h-[52px] flex items-center justify-between gap-3 text-left active:bg-black/[0.03] transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[12px] font-semibold text-[#3C3C43]/70">Date</div>
                          <div className="text-[16px] text-[#1C1C1E]">
                            {blockDate ? format(blockDate, 'EEE, d MMM yyyy') : 'Pick a date'}
                          </div>
                        </div>
                        <CalendarIcon className="size-[18px] text-[#3C3C43]/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={blockDate}
                        onSelect={setBlockDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="grid grid-cols-2 divide-x divide-[#E5E5EA]">
                    <FieldRow label="Start">
                      <Select value={blockStartTime} onValueChange={setBlockStartTime}>
                        <SelectTrigger className={iosTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="End">
                      <Select value={blockEndTime} onValueChange={setBlockEndTime}>
                        <SelectTrigger className={iosTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                  </div>
                </FieldGroup>
                <ErrorText id="blockDate" />
              </div>

              {/* Options */}
              <div>
                <SectionLabel>Options</SectionLabel>
                <FieldGroup>
                  <FieldRow label="Notes" className="py-3">
                    <Textarea
                      placeholder="Add any notes..."
                      value={blockNotes}
                      onChange={(e) => setBlockNotes(e.target.value)}
                      rows={3}
                      className={cn(iosInputClass, 'resize-none min-h-[60px]')}
                    />
                  </FieldRow>
                </FieldGroup>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Event */}
              <div>
                <SectionLabel>Event</SectionLabel>
                <FieldGroup>
                  <FieldRow label="Pupil">
                    <Select value={selectedPupil} onValueChange={setSelectedPupil}>
                      <SelectTrigger className={iosTriggerClass}>
                        <SelectValue placeholder="Select a pupil" />
                      </SelectTrigger>
                      <SelectContent>
                        {pupils.map((pupil) => (
                          <SelectItem key={pupil.id} value={pupil.id}>
                            {pupil.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                </FieldGroup>
                <ErrorText id="selectedPupil" />
              </div>

              {/* When */}
              <div>
                <SectionLabel>When</SectionLabel>
                <FieldGroup>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-4 py-3 min-h-[52px] flex items-center justify-between gap-3 text-left active:bg-black/[0.03] transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[12px] font-semibold text-[#3C3C43]/70">Date</div>
                          <div className="text-[16px] text-[#1C1C1E]">
                            {lessonDate ? format(lessonDate, 'EEE, d MMM yyyy') : 'Pick a date'}
                          </div>
                        </div>
                        <CalendarIcon className="size-[18px] text-[#3C3C43]/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={lessonDate}
                        onSelect={setLessonDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="grid grid-cols-2 divide-x divide-[#E5E5EA]">
                    <FieldRow label="Start">
                      <Select value={lessonStartTime} onValueChange={setLessonStartTime}>
                        <SelectTrigger className={iosTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="Duration">
                      <Select value={lessonDuration} onValueChange={setLessonDuration}>
                        <SelectTrigger className={iosTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="1.5">1.5 hours</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="2.5">2.5 hours</SelectItem>
                          <SelectItem value="3">3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                  </div>
                </FieldGroup>
                <ErrorText id="lessonDate" />
              </div>

              {/* Options */}
              <div>
                <SectionLabel>Options</SectionLabel>
                <FieldGroup>
                  <FieldRow label="Pickup address">
                    <GoogleAddressAutocomplete
                      value={pickupAddress}
                      onChange={setPickupAddress}
                      placeholder="Enter pickup location"
                    />
                  </FieldRow>
                </FieldGroup>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div
          className="px-5 pt-3 bg-white/95 backdrop-blur border-t border-[#E5E5EA]"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <button
            type="button"
            onClick={tab === 'block' ? handleAddBlock : tab === 'lesson' ? handleAddLesson : handleAddEvent}
            disabled={loading}
            className={cn(
              'w-full h-[54px] rounded-[16px] bg-[#007AFF] text-white text-[16px] font-semibold',
              'active:bg-[#0064D2] active:scale-[0.99] transition-all',
              'disabled:opacity-60 disabled:active:scale-100'
            )}
          >
            {loading
              ? 'Saving…'
              : tab === 'block'
              ? 'Save block'
              : tab === 'lesson'
              ? 'Add lesson'
              : 'Add event'}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full h-[44px] mt-2 text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
