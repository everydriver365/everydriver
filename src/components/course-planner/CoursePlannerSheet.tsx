import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon, Clock, Sparkles, AlertTriangle, Loader2,
  GraduationCap, MapPin, User, Mail, Phone, Check, ChevronsUpDown, CalendarCheck,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

interface CoursePlannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CoursePlannerMode;
  /** required when mode === 'instructor' (or when an instructor has been matched) */
  instructorId?: string | null;
  /** display name shown in the header (e.g. instructor's name on a mini-site) */
  instructorName?: string | null;
  /** 'mini_website' | 'drive365' | 'instructor_app' — recorded as source */
  source?: "instructor_app" | "mini_website" | "drive365";
  /** UI variant — sheet on mobile, dialog on desktop */
  variant?: "sheet" | "dialog";
  /** optional pupil to prefill in instructor mode */
  defaultPupilId?: string;
  defaultPupilName?: string;
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

export function CoursePlannerSheet({
  open,
  onOpenChange,
  mode,
  instructorId,
  instructorName,
  source = "instructor_app",
  variant = "sheet",
  defaultPupilId,
  defaultPupilName,
}: CoursePlannerSheetProps) {
  // Form state
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

  // Result state
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [step, setStep] = useState<"form" | "result">("form");

  // Load test centres once when sheet opens
  useEffect(() => {
    if (!open || testCentres.length > 0) return;
    supabase
      .from("test_centres")
      .select("id, name, postcode")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setTestCentres(data as any);
      });
  }, [open, testCentres.length]);

  const reset = () => {
    setResult(null);
    setStep("form");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

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
        pupil_id: defaultPupilId || null,
        lead_name: pupilName || null,
        lead_email: pupilEmail || null,
        lead_phone: pupilPhone || null,
        lead_postcode: pupilPostcode || null,
        test_date: format(testDate, "yyyy-MM-dd"),
        test_time: testTime || null,
        test_centre_name: testCentre || null,
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
      handleClose(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save proposal");
    } finally {
      setSaving(false);
    }
  };

  const Body = (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      <ScrollArea className="flex-1 px-5 py-4">
        {step === "form" ? (
          <div className="space-y-5">
            {/* Pupil/lead info */}
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

            {mode === "instructor" && defaultPupilName && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Pupil: </span>
                <span className="font-medium">{defaultPupilName}</span>
              </div>
            )}

            {/* Test details */}
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Driving Test</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start font-normal", !testDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {testDate ? format(testDate, "d MMM yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={testDate}
                        onSelect={setTestDate}
                        disabled={(d) => d < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Time</Label>
                  <Input type="time" value={testTime} onChange={(e) => setTestTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Test centre (optional)</Label>
                <Input placeholder="e.g. Winchester" value={testCentre} onChange={(e) => setTestCentre(e.target.value)} />
              </div>
            </section>

            {/* Hours + lesson params */}
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course Details</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Hours left</Label>
                  <Input type="number" min={1} value={hoursRemaining} onChange={(e) => setHoursRemaining(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Lesson length</Label>
                  <Select value={lessonLength} onValueChange={setLessonLength}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hr</SelectItem>
                      <SelectItem value="90">1.5 hr</SelectItem>
                      <SelectItem value="120">2 hr</SelectItem>
                      <SelectItem value="150">2.5 hr</SelectItem>
                      <SelectItem value="180">3 hr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Per week</Label>
                  <Select value={lessonsPerWeek} onValueChange={setLessonsPerWeek}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}×</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Availability */}
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">When You Can Have Lessons</p>
              <div className="rounded-lg border divide-y">
                {DAY_KEYS.map((k) => {
                  const w = availability[k];
                  return (
                    <div key={k} className="flex items-center gap-2 px-3 py-2">
                      <Switch checked={w.enabled} onCheckedChange={(v) => updateDay(k, { enabled: v })} />
                      <span className="w-10 text-sm font-medium">{DAY_LABEL[k]}</span>
                      <Input
                        type="time" disabled={!w.enabled} value={w.start}
                        onChange={(e) => updateDay(k, { start: e.target.value })}
                        className="h-8 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time" disabled={!w.enabled} value={w.end}
                        onChange={(e) => updateDay(k, { end: e.target.value })}
                        className="h-8 flex-1"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            <Button
              className="w-full bg-[#2A394F] hover:bg-[#1F2B3D] text-white"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate plan</>}
            </Button>
          </div>
        ) : result ? (
          <div className="space-y-5">
            {/* Feasibility banner */}
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

            {/* Pattern */}
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

            {/* Slot list */}
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                All {result.slots.length} Lessons
              </p>
              <div className="rounded-xl border divide-y bg-card max-h-72 overflow-y-auto">
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

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>
                Edit
              </Button>
              <Button
                className="flex-1 bg-[#2A394F] hover:bg-[#1F2B3D] text-white"
                onClick={handleSaveDraft}
                disabled={saving || result.slots.length === 0}
              >
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save as draft"}
              </Button>
            </div>
          </div>
        ) : null}
      </ScrollArea>
    </div>
  );

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg p-0 h-[85vh] flex flex-col">
          {Body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-[20px] p-0 border-0 h-[92vh] flex flex-col">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-9 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>
        {Body}
      </SheetContent>
    </Sheet>
  );
}
