import { useState, useEffect, useRef } from 'react';
import { format, addWeeks } from 'date-fns';
import { Calendar as CalendarIcon, UserPlus, Users, Loader2, Repeat, Car, CheckSquare, MapPin, AlertTriangle, Clock, ChevronRight, ChevronDown, CreditCard, Mail, Send, Banknote, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateLessonQueries } from '@/lib/invalidateLessonQueries';
import { checkLessonClash, describeLessonClashError } from '@/lib/lessonClashCheck';
import { cn } from '@/lib/utils';
import { CompetencyPicker } from './CompetencyPicker';
import { GoogleAddressAutocomplete } from '@/components/admin/GoogleAddressAutocomplete';
import { ExaminerSelector } from './driving-test/ExaminerSelector';
import { TestCentrePicker } from './driving-test/TestCentrePicker';
import { SegmentedControl } from '@/components/instructor/ui/SegmentedControl';
import { pupilAvatarColor, pupilAvatarInitial } from '@/lib/pupilAvatarColor';

interface AddLessonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  defaultDate?: Date;
  onSuccess: () => void;
}

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  postcode: string | null;
}

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
}

const TEST_DAY_CHECKLIST = [
  'Provisional driving licence (photocard)',
  'Theory test pass certificate',
  'Glasses or contact lenses (if needed)',
  'Correct mirrors & L plates fitted',
  'Be ready 10 minutes before test time',
];

const LESSON_TYPES = [
  { value: 'standard', label: 'Standard', color: '#7FB3E3' },
  { value: 'intensive', label: 'Intensive', color: '#B3AFF5' },
  { value: 'motorway', label: 'Motorway', color: '#8FCFA5' },
  { value: 'test_prep', label: 'Test Prep', color: '#F4D06F' },
  { value: 'mock_test', label: 'Mock Test', color: '#E89999' },
  { value: 'refresher', label: 'Refresher', color: '#7FB3E3' },
  { value: 'first_lesson', label: 'First Lesson', color: '#8FCFA5' },
  { value: 'pass_plus', label: 'Pass Plus', color: '#B3AFF5' },
  { value: 'driving_test', label: 'Driving Test', color: '#F4D06F' },
];

const DURATIONS = [
  { value: '1', label: '1 hr' },
  { value: '1.5', label: '1.5 hr' },
  { value: '2', label: '2 hr' },
  { value: '2.5', label: '2.5 hr' },
  { value: '3', label: '3 hr' },
];

// Styled section wrapper
function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, color: "#6E6E73",
      textTransform: "uppercase", letterSpacing: 0.3, margin: "0 0 8px",
    }}>
      {children}
    </div>
  );
}

// Premium tile-system palette for lesson types: [tint, icon] colour pair.
const LESSON_TYPE_PALETTE: Record<string, { tint: string; icon: string }> = {
  standard:     { tint: "#E6F1FB", icon: "#2B7BC8" },
  intensive:    { tint: "#E6F1FB", icon: "#2B7BC8" },
  motorway:     { tint: "#E6F1FB", icon: "#2B7BC8" },
  refresher:    { tint: "#E6F1FB", icon: "#2B7BC8" },
  first_lesson: { tint: "#E8F3E8", icon: "#3B8B3B" },
  test_prep:    { tint: "#E8F3E8", icon: "#3B8B3B" },
  pass_plus:    { tint: "#FBF1DE", icon: "#B8801F" },
  mock_test:    { tint: "#FBEAEC", icon: "#C8434F" },
  driving_test: { tint: "#FBEAEC", icon: "#C8434F" },
};
const LESSON_TYPE_FALLBACK = { tint: "#F2F2F4", icon: "#6E6E73" };

function getLessonTypePalette(value: string) {
  return LESSON_TYPE_PALETTE[value] ?? LESSON_TYPE_FALLBACK;
}

