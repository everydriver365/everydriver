import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon, Clock, Sparkles, AlertTriangle, Loader2,
  GraduationCap, MapPin, User, Mail, Phone, Check, ChevronsUpDown, CalendarCheck,
  ChevronDown, X,
} from "lucide-react";
import { PupilPickerSheet } from "@/components/instructor/PupilPickerSheet";
import { SectionLabel } from "@/components/instructor/ui/SectionLabel";
import { FormInputCard } from "@/components/instructor/ui/FormInputCard";
import { TestCentrePicker } from "@/components/instructor/ui/TestCentrePicker";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { buildCoursePreview } from "./buildCoursePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<DayKey, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

interface DayWindow { enabled: boolean; start: string; end: string }

const DEFAULT_AVAILABILITY: Record<DayKey, DayWindow> = {
  mon: { enabled: true, start: "09:00", end: "17:00" },
  tue: { enabled: true, start: "09:00", end: "17:00" },
  wed: { enabled: true, start: "09:00", end: "17:00" },
  thu: { enabled: true, start: "09:00", end: "17:00" },
  fri: { enabled: true, start: "09:00", end: "17:00" },
  sat: { enabled: false, start: "09:00", end: "13:00" },
  sun: { enabled: false, start: "09:00", end: "13:00" },
};

export type CoursePlannerMode = "instructor" | "public";

export interface CoursePlannerFormProps {
  mode: CoursePlannerMode;
  instructorId?: string | null;
  instructorName?: string | null;
  source?: "instructor_app" | "mini_website" | "drive365";
  defaultPupilId?: string;
  defaultPupilName?: string;
  /** layout: 'sheet' uses sticky footer for bottom-sheet; 'page' uses inline footer for full-screen */
  layout?: "sheet" | "page";
  /** Called after successful save/book/close (for sheet to close itself) */
  onComplete?: () => void;
  /** Optional header content; if omitted, default header rendered */
  showHeader?: boolean;
}

interface PlannerResult {
  feasible: boolean;
  shortfall_hours: number;
  suggested_start_date: string | null;
  pattern_summary: {
    lessons_per_week: number;
    lesson_length_minutes: number;
    days: { day: string; window: string }[];
    first_lesson_date: string | null;
    last_lesson_date: string | null;
    lessons_scheduled: number;
    lessons_needed: number;
  };
  slots: { date: string; start_time: string; end_time: string; duration_minutes: number }[];
  days_until_test: number;
}

