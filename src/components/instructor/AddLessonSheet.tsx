import { useState, useEffect } from 'react';
import { format, addWeeks } from 'date-fns';
import { Calendar as CalendarIcon, UserPlus, Users, Loader2, Repeat, Car, CheckSquare, MapPin, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';
import { CompetencyPicker } from './CompetencyPicker';
import { GoogleAddressAutocomplete } from '@/components/admin/GoogleAddressAutocomplete';
import { ExaminerSelector } from './driving-test/ExaminerSelector';

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
    <span style={{ fontSize: 11, fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {children}
    </span>
  );
}

export function AddLessonSheet({ 
  open, 
  onOpenChange, 
  instructorId, 
  defaultDate,
  onSuccess 
}: AddLessonSheetProps) {
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
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [newPupilName, setNewPupilName] = useState('');
  const [newPupilPhone, setNewPupilPhone] = useState('');
  const [newPupilAddress, setNewPupilAddress] = useState('');
  const [newPupilPostcode, setNewPupilPostcode] = useState('');

  const isDrivingTest = lessonType === 'driving_test';
  const currentTypeColor = LESSON_TYPES.find(t => t.value === lessonType)?.color || '#7FB3E3';

  useEffect(() => {
    if (open) {
      fetchPupils();
      if (defaultDate) setLessonDate(defaultDate);
    }
  }, [open, defaultDate]);

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
    setConflictWarning(null);
  };

  useEffect(() => {
    if (selectedPupil) {
      const pupil = pupils.find(p => p.id === selectedPupil);
      if (pupil) { setPickupAddress(pupil.address || ''); setPickupPostcode(pupil.postcode || ''); }
    }
  }, [selectedPupil, pupils]);

  // Conflict check
  useEffect(() => {
    if (!lessonDate || !lessonStartTime || !open) { setConflictWarning(null); return; }
    const checkConflicts = async () => {
      setCheckingConflict(true);
      try {
        const dateStr = format(lessonDate, 'yyyy-MM-dd');
        const durationMinutes = parseFloat(lessonDuration) * 60;
        const [startH, startM] = lessonStartTime.split(':').map(Number);
        const newStartMinutes = startH * 60 + startM;
        const newEndMinutes = newStartMinutes + durationMinutes;
        const { data: existingLessons } = await supabase
          .from('scheduled_lessons')
          .select('start_time, duration_minutes, pupil_id, pupils(name)')
          .eq('instructor_id', instructorId)
          .eq('lesson_date', dateStr)
          .neq('status', 'cancelled');
        if (existingLessons && existingLessons.length > 0) {
          const conflicts = existingLessons.filter((lesson: any) => {
            const [h, m] = (lesson.start_time || '00:00').split(':').map(Number);
            const existingStart = h * 60 + m;
            const existingEnd = existingStart + (lesson.duration_minutes || 60);
            return newStartMinutes < existingEnd && newEndMinutes > existingStart;
          });
          if (conflicts.length > 0) {
            const names = conflicts.map((c: any) => c.pupils?.name || 'Unknown').join(', ');
            setConflictWarning(`Overlaps with ${names}`);
          } else { setConflictWarning(null); }
        } else { setConflictWarning(null); }
      } catch { setConflictWarning(null); }
      finally { setCheckingConflict(false); }
    };
    const timer = setTimeout(checkConflicts, 300);
    return () => clearTimeout(timer);
  }, [lessonDate, lessonStartTime, lessonDuration, instructorId, open]);

  const buildDrivingTestNotes = () => {
    if (!isDrivingTest) return null;
    const centre = testCentres.find(c => c.id === selectedTestCentre);
    return centre ? `Test Centre: ${centre.name}` : null;
  };

  const handleAddLessonExisting = async () => {
    if (!selectedPupil || !lessonDate) { toast.error('Please select a pupil and date'); return; }
    setLoading(true);
    try {
      const durationMinutes = parseFloat(lessonDuration) * 60;
      const weeks = isRecurring ? parseInt(recurrenceWeeks) : 1;
      const testNotes = buildDrivingTestNotes();
      const lessons = [];
      for (let i = 0; i < weeks; i++) {
        const recurringDate = i === 0 ? lessonDate : addWeeks(lessonDate, i);
        lessons.push({
          instructor_id: instructorId, pupil_id: selectedPupil,
          lesson_date: format(recurringDate, 'yyyy-MM-dd'), start_time: lessonStartTime,
          duration_minutes: durationMinutes, pickup_location: pickupAddress || null,
          status: 'scheduled', payment_status: 'not_paid', lesson_type: lessonType,
          recurrence_rule: isRecurring ? `WEEKLY;COUNT=${weeks}` : null,
          planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
          notes: testNotes,
          ...(isDrivingTest && selectedExaminer ? { examiner_id: selectedExaminer } : {}),
        });
      }
      const { error } = await supabase.from('scheduled_lessons').insert(lessons);
      if (error) throw error;
      toast.success(isDrivingTest ? 'Test scheduled!' : isRecurring ? `${weeks} lessons scheduled` : 'Lesson scheduled');
      resetForm(); onOpenChange(false); onSuccess();
    } catch (error) { console.error(error); toast.error('Failed to schedule lesson'); }
    finally { setLoading(false); }
  };

  const handleAddLessonNew = async () => {
    if (!newPupilName.trim() || !lessonDate) { toast.error('Please enter a name and date'); return; }
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
          status: 'scheduled', payment_status: 'not_paid', lesson_type: lessonType,
          recurrence_rule: isRecurring ? `WEEKLY;COUNT=${weeks}` : null,
          planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
          notes: testNotes,
        });
      }
      const { error: lessonError } = await supabase.from('scheduled_lessons').insert(lessons);
      if (lessonError) throw lessonError;
      toast.success(isDrivingTest ? 'Pupil created & test scheduled!' : isRecurring ? `Pupil created & ${weeks} lessons scheduled` : 'Pupil created & lesson scheduled');
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] p-0 border-0"
        style={{ height: "90vh", backgroundColor: "#F7F7F7" }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: "#D4D4D8" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 16px",
        }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{ fontSize: 15, fontWeight: 400, color: "#6B63D6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Cancel
          </button>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#18181B" }}>
            {isDrivingTest ? 'Schedule Test' : 'New Lesson'}
          </span>
          <button
            onClick={tab === 'existing' ? handleAddLessonExisting : handleAddLessonNew}
            disabled={loading}
            style={{
              fontSize: 15, fontWeight: 600,
              color: loading ? "#A1A1AA" : "#6B63D6",
              background: "none", border: "none", cursor: loading ? "default" : "pointer", padding: 0,
            }}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Scrollable form */}
        <div style={{ overflowY: "auto", height: "calc(90vh - 80px)", padding: "0 20px 40px" }}>
          {/* Lesson type chips */}
          <Section>
            <SectionLabel>Lesson Type</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LESSON_TYPES.map((type) => {
                const selected = lessonType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setLessonType(type.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 20,
                      fontSize: 13, fontWeight: 500,
                      cursor: "pointer", border: "none",
                      transition: "all 0.15s",
                      backgroundColor: selected ? type.color : "#FFFFFF",
                      color: selected ? "#18181B" : "#52525B",
                      boxShadow: selected
                        ? `0 2px 8px ${type.color}40`
                        : "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    {type.value === 'driving_test' && '🚗 '}
                    {type.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />

          {/* Pupil selector tabs */}
          <Section>
            <SectionLabel>Pupil</SectionLabel>
            <div style={{
              display: "flex", backgroundColor: "#EAEAEA", padding: 3, borderRadius: 10, marginBottom: 12,
            }}>
              <button
                onClick={() => setTab('existing')}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: "none", cursor: "pointer", transition: "all 0.2s",
                  ...(tab === 'existing'
                    ? { backgroundColor: "#FFFFFF", color: "#18181B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { backgroundColor: "transparent", color: "#71717A" }),
                }}
              >
                <Users style={{ width: 14, height: 14 }} />
                Existing
              </button>
              <button
                onClick={() => setTab('new')}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: "none", cursor: "pointer", transition: "all 0.2s",
                  ...(tab === 'new'
                    ? { backgroundColor: "#FFFFFF", color: "#18181B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { backgroundColor: "transparent", color: "#71717A" }),
                }}
              >
                <UserPlus style={{ width: 14, height: 14 }} />
                New Pupil
              </button>
            </div>

            {tab === 'existing' ? (
              loadingPupils ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#71717A", fontSize: 13 }}>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  Loading pupils...
                </div>
              ) : (
                <Select value={selectedPupil} onValueChange={setSelectedPupil}>
                  <SelectTrigger
                    style={{
                      backgroundColor: "#FFFFFF", borderRadius: 12,
                      border: "1px solid #E4E4E7", padding: "12px 16px",
                      fontSize: 15, height: "auto",
                    }}
                  >
                    <SelectValue placeholder="Choose a pupil..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pupils.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">No pupils yet</div>
                    ) : (
                      pupils.map((pupil) => (
                        <SelectItem key={pupil.id} value={pupil.id}>{pupil.name}</SelectItem>
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
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Address</span>
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7", overflow: "hidden" }}>
                    <GoogleAddressAutocomplete
                      value={newPupilAddress}
                      onChange={setNewPupilAddress}
                      onPostcodeChange={setNewPupilPostcode}
                      placeholder="Start typing an address..."
                    />
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />

          {/* Date & Time */}
          <Section>
            <SectionLabel>Date & Time</SectionLabel>

            {/* Date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", backgroundColor: "#FFFFFF", borderRadius: 12,
                  border: "1px solid #E4E4E7", cursor: "pointer", textAlign: "left",
                }}>
                  <CalendarIcon style={{ width: 18, height: 18, color: "#6B63D6" }} />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 400, color: "#18181B" }}>
                    {lessonDate ? format(lessonDate, 'EEEE, d MMMM yyyy') : 'Pick a date'}
                  </span>
                  <ChevronRight style={{ width: 16, height: 16, color: "#A1A1AA" }} />
                </button>
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

            {/* Time & Duration side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Start Time</span>
                <Select value={lessonStartTime} onValueChange={setLessonStartTime}>
                  <SelectTrigger style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7", height: 48 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Clock style={{ width: 16, height: 16, color: "#6B63D6" }} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Duration</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setLessonDuration(d.value)}
                      style={{
                        flex: 1, padding: "12px 4px", borderRadius: 10,
                        fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                        transition: "all 0.15s",
                        backgroundColor: lessonDuration === d.value ? "#6B63D6" : "#FFFFFF",
                        color: lessonDuration === d.value ? "#FFFFFF" : "#3F3F46",
                        boxShadow: lessonDuration === d.value
                          ? "0 2px 8px rgba(107,99,214,0.3)"
                          : "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conflict Warning */}
            {conflictWarning && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", borderRadius: 12,
                backgroundColor: "#FEF2F2", border: "1px solid #FECACA",
              }}>
                <AlertTriangle style={{ width: 16, height: 16, color: "#DC2626", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#991B1B" }}>{conflictWarning}</span>
              </div>
            )}
          </Section>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />

          {/* Pickup address (existing pupil) */}
          {tab === 'existing' && (
            <Section>
              <SectionLabel>Pickup Location</SectionLabel>
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7", overflow: "hidden" }}>
                <GoogleAddressAutocomplete
                  value={pickupAddress}
                  onChange={setPickupAddress}
                  onPostcodeChange={setPickupPostcode}
                  placeholder="Start typing an address..."
                />
              </div>
            </Section>
          )}

          {/* Driving Test specific fields */}
          {isDrivingTest && (
            <>
              <div style={{ height: 1, backgroundColor: "#E4E4E7", margin: "20px 0" }} />
              <Section>
                <SectionLabel>Test Details</SectionLabel>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Test Centre</span>
                  <Select value={selectedTestCentre} onValueChange={setSelectedTestCentre}>
                    <SelectTrigger style={{ backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7", height: 48 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <MapPin style={{ width: 16, height: 16, color: "#6B63D6" }} />
                        <SelectValue placeholder="Select test centre..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {testCentres.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">No test centres saved</div>
                      ) : (
                        testCentres.map((centre) => (
                          <SelectItem key={centre.id} value={centre.id}>{centre.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 6, display: "block" }}>Examiner (optional)</span>
                  <ExaminerSelector value={selectedExaminer} onChange={setSelectedExaminer} instructorId={instructorId} />
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
                    Test Day Checklist
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
                    <Repeat style={{ width: 16, height: 16, color: "#6B63D6" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#18181B" }}>Weekly recurring</span>
                  </div>
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>

                {isRecurring && (
                  <div style={{ padding: "12px 16px", backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E4E7" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46", marginBottom: 8, display: "block" }}>Repeat for</span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {['2', '4', '6', '8', '10', '12'].map((w) => (
                        <button
                          key={w}
                          onClick={() => setRecurrenceWeeks(w)}
                          style={{
                            padding: "8px 14px", borderRadius: 20,
                            fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                            backgroundColor: recurrenceWeeks === w ? "#6B63D6" : "#F4F4F5",
                            color: recurrenceWeeks === w ? "#FFFFFF" : "#3F3F46",
                          }}
                        >
                          {w} weeks
                        </button>
                      ))}
                    </div>
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
      </SheetContent>
    </Sheet>
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