// Render-only proper-case (does not mutate stored data).
function toProperCase(name: string): string {
  return name
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (part.match(/^\s+$/) || part === "-") ? part : part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

// Short headline for the conflict banner derived from the existing conflict message.
function getConflictHeadline(message: string | null): string {
  if (!message) return "";
  if (/^overlaps/i.test(message)) return "Lesson clash";
  if (/calendar/i.test(message))  return "Calendar clash";
  if (/test/i.test(message))      return "Test clash";
  return "Heads up";
}

// White hairline-bordered tappable input row used for type / pupil / date.
interface FormInputCardProps {
  iconNode?: React.ReactNode;       // 28×28 tinted tile (or 18×18 placeholder icon)
  iconTint?: string;                 // background of the icon tile
  iconColor?: string;                // stroke colour for the lucide icon
  Icon?: React.ComponentType<{ style?: React.CSSProperties; size?: number }>;
  primary?: React.ReactNode;         // value text
  placeholder?: string;              // shown when primary is empty
  trailing?: React.ReactNode;        // defaults to a chevron-down
  compact?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  asChild?: boolean;                 // when true, render children directly (for shadcn triggers)
  children?: React.ReactNode;
}

function FormInputCard({
  iconNode, iconTint, iconColor, Icon, primary, placeholder, trailing,
  compact, onClick, disabled, children,
}: FormInputCardProps) {
  const padding = compact ? 12 : "12px 14px";
  const iconBox = (Icon || iconNode) ? (
    <div style={{
      width: compact ? 24 : 28, height: compact ? 24 : 28, borderRadius: 7,
      background: iconTint ?? "#F2F2F4",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {iconNode ?? (Icon ? <Icon style={{ width: 16, height: 16, color: iconColor ?? "#6E6E73" }} /> : null)}
    </div>
  ) : null;

  const value = primary ?? <span style={{ color: "#6E6E73", fontWeight: 400 }}>{placeholder}</span>;
  const trailingNode = trailing ?? <ChevronDown style={{ width: 12, height: 12, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.6} />;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding, background: "#FFFFFF", border: "0.5px solid #E5E5EA",
        borderRadius: 10, cursor: disabled ? "default" : "pointer", textAlign: "left",
      }}
    >
      {iconBox}
      <span style={{
        flex: 1, minWidth: 0, fontSize: compact ? 14 : 15, fontWeight: 500,
        color: "#000000", letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {children ?? value}
      </span>
      {trailingNode}
    </button>
  );
}

export function AddLessonSheet({ 
  open, 
  onOpenChange, 
  instructorId, 
  defaultDate,
  onSuccess 
}: AddLessonSheetProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loadingPupils, setLoadingPupils] = useState(false);

  const [lessonType, setLessonType] = useState('standard');
  const [selectedPupil, setSelectedPupil] = useState('');
  const [lessonDate, setLessonDate] = useState<Date | undefined>(defaultDate || new Date());
  const [lessonStartTime, setLessonStartTime] = useState('09:00');
  const [lessonDuration, setLessonDuration] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPostcode, setPickupPostcode] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState('4');
  const [plannedCompetencies, setPlannedCompetencies] = useState<string[]>([]);
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [selectedTestCentre, setSelectedTestCentre] = useState('');
  const [selectedExaminer, setSelectedExaminer] = useState('');
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isHardOverlap, setIsHardOverlap] = useState(false);
  const [travelDetailsOpen, setTravelDetailsOpen] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const pendingCheckRef = useRef<Promise<void> | null>(null);
  const [travelSuggestion, setTravelSuggestion] = useState<{ suggestedTime: string; travelMinutes: number; fromName: string } | null>(null);
  // Soft (non-blocking) travel-time warning — Phase 2. Save is never gated on this.
  const [travelWarning, setTravelWarning] = useState<{
    direction: 'before' | 'after';
    fromName: string;
    toName: string;
    travelMinutes: number;
    gapMinutes: number;
    shortfallMinutes: number;
    suggestedTime?: string;
  } | null>(null);
  const [bufferMinutes, setBufferMinutes] = useState<number>(0);
  const [instructorHomePostcode, setInstructorHomePostcode] = useState<string>('');
  const [overrideBuffer, setOverrideBuffer] = useState(false);
  const [newPupilName, setNewPupilName] = useState('');
  const [newPupilPhone, setNewPupilPhone] = useState('');
  const [newPupilAddress, setNewPupilAddress] = useState('');
  const [newPupilPostcode, setNewPupilPostcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tbc');
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [savedPupilId, setSavedPupilId] = useState<string | null>(null);

  const isDrivingTest = lessonType === 'driving_test';
  const currentTypeColor = LESSON_TYPES.find(t => t.value === lessonType)?.color || '#7FB3E3';

  useEffect(() => {
    if (open) {
      fetchPupils();
      if (defaultDate) setLessonDate(defaultDate);
      // Load instructor buffer + home postcode for conflict/travel checks
      (async () => {
        const { data } = await supabase
          .from('instructors')
          .select('buffer_minutes, home_postcode')
          .eq('id', instructorId)
          .maybeSingle();
        setBufferMinutes(((data as any)?.buffer_minutes as number | null) ?? 0);
        setInstructorHomePostcode(((data as any)?.home_postcode as string | null) ?? '');
      })();
    }
  }, [open, defaultDate, instructorId]);

  useEffect(() => {
    if (isDrivingTest && instructorId) fetchTestCentres();
  }, [isDrivingTest, instructorId]);

  useEffect(() => {
    if (isDrivingTest) {
      setLessonDuration('1');
      setIsRecurring(false);
      setPlannedCompetencies([]);
    }
  }, [isDrivingTest]);

  const fetchPupils = async () => {
    setLoadingPupils(true);
    const { data, error } = await supabase
      .from('pupils')
      .select('id, name, phone, address, postcode')
      .eq('instructor_id', instructorId)
      .order('name');
    if (!error && data) setPupils(data);
    setLoadingPupils(false);
  };

  const fetchTestCentres = async () => {
    const { data: instructorCentres } = await supabase
      .from('instructor_test_centres')
      .select('test_centre_id, test_centres ( id, name, address )')
      .eq('instructor_id', instructorId);
    if (instructorCentres) {
      const centres = instructorCentres.map((ic: any) => ic.test_centres).filter(Boolean) as TestCentre[];
      setTestCentres(centres);
    }
  };

  const resetForm = () => {
    setSelectedPupil(''); setPickupAddress(''); setPickupPostcode('');
    setNewPupilName(''); setNewPupilPhone(''); setNewPupilAddress(''); setNewPupilPostcode('');
    setLessonStartTime('09:00'); setLessonDuration('1');
    setIsRecurring(false); setRecurrenceWeeks('4');
    setPlannedCompetencies([]); setLessonType('standard');
    setSelectedTestCentre(''); setSelectedExaminer('');
    setConflictWarning(null); setIsHardOverlap(false); setPaymentMethod('tbc');
  };

  const handlePostSavePayment = (pupilId: string) => {
    if (paymentMethod === 'send_link' || paymentMethod === 'take_payment') {
      setSavedPupilId(pupilId);
      setShowPostPayment(true);
    }
  };

  useEffect(() => {
    if (selectedPupil) {
      const pupil = pupils.find(p => p.id === selectedPupil);
      if (pupil) { setPickupAddress(pupil.address || ''); setPickupPostcode(pupil.postcode || ''); }
    }
  }, [selectedPupil, pupils]);

  // Conflict check (buffered overlap) + travel-time check (previous + next + first-of-day)
  useEffect(() => {
    if (!lessonDate || !lessonStartTime || !open) {
      setConflictWarning(null); setIsHardOverlap(false);
      setTravelSuggestion(null);
      setTravelWarning(null);
      return;
    }
    // Any change to inputs invalidates a previous override
    setOverrideBuffer(false);
    const run = async () => {
      setCheckingConflict(true);
      try {
        const dateStr = format(lessonDate, 'yyyy-MM-dd');
        const durationMinutes = parseFloat(lessonDuration) * 60;
        const [startH, startM] = lessonStartTime.split(':').map(Number);
        const newStartMinutes = startH * 60 + startM;
        const newEndMinutes = newStartMinutes + durationMinutes;

        // Day window for calendar event query (local day → ISO range)
        const dayStart = new Date(lessonDate); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(lessonDate); dayEnd.setHours(23, 59, 59, 999);

        const [lessonsRes, eventsRes] = await Promise.all([
          supabase
            .from('scheduled_lessons')
            .select('start_time, duration_minutes, pupil_id, pickup_location, dropoff_location, pupils(name, postcode, address)')
            .eq('instructor_id', instructorId)
            .eq('lesson_date', dateStr)
            .neq('status', 'cancelled')
            .order('start_time'),
          supabase
            .from('instructor_calendar_events')
            .select('title, start_time, end_time, is_busy, location')
            .eq('instructor_id', instructorId)
            .eq('is_busy', true)
            .gte('end_time', dayStart.toISOString())
            .lte('start_time', dayEnd.toISOString()),
        ]);

        const existingLessons = lessonsRes.data || [];
        const calendarEvents = eventsRes.data || [];

        // Helper: extract a UK postcode from free-text location, if present
        const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/i;
        const extractPostcode = (loc?: string | null): string => {
          if (!loc) return '';
          const m = loc.match(postcodeRegex);
          return m ? m[0].toUpperCase() : '';
        };

        // Convert UTC timestamp → local minutes-from-midnight, clamped to [0, 1440]
        const tsToLocalMinutes = (iso: string): number => {
          const d = new Date(iso);
          if (d < dayStart) return 0;
          if (d > dayEnd) return 24 * 60;
          return d.getHours() * 60 + d.getMinutes();
        };

        // Normalise both sources into a single shape for the overlap/travel logic
        type Slot = { _start: number; _end: number; _name: string; _postcode: string; _kind: 'lesson' | 'event' };
        const lessonSlots: Slot[] = existingLessons.map((l: any) => {
          const [h, m] = (l.start_time || '00:00').split(':').map(Number);
          const start = h * 60 + m;
          return {
            _start: start,
            _end: start + (l.duration_minutes || 60),
            _name: l.pupils?.name || 'Unknown',
            _postcode: l.pupils?.postcode || '',
            _kind: 'lesson',
          };
        });
        // Detect all-day events (no `all_day` column — infer from duration ≥ 24h).
        // Skip them UNLESS the title indicates a holiday / annual leave / time off.
        const blockingAllDayKeywords = /(holiday|annual leave|vacation|bank holiday|time off|\bleave\b|off work|out of office|\booo\b)/i;
        const isAllDay = (e: any) => {
          const start = new Date(e.start_time).getTime();
          const end = new Date(e.end_time).getTime();
          return (end - start) >= 24 * 60 * 60 * 1000;
        };
        const eventSlots: Slot[] = calendarEvents
          .filter((e: any) => !isAllDay(e) || blockingAllDayKeywords.test(e.title || ''))
          .map((e: any) => ({
            _start: tsToLocalMinutes(e.start_time),
            _end: tsToLocalMinutes(e.end_time),
            _name: e.title || 'Calendar event',
            _postcode: extractPostcode(e.location),
            _kind: 'event',
          }));
        const allSlots: Slot[] = [...lessonSlots, ...eventSlots]
          .filter(s => s._end > s._start)
          .sort((a, b) => a._start - b._start);

        // Determine destination postcode for the new lesson
        let toPostcode = pickupPostcode;
        if (!toPostcode && tab === 'existing' && selectedPupil) {
          const p = pupils.find(x => x.id === selectedPupil);
          toPostcode = p?.postcode || '';
        }
        if (!toPostcode && tab === 'new') toPostcode = newPupilPostcode;

        // 1) Buffered overlap check (min 1-min gap even when buffer is 0)
        const effectiveBuffer = Math.max(bufferMinutes, 1);
        if (allSlots.length > 0) {
          const conflicts = allSlots.filter(slot => {
            const bufferedStart = slot._start - effectiveBuffer;
            const bufferedEnd = slot._end + effectiveBuffer;
            return newStartMinutes < bufferedEnd && newEndMinutes > bufferedStart;
          });
          if (conflicts.length > 0) {
            const names = conflicts.map(c => c._name).join(', ');
            const hardOverlap = conflicts.some(slot =>
              newStartMinutes < slot._end && newEndMinutes > slot._start
            );
            const bufferLabel = bufferMinutes > 0
              ? `needs ${bufferMinutes} min buffer`
              : 'back-to-back, no gap';
            setIsHardOverlap(hardOverlap);
            setConflictWarning(
              hardOverlap
                ? `Overlaps with ${names}`
                : `Too close to ${names} (${bufferLabel})`
            );
            // Fall through — travel-time checks below still run so the amber
            // soft warning can appear alongside the red hard-block banner.
          } else {
            setConflictWarning(null); setIsHardOverlap(false);
          }
        } else {
          setConflictWarning(null); setIsHardOverlap(false);
        }

        const previous = allSlots
          .filter(s => s._end <= newStartMinutes)
          .sort((a, b) => b._end - a._end)[0];

        const next = allSlots
          .filter(s => s._start >= newEndMinutes)
          .sort((a, b) => a._start - b._start)[0];

        // Phase 2: travel-time concerns are SOFT warnings only — they never set
        // conflictWarning and never block Save. Track the most severe shortfall.
        let pendingTravelWarning: typeof travelWarning = null;
        let pendingTravelSuggestion: typeof travelSuggestion = null;

        // 2) Travel from PREVIOUS lesson/event (or instructor home if first of day)
        const fromPostcode = previous?._postcode || (!previous ? instructorHomePostcode : '');
        const fromName = previous?._name || 'home';
        const prevEnd = previous?._end ?? null;

        if (fromPostcode && toPostcode && fromPostcode.trim() && toPostcode.trim()) {
          const gap = prevEnd != null ? newStartMinutes - prevEnd : Infinity;
          try {
            const { data } = await supabase.functions.invoke('check-travel-buffer', {
              body: {
                from_postcode: fromPostcode,
                to_postcode: toPostcode,
                available_gap_minutes: gap,
                padding_minutes: bufferMinutes,
              },
            });
            if (data?.travel_minutes != null) {
              const required = (data.required_minutes ?? data.travel_minutes + bufferMinutes);
              if (prevEnd != null && gap < required) {
                const suggestedMinutes = Math.ceil((prevEnd + required) / 5) * 5;
                const sh = Math.floor(suggestedMinutes / 60);
                const sm = suggestedMinutes % 60;
                const suggestedTime = `${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
                pendingTravelSuggestion = {
                  suggestedTime,
                  travelMinutes: data.travel_minutes,
                  fromName,
                };
                pendingTravelWarning = {
                  direction: 'before',
                  fromName,
                  toName: 'this lesson',
                  travelMinutes: data.travel_minutes,
                  gapMinutes: gap,
                  shortfallMinutes: required - gap,
                  suggestedTime,
                };
              }
            }
          } catch {
            /* swallow — travel check is best-effort */
          }
        }

        // 3) Travel to NEXT lesson/event
        const nextPostcode = next?._postcode || '';
        const nextName = next?._name || 'next lesson';
        if (next && toPostcode && nextPostcode && toPostcode.trim() && nextPostcode.trim()) {
          const gapAfter = next._start - newEndMinutes;
          try {
            const { data } = await supabase.functions.invoke('check-travel-buffer', {
              body: {
                from_postcode: toPostcode,
                to_postcode: nextPostcode,
                available_gap_minutes: gapAfter,
                padding_minutes: bufferMinutes,
              },
            });
            if (data?.travel_minutes != null) {
              const required = (data.required_minutes ?? data.travel_minutes + bufferMinutes);
              if (gapAfter < required) {
                const afterShortfall = required - gapAfter;
                // Keep the more severe of before/after; tie → keep 'before'.
                if (!pendingTravelWarning || afterShortfall > pendingTravelWarning.shortfallMinutes) {
                  pendingTravelWarning = {
                    direction: 'after',
                    fromName: 'this lesson',
                    toName: nextName,
                    travelMinutes: data.travel_minutes,
                    gapMinutes: gapAfter,
                    shortfallMinutes: afterShortfall,
                  };
                }
              }
            }
          } catch {
            /* swallow */
          }
        }

        setTravelSuggestion(pendingTravelSuggestion);
        setTravelWarning(pendingTravelWarning);
      } catch {
        setConflictWarning(null); setIsHardOverlap(false);
        setTravelSuggestion(null);
        setTravelWarning(null);
      } finally {
        setCheckingConflict(false);
      }
    };
    const timer = setTimeout(() => {
      pendingCheckRef.current = run();
    }, 400);
    return () => clearTimeout(timer);
  }, [lessonDate, lessonStartTime, lessonDuration, instructorId, open, selectedPupil, pickupPostcode, newPupilPostcode, tab, pupils, bufferMinutes, instructorHomePostcode]);

  const buildDrivingTestNotes = () => {
    if (!isDrivingTest) return null;
    const centre = testCentres.find(c => c.id === selectedTestCentre);
    return centre ? `Test Centre: ${centre.name}` : null;
  };

  /**
   * Save-time validation: when a driving test has both a test centre and examiner
   * selected, the examiner must be linked to that test centre. Returns true if
   * the booking is allowed to proceed, false if it should be blocked.
   */
  const validateExaminerCentreMatch = async (): Promise<boolean> => {
    if (!isDrivingTest) return true;
    if (!selectedTestCentre || !selectedExaminer) return true;

    const { data, error } = await supabase
      .from('examiners')
      .select('test_centre_id, name')
      .eq('id', selectedExaminer)
      .maybeSingle();

    if (error || !data) {
      toast.error('Could not verify examiner. Please reselect.');
      return false;
    }

    if (data.test_centre_id && data.test_centre_id !== selectedTestCentre) {
      const centre = testCentres.find(c => c.id === selectedTestCentre);
      toast.error(
        `${data.name} is not assigned to ${centre?.name ?? 'this test centre'}. Please pick a matching examiner or change the centre.`
      );
      return false;
    }

    if (!data.test_centre_id) {
      toast.error(
        `${data.name} has no test centre on file. Please update the examiner before scheduling.`
      );
      return false;
    }

    return true;
  };

  const handleAddLessonExisting = async () => {
    if (!selectedPupil || !lessonDate) { toast.error('Please select a pupil and date'); return; }
    if (pendingCheckRef.current) { try { await pendingCheckRef.current; } catch { /* ignore */ } }
    if (conflictWarning && !overrideBuffer) { toast.error(conflictWarning); return; }
    if (!(await validateExaminerCentreMatch())) return;
    setLoading(true);
    try {
      const durationMinutes = parseFloat(lessonDuration) * 60;
      const weeks = isRecurring ? parseInt(recurrenceWeeks) : 1;
      const testNotes = buildDrivingTestNotes();
      const lessons = [];
      const dateStrs: string[] = [];
      for (let i = 0; i < weeks; i++) {
        const recurringDate = i === 0 ? lessonDate : addWeeks(lessonDate, i);
        const dateStr = format(recurringDate, 'yyyy-MM-dd');
        dateStrs.push(dateStr);
        lessons.push({
          instructor_id: instructorId, pupil_id: selectedPupil,
          lesson_date: dateStr, start_time: lessonStartTime,
          duration_minutes: durationMinutes, pickup_location: pickupAddress || null,
          status: 'scheduled', payment_status: paymentMethod === 'cash' ? 'cash' : 'not_paid', 
          payment_method: paymentMethod,
          lesson_type: lessonType,
          recurrence_rule: isRecurring ? `WEEKLY;COUNT=${weeks}` : null,
          planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
          notes: testNotes,
          clash_overridden: overrideBuffer && isHardOverlap,
          ...(isDrivingTest && selectedTestCentre ? { test_centre_id: selectedTestCentre } : {}),
          ...(isDrivingTest && selectedExaminer ? { examiner_id: selectedExaminer } : {}),
        });
      }
      // For recurring lessons, re-check every week (not just the first) so we
      // never silently insert a clash on weeks 2..N — unless the user has
      // explicitly chosen to override the clash.
      if (weeks > 1 && !(overrideBuffer && isHardOverlap)) {
        for (const dateStr of dateStrs) {
          const c = await checkLessonClash({
            instructorId, date: dateStr, startTime: lessonStartTime, durationMinutes,
          });
          if (c.hardOverlap) {
            toast.error(`Week of ${dateStr}: ${c.message ?? 'slot already booked'} — no lessons scheduled`);
            setLoading(false);
            return;
          }
        }
      }
      const { error } = await supabase.from('scheduled_lessons').insert(lessons);
      if (error) {
        const friendly = describeLessonClashError(error);
        if (friendly) { toast.error(friendly); setLoading(false); return; }
        throw error;
      }
      toast.success(isDrivingTest ? 'Test scheduled!' : isRecurring ? `${weeks} lessons scheduled` : 'Lesson scheduled');
      handlePostSavePayment(selectedPupil);
      invalidateLessonQueries(queryClient);
      resetForm(); onOpenChange(false); onSuccess();
    } catch (error) { console.error(error); toast.error('Failed to schedule lesson'); }
    finally { setLoading(false); }
  };

  const handleAddLessonNew = async () => {
    if (!newPupilName.trim() || !lessonDate) { toast.error('Please enter a name and date'); return; }
    if (pendingCheckRef.current) { try { await pendingCheckRef.current; } catch { /* ignore */ } }
    if (conflictWarning && !overrideBuffer) { toast.error(conflictWarning); return; }
    if (!(await validateExaminerCentreMatch())) return;
    setLoading(true);
    try {
      const { data: newPupil, error: pupilError } = await supabase
        .from('pupils')
        .insert({ instructor_id: instructorId, name: newPupilName.trim(), phone: newPupilPhone.trim() || null, address: newPupilAddress.trim() || null, postcode: newPupilPostcode.trim() || null })
        .select('id').single();
      if (pupilError) throw pupilError;
      const durationMinutes = parseFloat(lessonDuration) * 60;
      const weeks = isRecurring ? parseInt(recurrenceWeeks) : 1;
      const testNotes = buildDrivingTestNotes();
      const addr = [newPupilAddress, newPupilPostcode].filter(Boolean).join(', ');
      const lessons = [];
      for (let i = 0; i < weeks; i++) {
        const recurringDate = i === 0 ? lessonDate : addWeeks(lessonDate, i);
        lessons.push({
          instructor_id: instructorId, pupil_id: newPupil.id,
          lesson_date: format(recurringDate, 'yyyy-MM-dd'), start_time: lessonStartTime,
          duration_minutes: durationMinutes, pickup_location: addr || null,
          status: 'scheduled', payment_status: paymentMethod === 'cash' ? 'cash' : 'not_paid',
          payment_method: paymentMethod,
          lesson_type: lessonType,
          recurrence_rule: isRecurring ? `WEEKLY;COUNT=${weeks}` : null,
          planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
          notes: testNotes,
          clash_overridden: overrideBuffer && isHardOverlap,
          ...(isDrivingTest && selectedTestCentre ? { test_centre_id: selectedTestCentre } : {}),
          ...(isDrivingTest && selectedExaminer ? { examiner_id: selectedExaminer } : {}),
        });
      }
      const { error: lessonError } = await supabase.from('scheduled_lessons').insert(lessons);
      if (lessonError) {
        const friendly = describeLessonClashError(lessonError);
        if (friendly) { toast.error(friendly); setLoading(false); return; }
        throw lessonError;
      }
      toast.success(isDrivingTest ? 'Pupil created & test scheduled!' : isRecurring ? `Pupil created & ${weeks} lessons scheduled` : 'Pupil created & lesson scheduled');
      handlePostSavePayment(newPupil.id);
      invalidateLessonQueries(queryClient);
      resetForm(); onOpenChange(false); onSuccess();
    } catch (error) { console.error(error); toast.error('Failed to schedule lesson'); }
    finally { setLoading(false); }
  };

  const timeSlots = Array.from({ length: 28 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  });

  const selectedPupilName = pupils.find(p => p.id === selectedPupil)?.name;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] p-0 border-0"
        style={{ height: "90vh", backgroundColor: "#F2F2F4", display: "flex", flexDirection: "column" }}
      >
        {/* Premium tile-system header */}
        {(() => {
          const saveDisabled = loading || (!!conflictWarning && !overrideBuffer);
          const onSavePress = () => {
            if (saveDisabled) return;
            if (tab === 'existing') handleAddLessonExisting();
            else handleAddLessonNew();
          };
          const titleText = isDrivingTest ? 'Schedule test' : 'New lesson';
          return (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              background: "#FFFFFF",
              borderBottom: "0.5px solid #E5E5EA",
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{
                  background: "transparent", border: "none", padding: 4,
                  flexShrink: 0, fontSize: 14, fontWeight: 500, color: "#2B7BC8",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <span style={{
                flex: 1, textAlign: "center", fontSize: 15, fontWeight: 500,
                color: "#000000", letterSpacing: -0.2,
              }}>
                {titleText}
              </span>
              <button
                type="button"
                onClick={onSavePress}
                disabled={saveDisabled}
                aria-disabled={saveDisabled}
                style={{
                  background: "transparent", border: "none", padding: 4,
                  flexShrink: 0, fontSize: 14, fontWeight: 500, color: "#2B7BC8",
                  opacity: loading ? 0.6 : (saveDisabled ? 0.4 : 1),
                  cursor: loading ? "wait" : (saveDisabled ? "not-allowed" : "pointer"),
                }}
              >
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          );
        })()}

        {/* Scrollable form (white card on grey page) */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 0 40px" }}>
          <div style={{
            background: "#FFFFFF",
            padding: 16,
            display: "flex", flexDirection: "column", gap: 18,
            borderRadius: "0 0 12px 12px",
          }}>
          {/* Lesson type */}
          <Section>
            <SectionLabel>Lesson type</SectionLabel>
            <Select value={lessonType} onValueChange={setLessonType}>
              <SelectTrigger
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", background: "#FFFFFF",
                  border: "0.5px solid #E5E5EA", borderRadius: 10,
                  height: "auto", textAlign: "left",
                }}
              >
                {(() => {
                  const palette = getLessonTypePalette(lessonType);
                  return (
                    <span style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: palette.tint, display: "inline-flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Car style={{ width: 16, height: 16, color: palette.icon }} strokeWidth={2} />
                    </span>
                  );
                })()}
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500,
                  color: "#000000", letterSpacing: -0.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {LESSON_TYPES.map((type) => {
                  const p = getLessonTypePalette(type.value);
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: 5, background: p.tint,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Car style={{ width: 11, height: 11, color: p.icon }} strokeWidth={2} />
                        </span>
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Section>


          {/* Pupil */}
          <Section>
            <SectionLabel>Pupil</SectionLabel>
            <div style={{ marginBottom: 8 }}>
              <SegmentedControl
                value={tab}
                onChange={(v) => setTab(v as 'existing' | 'new')}
                ariaLabel="Pupil source"
                options={[
                  { value: 'existing', label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Users style={{ width: 13, height: 13 }} strokeWidth={2} />
                      Existing
                    </span>
                  )},
                  { value: 'new', label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <UserPlus style={{ width: 13, height: 13 }} strokeWidth={2} />
                      New pupil
                    </span>
                  )},
                ]}
              />
            </div>

            {tab === 'existing' ? (
              loadingPupils ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#6E6E73", fontSize: 13 }}>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  Loading pupils…
                </div>
              ) : (
                <Select value={selectedPupil} onValueChange={setSelectedPupil}>
                  <SelectTrigger
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", background: "#FFFFFF",
                      border: "0.5px solid #E5E5EA", borderRadius: 10,
                      height: "auto", textAlign: "left",
                    }}
                  >
                    {(() => {
                      const pupil = pupils.find(p => p.id === selectedPupil);
                      if (pupil) {
                        const display = toProperCase(pupil.name || '');
                        return (
                          <>
                            <span style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: pupilAvatarColor(pupil.id),
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              color: "#FFFFFF", fontSize: 11, fontWeight: 500, flexShrink: 0,
                            }}>
                              {pupilAvatarInitial(display)}
                            </span>
                            <span style={{
                              flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500,
                              color: "#000000", letterSpacing: -0.2,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {display}
                            </span>
                          </>
                        );
                      }
                      return (
                        <>
                          <Users style={{ width: 18, height: 18, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.8} />
                          <span style={{
                            flex: 1, fontSize: 15, fontWeight: 400, color: "#6E6E73",
                          }}>
                            Select pupil
                          </span>
                        </>
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    {pupils.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">No pupils yet</div>
                    ) : (
                      pupils.map((pupil) => (
                        <SelectItem key={pupil.id} value={pupil.id}>{toProperCase(pupil.name)}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <InputField label="Name" placeholder="John Smith" value={newPupilName} onChange={setNewPupilName} required />
                <InputField label="Phone" placeholder="07123 456789" value={newPupilPhone} onChange={setNewPupilPhone} type="tel" />
                <div>
                  <span style={{ fontSize: 12, color: "#6E6E73", marginBottom: 6, display: "block" }}>Address</span>
                  <GoogleAddressAutocomplete
                    value={newPupilAddress}
                    onChange={setNewPupilAddress}
                    onPostcodeChange={setNewPupilPostcode}
                    placeholder="Start typing an address..."
                  />
                </div>
              </div>
            )}
          </Section>

          {/* Date & time */}
          <Section>
            <SectionLabel>Date & time</SectionLabel>

            {/* Date picker */}
            <Popover>
              <PopoverTrigger
                type="button"
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", background: "#FFFFFF",
                  border: "0.5px solid #E5E5EA", borderRadius: 10,
                  cursor: "pointer", textAlign: "left", marginBottom: 8,
                }}
              >
                <CalendarIcon style={{ width: 18, height: 18, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.8} />
                <span style={{
                  flex: 1, fontSize: 15, fontWeight: 500, color: "#000000", letterSpacing: -0.2,
                }}>
                  {lessonDate ? format(lessonDate, 'EEEE, d MMMM yyyy') : 'Pick a date'}
                </span>
                <ChevronDown style={{ width: 12, height: 12, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.6} />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={lessonDate}
                  onSelect={setLessonDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Start time + Duration */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", paddingLeft: 2 }}>Start time</div>
                <Select value={lessonStartTime} onValueChange={setLessonStartTime}>
                  <SelectTrigger
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: 12, background: "#FFFFFF",
                      border: "0.5px solid #E5E5EA", borderRadius: 10,
                      height: "auto", textAlign: "left",
                    }}
                  >
                    <Clock style={{ width: 16, height: 16, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.8} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#000000" }}>
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", paddingLeft: 2 }}>Duration</div>
                <Select value={lessonDuration} onValueChange={setLessonDuration}>
                  <SelectTrigger
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: 12, background: "#FFFFFF",
                      border: "0.5px solid #E5E5EA", borderRadius: 10,
                      height: "auto", textAlign: "left",
                    }}
                  >
                    <Clock style={{ width: 16, height: 16, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.8} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#000000" }}>
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conflict banner — premium tile-system red block */}
            {conflictWarning && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: 12, borderRadius: 10,
                background: "#FBEAEC", border: "0.5px solid #C8434F",
                marginTop: 8,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#C8434F", flexShrink: 0, marginTop: 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X style={{ width: 12, height: 12, color: "#FFFFFF" }} strokeWidth={2} strokeLinecap="round" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: "#C8434F",
                    letterSpacing: -0.1, margin: "0 0 3px",
                  }}>
                    {getConflictHeadline(conflictWarning)}
                  </div>
                  <div style={{ fontSize: 12, color: "#000000", lineHeight: 1.4, margin: "0 0 8px" }}>
                    {conflictWarning}
                  </div>
                  {travelSuggestion && (
                    <button
                      type="button"
                      onClick={() => {
                        setLessonStartTime(travelSuggestion.suggestedTime);
                        setTravelSuggestion(null);
                      }}
                      style={{
                        padding: 0, background: "none", border: "none",
                        color: "#C8434F", cursor: "pointer", fontSize: 12, fontWeight: 500,
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                    >
                      Use suggested time {travelSuggestion.suggestedTime}
                      <ChevronRight style={{ width: 10, height: 10 }} strokeWidth={2} />
                    </button>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      cursor: "pointer", fontSize: 12, color: "#000000",
                    }}>
                      <input
                        type="checkbox"
                        checked={overrideBuffer}
                        onChange={(e) => setOverrideBuffer(e.target.checked)}
                      />
                      {isHardOverlap ? 'Book anyway (override clash)' : 'Book anyway (override buffer)'}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Travel-time soft warning (Phase 2) — informs only, never blocks Save */}
            {travelWarning && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 16px", borderRadius: 12,
                backgroundColor: "#FFFBEB", border: "1px solid #FDE68A",
              }}>
                <Car style={{ width: 16, height: 16, color: "#92400E", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, fontSize: 13, color: "#92400E", lineHeight: 1.4 }}>
                  <div>
                    {travelWarning.direction === 'before'
                      ? <>Tight travel — only <strong>{travelWarning.gapMinutes} min</strong> after {travelWarning.fromName} for a {travelWarning.travelMinutes} min drive.</>
                      : <>Tight travel — only <strong>{travelWarning.gapMinutes} min</strong> before {travelWarning.toName} for a {travelWarning.travelMinutes} min drive.</>
                    }
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, opacity: 0.85 }}>
                    You can still book this — it's just a heads-up.
                  </div>

                  <button
                    type="button"
                    onClick={() => setTravelDetailsOpen(o => !o)}
                    aria-expanded={travelDetailsOpen}
                    style={{
                      marginTop: 8, padding: 0, background: "none", border: "none",
                      color: "#92400E", cursor: "pointer", fontSize: 12,
                      display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500,
                    }}
                  >
                    {travelDetailsOpen
                      ? <ChevronDown style={{ width: 12, height: 12 }} />
                      : <ChevronRight style={{ width: 12, height: 12 }} />}
                    {travelDetailsOpen ? 'Hide details' : 'Show details'}
                  </button>

                  {travelDetailsOpen && (
                    <div style={{
                      marginTop: 8, padding: 10, borderRadius: 8,
                      backgroundColor: "rgba(146, 64, 14, 0.06)",
                      border: "1px solid rgba(146, 64, 14, 0.15)",
                      fontSize: 12, lineHeight: 1.6,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ opacity: 0.8 }}>Direction</span>
                        <span style={{ fontWeight: 600 }}>
                          {travelWarning.direction === 'before'
                            ? `From ${travelWarning.fromName} → this lesson`
                            : `This lesson → ${travelWarning.toName}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ opacity: 0.8 }}>Drive time</span>
                        <span style={{ fontWeight: 600 }}>{travelWarning.travelMinutes} min</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ opacity: 0.8 }}>Buffer</span>
                        <span style={{ fontWeight: 600 }}>{bufferMinutes} min</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ opacity: 0.8 }}>Required</span>
                        <span style={{ fontWeight: 600 }}>{travelWarning.travelMinutes + bufferMinutes} min</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ opacity: 0.8 }}>Available gap</span>
                        <span style={{ fontWeight: 600 }}>{travelWarning.gapMinutes} min</span>
                      </div>
                      <div style={{
                        display: "flex", justifyContent: "space-between", gap: 8,
                        marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(146, 64, 14, 0.15)",
                      }}>
                        <span style={{ opacity: 0.8 }}>Shortfall</span>
                        <span style={{ fontWeight: 700 }}>{travelWarning.shortfallMinutes} min short</span>
                      </div>
                    </div>
                  )}

                  {travelWarning.direction === 'before' && travelWarning.suggestedTime && (
                    <button
                      type="button"
                      onClick={() => {
                        const t = travelWarning.suggestedTime!;
                        setLessonStartTime(t);
                        setTravelWarning(null);
                        setTravelSuggestion(null);
                        setTravelDetailsOpen(false);
                      }}
                      style={{
                        marginTop: 6, padding: 0, background: "none", border: "none",
                        color: "#1E3A8A", textDecoration: "underline", cursor: "pointer", fontSize: 13,
                        display: "block",
                      }}
                    >
                      Use suggested time {travelWarning.suggestedTime}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* All clear (green) — no clashes and travel time sufficient */}
            {!conflictWarning && !travelWarning && !travelSuggestion && !checkingConflict && lessonDate && lessonStartTime && (
              <div
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 16px", borderRadius: 12,
                  backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0",
                }}
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 style={{ width: 16, height: 16, color: "#047857", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: "#065F46", lineHeight: 1.4, fontWeight: 600 }}>
                  All OK — no clashes and travel time looks fine.
                </div>
              </div>
            )}

            {/* Travel-time Suggestion (blue informational — only when no warning of any kind) */}
            {!conflictWarning && !travelWarning && travelSuggestion && (
              <button
                type="button"
                onClick={() => {
                  setLessonStartTime(travelSuggestion.suggestedTime);
                  setTravelSuggestion(null);
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 16px", borderRadius: 12,
                  backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE",
                  textAlign: "left", cursor: "pointer",
                }}
              >
                <Sparkles style={{ width: 16, height: 16, color: "#2A394F", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: "#1E3A8A", lineHeight: 1.4 }}>
                  {travelSuggestion.travelMinutes} min drive from {travelSuggestion.fromName}.
                  Tap to start at <strong>{travelSuggestion.suggestedTime}</strong>.
                </div>
              </button>
            )}
          </Section>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />

          {/* Pickup address (existing pupil) */}
          {tab === 'existing' && (
            <Section>
              <SectionLabel>Pickup</SectionLabel>
              <GoogleAddressAutocomplete
                value={pickupAddress}
                onChange={setPickupAddress}
                onPostcodeChange={setPickupPostcode}
                placeholder="Start typing an address..."
              />
            </Section>
          )}

          {/* Driving Test specific fields */}
          {isDrivingTest && (
            <>
              <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />
              <Section>
                <SectionLabel>Test details</SectionLabel>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Test centre</span>
                  <TestCentrePicker
                    value={selectedTestCentre}
                    onChange={(id, centre) => {
                      setSelectedTestCentre(id);
                      // If pickup empty and centre has address, prefill so the route logs cleanly
                      if (centre && !pickupAddress) {
                        const addr = [centre.address, centre.postcode].filter(Boolean).join(', ');
                        if (addr) setPickupAddress(addr);
                      }
                    }}
                    instructorId={instructorId}
                  />
                  <span style={{ fontSize: 11, color: "#71717A", marginTop: 6, display: "block" }}>
                    Search any UK test centre — your saved centres appear first.
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Test time</span>
                  <Select value={lessonStartTime} onValueChange={setLessonStartTime}>
                    <SelectTrigger style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7", height: 48 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Clock style={{ width: 16, height: 16, color: "#2A394F" }} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[260px]">
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Examiner (optional)</span>
                  <ExaminerSelector
                    value={selectedExaminer}
                    onChange={setSelectedExaminer}
                    instructorId={instructorId}
                    testCentreId={selectedTestCentre || null}
                  />
                  <span style={{ fontSize: 11, color: "#71717A", marginTop: 6, display: "block" }}>
                    Examiners linked to the chosen test centre appear first.
                  </span>
                </div>

                {/* Checklist */}
                <Collapsible open={checklistOpen} onOpenChange={setChecklistOpen}>
                  <CollapsibleTrigger style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "12px 16px", borderRadius: 12,
                    backgroundColor: "#FDF8EE", border: "1px solid #F4D06F",
                    fontSize: 13, fontWeight: 600, color: "#5C4A0F", cursor: "pointer",
                  }}>
                    <CheckSquare style={{ width: 16, height: 16 }} />
                    Test day checklist
                    <span style={{ marginLeft: "auto", fontSize: 12 }}>
                      {checklistOpen ? '▾' : '▸'}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div style={{ padding: "12px 16px", marginTop: 8, borderRadius: 12, backgroundColor: "#FFFFFF", border: "1px solid #E4E4E7" }}>
                      <div className="space-y-3">
                        {TEST_DAY_CHECKLIST.map((item, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Checkbox id={`checklist-${i}`} className="mt-0.5" />
                            <label htmlFor={`checklist-${i}`} style={{ fontSize: 13, color: "#52525B", cursor: "pointer", lineHeight: 1.4 }}>
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Section>
            </>
          )}

          {/* Recurring & Skills */}
          {!isDrivingTest && (
            <>
              <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />
              <Section>
                <SectionLabel>Options</SectionLabel>

                {/* Recurring toggle */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", backgroundColor: "#FFFFFF", borderRadius: 12,
                  border: "1px solid #E4E4E7",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Repeat style={{ width: 16, height: 16, color: "#2A394F" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#18181B" }}>Weekly recurring</span>
                  </div>
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>

                {isRecurring && (
                  <div style={{ padding: "12px 16px", backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 8, display: "block" }}>Repeat for</span>
                    <Select value={recurrenceWeeks} onValueChange={setRecurrenceWeeks}>
                      <SelectTrigger style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7", height: 48 }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['2', '4', '6', '8', '10', '12'].map((w) => (
                          <SelectItem key={w} value={w}>{w} weeks</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p style={{ fontSize: 12, color: "#A1A1AA", marginTop: 8 }}>
                      Creates {recurrenceWeeks} lessons, same time every {lessonDate ? format(lessonDate, 'EEEE') : 'week'}
                    </p>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Skills to Practice</span>
                  <CompetencyPicker selected={plannedCompetencies} onChange={setPlannedCompetencies} />
                </div>
              </Section>
            </>
          )}

          {/* Payment */}
          <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />
          <Section>
            <SectionLabel>Payment</SectionLabel>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7", height: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard style={{ width: 16, height: 16, color: "#2A394F" }} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tbc">TBC — Decide Later</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="send_link">Send Payment Link</SelectItem>
                <SelectItem value="take_payment">Take Payment Now (QR)</SelectItem>
              </SelectContent>
            </Select>
            {paymentMethod === 'send_link' && (
              <p style={{ fontSize: 12, color: "#A1A1AA", marginTop: 4 }}>
                A payment link will be sent after saving
              </p>
            )}
            {paymentMethod === 'take_payment' && (
              <p style={{ fontSize: 12, color: "#A1A1AA", marginTop: 4 }}>
                A payment page / QR code will open after saving
              </p>
            )}
          </Section>

          {/* Summary card */}
          {(selectedPupil || newPupilName) && lessonDate && (
            <>
              <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />
              <div style={{
                backgroundColor: currentTypeColor,
                borderRadius: 12, padding: "16px 20px",
              }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#18181B" }}>
                  {tab === 'existing' ? (selectedPupilName || 'Unknown') : newPupilName}
                </div>
                <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(24,24,27,0.7)", marginTop: 4 }}>
                  {lessonDate && format(lessonDate, 'EEE d MMM')} · {lessonStartTime} · {lessonDuration}hr
                  {isRecurring && ` · ${recurrenceWeeks}wk recurring`}
                </div>
                {pickupAddress && (
                  <div style={{ fontSize: 12, color: "rgba(24,24,27,0.6)", marginTop: 4 }}>
                    📍 {pickupAddress}
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* Post-Save Payment Dialog */}
    <Dialog open={showPostPayment} onOpenChange={setShowPostPayment}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Action
          </DialogTitle>
          <DialogDescription>
            What would you like to do now?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {paymentMethod === 'send_link' && savedPupilId && (
            <>
              {/* Email send option removed — instructor email actions disabled */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={async () => {
                  if (!savedPupilId) return;
                  try {
                    const { data: pupilData } = await supabase.from("pupils").select("name, phone").eq("id", savedPupilId).single();
                    if (pupilData?.phone) {
                      await supabase.functions.invoke("send-payment-link", {
                        body: { instructorId, pupilId: savedPupilId, method: "sms" },
                      });
                      toast.success(`Payment link sent to ${pupilData.phone}`);
                    } else {
                      toast.error("No phone number on file");
                    }
                  } catch { toast.error("Failed to send payment link"); }
                  setShowPostPayment(false);
                }}
              >
                <Send className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-sm">Send via SMS</p>
                  <p className="text-xs text-muted-foreground">Text a payment link to the pupil</p>
                </div>
              </Button>
            </>
          )}
          {paymentMethod === 'take_payment' && (
            <Button
              className="w-full justify-start gap-3 h-12"
              onClick={async () => {
                setShowPostPayment(false);
                const { data: inst } = await supabase.from("instructors").select("app_slug").eq("id", instructorId).single();
                if (inst?.app_slug) {
                  window.open(`/pay/${inst.app_slug}`, '_blank');
                } else {
                  toast.info("Payment page not configured yet");
                }
              }}
            >
              <Banknote className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium text-sm">Open Payment Page</p>
                <p className="text-xs opacity-80">Show QR code or payment page</p>
              </div>
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => setShowPostPayment(false)}>
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Simple styled input field
function InputField({
  label, placeholder, value, onChange, required, type = "text"
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>
        {label}{required && ' *'}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "12px 16px", fontSize: 15,
          backgroundColor: "#FFFFFF", borderRadius: 12,
          border: "1px solid #E4E4E7", outline: "none",
          color: "#18181B",
        }}
      />
    </div>
  );
}