export function CoursePlannerForm({
  mode,
  instructorId,
  instructorName,
  source = "instructor_app",
  defaultPupilId,
  defaultPupilName,
  layout = "page",
  onComplete,
  showHeader = true,
}: CoursePlannerFormProps) {
  const [pupilName, setPupilName] = useState(defaultPupilName || "");
  const [pupilEmail, setPupilEmail] = useState("");
  const [pupilPhone, setPupilPhone] = useState("");
  const [pupilPostcode, setPupilPostcode] = useState("");
  const [testDate, setTestDate] = useState<Date | undefined>();
  const [testTime, setTestTime] = useState("10:00");
  const [testCentreId, setTestCentreId] = useState<string>("");
  const [testCentreName, setTestCentreName] = useState<string>("");
  const [testCentres, setTestCentres] = useState<Array<{ id: string; name: string; postcode: string | null }>>([]);
  const [centrePickerOpen, setCentrePickerOpen] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState("20");
  const [lessonLength, setLessonLength] = useState("120");
  const [lessonsPerWeek, setLessonsPerWeek] = useState("2");
  const [availability, setAvailability] = useState<Record<DayKey, DayWindow>>(DEFAULT_AVAILABILITY);

  const [pupils, setPupils] = useState<Array<{ id: string; name: string; phone: string | null; email: string | null; profile_image_url: string | null }>>([]);
  const [selectedPupilId, setSelectedPupilId] = useState<string | null>(defaultPupilId || null);
  const [selectedPupilName, setSelectedPupilName] = useState<string | null>(defaultPupilName || null);
  const [pupilPickerOpen, setPupilPickerOpen] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [step, setStep] = useState<"form" | "result">("form");

  useEffect(() => {
    if (testCentres.length > 0) return;
    supabase
      .from("test_centres")
      .select("id, name, postcode")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => { if (data) setTestCentres(data as any); });
  }, [testCentres.length]);

  useEffect(() => {
    if (mode !== "instructor" || !instructorId || defaultPupilId) return;
    if (pupils.length > 0) return;
    supabase
      .from("pupils")
      .select("id, name, phone, email, profile_image_url")
      .eq("instructor_id", instructorId)
      .order("name")
      .then(({ data }) => { if (data) setPupils(data as any); });
  }, [mode, instructorId, defaultPupilId, pupils.length]);

  const effectivePupilId = selectedPupilId ?? defaultPupilId ?? null;
  const effectivePupilName = selectedPupilName ?? defaultPupilName ?? null;

  const updateDay = (key: DayKey, patch: Partial<DayWindow>) => {
    setAvailability((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleGenerate = async () => {
    if (!testDate) { toast.error("Pick a test date"); return; }
    const hours = Number(hoursRemaining);
    if (!hours || hours < 1) { toast.error("Enter hours remaining"); return; }
    const enabledCount = DAY_KEYS.filter((k) => availability[k].enabled).length;
    if (enabledCount === 0) { toast.error("Select at least one available day"); return; }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("course-planner", {
        body: {
          instructor_id: instructorId || null,
          test_date: format(testDate, "yyyy-MM-dd"),
          test_time: testTime,
          hours_remaining: hours,
          lesson_length_minutes: Number(lessonLength),
          lessons_per_week: Number(lessonsPerWeek),
          weekly_availability: availability,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as PlannerResult);
      setStep("result");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!result || !testDate) return;
    setSaving(true);
    try {
      const payload: any = {
        instructor_id: instructorId || null,
        pupil_id: effectivePupilId || null,
        lead_name: pupilName || effectivePupilName || null,
        lead_email: pupilEmail || null,
        lead_phone: pupilPhone || null,
        lead_postcode: pupilPostcode || null,
        test_date: format(testDate, "yyyy-MM-dd"),
        test_time: testTime || null,
        test_centre_name: testCentreName || null,
        hours_remaining: Number(hoursRemaining),
        lesson_length_minutes: Number(lessonLength),
        lessons_per_week: Number(lessonsPerWeek),
        weekly_availability: availability,
        pattern_summary: result.pattern_summary,
        generated_slots: result.slots,
        feasible: result.feasible,
        shortfall_hours: result.shortfall_hours,
        status: "draft",
        source,
      };
      const { error } = await supabase.from("course_proposals").insert(payload);
      if (error) throw error;
      toast.success(
        mode === "instructor"
          ? "Saved as draft proposal — review in your diary"
          : "Plan sent! Your instructor will be in touch.",
      );
      onComplete?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save proposal");
    } finally {
      setSaving(false);
    }
  };

  const handleBookAll = async () => {
    if (!result || !testDate) return;
    if (!instructorId) { toast.error("Need an instructor to book lessons"); return; }
    if (!effectivePupilId) { toast.error("Pick a pupil to enable direct booking"); return; }
    if (result.slots.length === 0) { toast.error("No slots to book"); return; }

    setBooking(true);
    try {
      const lessons = result.slots.map((s) => ({
        instructor_id: instructorId,
        pupil_id: effectivePupilId,
        lesson_date: s.date,
        start_time: s.start_time,
        duration_minutes: s.duration_minutes,
        status: "scheduled",
        payment_status: "not_paid",
        lesson_type: "lesson",
        notes: testCentreName ? `Course Plan · Test at ${testCentreName}` : "Course Plan",
      }));

      const { error: lessonError } = await supabase.from("scheduled_lessons").insert(lessons);
      if (lessonError) throw lessonError;

      await supabase.from("course_proposals").insert({
        instructor_id: instructorId,
        pupil_id: effectivePupilId,
        lead_name: pupilName || effectivePupilName || null,
        test_date: format(testDate, "yyyy-MM-dd"),
        test_time: testTime || null,
        test_centre_name: testCentreName || null,
        hours_remaining: Number(hoursRemaining),
        lesson_length_minutes: Number(lessonLength),
        lessons_per_week: Number(lessonsPerWeek),
        weekly_availability: availability,
        pattern_summary: result.pattern_summary,
        generated_slots: result.slots,
        feasible: result.feasible,
        shortfall_hours: result.shortfall_hours,
        status: "booked",
        source,
      } as any);

      toast.success(`Booked all ${lessons.length} lessons into the diary`);
      onComplete?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to book lessons");
    } finally {
      setBooking(false);
    }
  };

  const footerSticky = layout === "sheet";

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="px-5 pt-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#E8ECF1] flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-[#2A394F]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold leading-tight">Course Planner</h2>
              {instructorName && (
                <p className="text-xs text-muted-foreground">Planning with {instructorName}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={
          step === "form" && !showHeader
            ? { padding: 0, background: "transparent" }
            : { padding: "16px 20px" }
        }
      >
        {step === "form" ? (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {mode === "public" && (
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Details</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Your name" value={pupilName} onChange={(e) => setPupilName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Email" type="email" value={pupilEmail} onChange={(e) => setPupilEmail(e.target.value)} />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Phone" type="tel" value={pupilPhone} onChange={(e) => setPupilPhone(e.target.value)} />
                    </div>
                  </div>
                  {source === "drive365" && (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Postcode (we'll match an instructor)" value={pupilPostcode} onChange={(e) => setPupilPostcode(e.target.value.toUpperCase())} />
                    </div>
                  )}
                </div>
              </section>
            )}

            {mode === "instructor" && (
              <section>
                <SectionLabel>Pupil</SectionLabel>
                {defaultPupilId ? (
                  <FormInputCard
                    asDiv
                    icon={
                      <UserAvatar
                        name={defaultPupilName || effectivePupilName || "?"}
                        size={28}
                      />
                    }
                    value={defaultPupilName || effectivePupilName || ""}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPupilPickerOpen(true)}
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      border: "0.5px solid #E5E5EA",
                      borderRadius: 10,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {effectivePupilName ? (
                      <>
                        <UserAvatar name={effectivePupilName} size={28} />
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 15,
                            fontWeight: 500,
                            color: "#000000",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {effectivePupilName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPupilId(null);
                            setSelectedPupilName(null);
                            setPupilName("");
                          }}
                          aria-label="Clear pupil"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 4,
                            cursor: "pointer",
                            display: "inline-flex",
                            color: "#6E6E73",
                            flexShrink: 0,
                          }}
                        >
                          <X size={14} strokeWidth={1.8} />
                        </button>
                      </>
                    ) : (
                      <>
                        <User size={18} strokeWidth={1.8} color="#6E6E73" style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 400, color: "#6E6E73" }}>
                          Pick a pupil <span style={{ color: "#C7C7CC" }}>— optional</span>
                        </span>
                      </>
                    )}
                    <ChevronDown size={12} strokeWidth={1.6} color="#6E6E73" style={{ flexShrink: 0 }} />
                  </button>
                )}
                <p style={{ fontSize: 11, color: "#6E6E73", margin: "6px 0 0", paddingLeft: 2 }}>
                  Add a pupil now to book directly into your diary, or plan ahead without one.
                </p>
              </section>
            )}

            <section>
              <SectionLabel>Driving test</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 8 }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" style={{ all: "unset", display: "block", width: "100%" }}>
                      <FormInputCard
                        asDiv
                        topLabel="Date"
                        icon={<CalendarIcon size={16} strokeWidth={1.8} />}
                        placeholder="Pick date"
                        value={testDate ? format(testDate, "d MMM") : ""}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={testDate} onSelect={setTestDate} disabled={(d) => d < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <div>
                  <div style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", paddingLeft: 2 }}>Time</div>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "0.5px solid #E5E5EA",
                      borderRadius: 10,
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                    }}
                  >
                    <Clock size={16} strokeWidth={1.8} color="#6E6E73" style={{ flexShrink: 0 }} />
                    <input
                      type="time"
                      value={testTime}
                      onChange={(e) => setTestTime(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#000000",
                        padding: 0,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
              </div>
              <TestCentrePicker
                selectedId={testCentreId || null}
                selectedName={testCentreName || null}
                onSelect={(c) => { setTestCentreId(c.id); setTestCentreName(c.name); }}
              />
              {!testCentreName && testCentres.length > 0 && (
                <div style={{ height: 0, overflow: "hidden" }} aria-hidden>{testCentres.length}</div>
              )}
            </section>

            <section>
              <SectionLabel>Course details</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", paddingLeft: 2 }}>Total hours</div>
                  <Select value={hoursRemaining} onValueChange={setHoursRemaining}>
                    <SelectTrigger
                      style={{
                        background: "#FFFFFF",
                        border: "0.5px solid #E5E5EA",
                        borderRadius: 10,
                        padding: "12px",
                        height: "auto",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#000000",
                      }}
                    >
                      <span>{hoursRemaining}h</span>
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}h</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", paddingLeft: 2 }}>Lesson length</div>
                  <Select value={lessonLength} onValueChange={setLessonLength}>
                    <SelectTrigger
                      style={{
                        background: "#FFFFFF",
                        border: "0.5px solid #E5E5EA",
                        borderRadius: 10,
                        padding: "12px",
                        height: "auto",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#000000",
                      }}
                    >
                      <span>
                        {lessonLength === "60" && "1h"}
                        {lessonLength === "90" && "1h 30m"}
                        {lessonLength === "120" && "2h"}
                        {lessonLength === "150" && "2h 30m"}
                        {lessonLength === "180" && "3h"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1h</SelectItem>
                      <SelectItem value="90">1h 30m</SelectItem>
                      <SelectItem value="120">2h</SelectItem>
                      <SelectItem value="150">2h 30m</SelectItem>
                      <SelectItem value="180">3h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", paddingLeft: 2 }}>Lessons per week</div>
                <Select value={lessonsPerWeek} onValueChange={setLessonsPerWeek}>
                  <SelectTrigger
                    style={{
                      background: "#FFFFFF",
                      border: "0.5px solid #E5E5EA",
                      borderRadius: 10,
                      padding: "12px",
                      height: "auto",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#000000",
                    }}
                  >
                    <span>{lessonsPerWeek}× per week</span>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}× per week</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <CoursePreviewCard
              totalHours={Number(hoursRemaining) || null}
              lessonLengthMinutes={Number(lessonLength) || null}
              testDate={testDate || null}
              testCentreName={testCentreName || null}
              pupilName={effectivePupilName}
            />

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">When You Can Have Lessons</p>
              <div className="rounded-lg border divide-y">
                {DAY_KEYS.map((k) => {
                  const w = availability[k];
                  return (
                    <div key={k} className="flex items-center gap-1.5 px-2 py-1.5 min-w-0">
                      <Switch checked={w.enabled} onCheckedChange={(v) => updateDay(k, { enabled: v })} />
                      <span className="w-9 text-xs font-medium">{DAY_LABEL[k]}</span>
                      <Input type="time" disabled={!w.enabled} value={w.start} onChange={(e) => updateDay(k, { start: e.target.value })} className="h-9 flex-1 min-w-0 text-xs px-2" />
                      <span className="text-[11px] text-muted-foreground">to</span>
                      <Input type="time" disabled={!w.enabled} value={w.end} onChange={(e) => updateDay(k, { end: e.target.value })} className="h-9 flex-1 min-w-0 text-xs px-2" />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : result ? (
          <div className="space-y-5">
            <div className={cn(
              "rounded-xl px-4 py-3 flex items-start gap-3",
              result.feasible ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200",
            )}>
              {result.feasible
                ? <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
              <div className="flex-1 text-sm">
                {result.feasible ? (
                  <>
                    <p className="font-semibold text-emerald-900">All {hoursRemaining} hours fit before test day</p>
                    {result.suggested_start_date && (
                      <p className="text-emerald-800 mt-0.5">
                        Suggested start: <strong>{format(parseISO(result.suggested_start_date), "EEE d MMM")}</strong>
                        {" · "}{result.pattern_summary.lessons_scheduled} lessons over {Math.ceil(result.days_until_test / 7)} weeks
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-amber-900">Short by {result.shortfall_hours} hours</p>
                    <p className="text-amber-800 mt-0.5">Try adding more days or starting sooner. Booked {result.pattern_summary.lessons_scheduled} of {result.pattern_summary.lessons_needed} lessons.</p>
                  </>
                )}
              </div>
            </div>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weekly Pattern</p>
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {result.pattern_summary.days.map((d) => (
                    <Badge key={d.day} variant="secondary" className="font-medium">
                      {d.day} {d.window}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span><Clock className="inline h-3 w-3 mr-1" />{result.pattern_summary.lesson_length_minutes / 60} hr lessons</span>
                  <span>{result.pattern_summary.lessons_per_week}× per week</span>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                All {result.slots.length} Lessons
              </p>
              <div className="rounded-xl border divide-y bg-card">
                {result.slots.map((s, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{format(parseISO(s.date), "EEE d MMM")}</div>
                      <div className="text-xs text-muted-foreground">{s.start_time} – {s.end_time}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                  </div>
                ))}
                {result.slots.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No fitting slots found — adjust your availability.
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          step === "form" && !showHeader ? "px-0 pt-3" : "border-t bg-card px-5 py-3",
          footerSticky && "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        )}
      >
        {step === "form" ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !testDate}
            style={{
              width: "100%",
              background: "#2B7BC8",
              border: "none",
              borderRadius: 10,
              padding: 14,
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 500,
              cursor: generating || !testDate ? "not-allowed" : "pointer",
              opacity: generating || !testDate ? 0.4 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <>Generate schedule</>}
          </button>
        ) : result ? (
          <div className="space-y-2">
            {mode === "instructor" && instructorId && (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleBookAll}
                disabled={booking || saving || result.slots.length === 0 || !result.feasible || !effectivePupilId}
              >
                {booking
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking {result.slots.length} lessons…</>
                  : <><CalendarCheck className="mr-2 h-4 w-4" /> Book all {result.slots.length} lessons into diary</>}
              </Button>
            )}
            {mode === "instructor" && !effectivePupilId && (
              <p className="text-[11px] text-center text-muted-foreground">Pick a pupil on the form to enable direct booking.</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("form")} disabled={booking || saving}>
                Revise plan
              </Button>
              <Button className="flex-1 bg-[#2A394F] hover:bg-[#1F2B3D] text-white" onClick={handleSaveDraft} disabled={saving || booking || result.slots.length === 0}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save as draft"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface CoursePreviewCardProps {
  totalHours: number | null;
  lessonLengthMinutes: number | null;
  testDate: Date | null;
  testCentreName: string | null;
  pupilName: string | null;
}

function CoursePreviewCard(props: CoursePreviewCardProps) {
  const preview = useMemo(
    () => buildCoursePreview(props),
    [props.totalHours, props.lessonLengthMinutes, props.testDate, props.testCentreName, props.pupilName],
  );

  if (!preview.bold && !preview.helper) return null;

  return (
    <div style={{ background: "#F2F2F4", borderRadius: 10, padding: 12 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#6E6E73",
          letterSpacing: "0.3px",
          textTransform: "uppercase",
          margin: "0 0 6px",
        }}
      >
        Preview
      </p>
      {preview.bold ? (
        <p style={{ fontSize: 13, color: "#000000", margin: 0, lineHeight: 1.4 }}>
          <strong style={{ fontWeight: 500 }}>{preview.bold}</strong>
          {preview.rest}
        </p>
      ) : null}
      {preview.helper && (
        <p style={{ fontSize: 12, color: "#6E6E73", margin: "4px 0 0", lineHeight: 1.4 }}>
          {preview.helper}
        </p>
      )}
      {preview.hint && (
        <p style={{ fontSize: 11, color: "#6E6E73", margin: "6px 0 0", lineHeight: 1.4 }}>
          {preview.hint}
        </p>
      )}
    </div>
  );
}
