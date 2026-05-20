import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  loadCourseAvailabilitySources,
  type CourseAvailabilitySources,
  type InstructorLite,
} from "@/lib/courseAvailability";
import {
  buildDayConflicts,
  describeReason,
  fromMinutes,
  isAllDayLikeEvent,
  londonDateStr,
  londonDow,
  londonTodayStr,
  parseHHMM,
  toLondonParts,
  validateSlot,
  type RejectReason,
  type TaggedConflict,
} from "@/lib/availabilityEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

interface InstructorRow {
  id: string;
  name: string;
  available_from: string | null;
  buffer_minutes: number | null;
  slot_increment_minutes: number | null;
  is_network_placeholder: boolean | null;
}

type CheckStatus = "pass" | "fail" | "warn" | "info";

interface CheckLine {
  status: CheckStatus;
  label: string;
  detail?: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  if (status === "fail") return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
  return <Info className="w-4 h-4 text-muted-foreground shrink-0" />;
}

function Line({ status, label, detail }: CheckLine) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <StatusIcon status={status} />
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        {detail && <div className="text-muted-foreground text-xs mt-0.5 font-mono">{detail}</div>}
      </div>
    </div>
  );
}

export default function SlotDebugger() {
  const today = londonDateStr(new Date());

  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [instructorId, setInstructorId] = useState("");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState(60);

  const [sources, setSources] = useState<CourseAvailabilitySources | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load instructors once.
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, available_from, buffer_minutes, slot_increment_minutes, is_network_placeholder")
        .order("name");
      if (error) {
        setError(error.message);
        return;
      }
      setInstructors((data || []) as InstructorRow[]);
    })();
  }, []);

  const instructor = useMemo(
    () => instructors.find((i) => i.id === instructorId) ?? null,
    [instructors, instructorId],
  );

  const run = async () => {
    if (!instructor) return;
    setLoading(true);
    setError(null);
    try {
      const day = new Date(`${date}T12:00:00Z`);
      const src = await loadCourseAvailabilitySources(supabase, [instructor.id], day, day);
      setSources(src);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instructor) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId, date]);

  // ---------------------------------------------------------------------------
  // The verdict computation — single slot, verbose reasoning.
  // ---------------------------------------------------------------------------
  const verdict = useMemo(() => {
    if (!instructor || !sources) return null;

    const checks: CheckLine[] = [];
    const warnings: CheckLine[] = [];
    const conflictRows: Array<{
      kind: "block" | "event";
      raw: string;
      clipped: TaggedConflict | null;
      ignored?: string;
    }> = [];

    const startMin = parseHHMM(startTime);
    const isToday = date === today;
    const day = new Date(`${date}T12:00:00Z`);
    const jsDow = londonDow(day);

    // 1) Time input parse
    if (startMin == null) {
      checks.push({
        status: "fail",
        label: "Start time is unparseable",
        detail: `Got "${startTime}" — expected HH:MM`,
      });
      return { checks, warnings, conflictRows, finalStatus: "fail" as const, finalReason: "Invalid start time" };
    }
    const endMin = startMin + duration;
    checks.push({
      status: "info",
      label: `Testing slot ${fromMinutes(startMin)} – ${fromMinutes(endMin)} (${duration} min) on ${date}`,
      detail: `${DAY_NAMES[jsDow]} — Europe/London`,
    });

    // 2) Past-date gate
    if (date < today) {
      checks.push({
        status: "fail",
        label: "Date is in the past (London calendar)",
        detail: `today = ${today}`,
      });
      return { checks, warnings, conflictRows, finalStatus: "fail" as const, finalReason: "Past date" };
    }
    checks.push({ status: "pass", label: "Date is not in the past" });

    // 3) available_from gate (informational — we always show)
    if (instructor.available_from && instructor.available_from > date) {
      warnings.push({
        status: "warn",
        label: "Date is before instructor.available_from",
        detail: `available_from = ${instructor.available_from}`,
      });
    } else {
      checks.push({
        status: "pass",
        label: "Date is on or after instructor.available_from",
        detail: instructor.available_from ?? "(unset)",
      });
    }

    // 4) Resolve working windows from raw rows (replicating courseAvailability logic
    //    inline so we can show WHY each row contributed or was skipped).
    const dateOverride = sources.overrides.find((o) => {
      if (o.instructor_id !== instructor.id) return false;
      return (
        o.override_date === date ||
        (!!o.override_end_date && date >= o.override_date && date <= o.override_end_date)
      );
    });

    const windows: { start: number; end: number; source: string }[] = [];

    if (dateOverride) {
      if (!dateOverride.is_available) {
        checks.push({
          status: "fail",
          label: "Date override marks instructor unavailable",
          detail: `override row: ${dateOverride.override_date}${dateOverride.override_end_date ? `→${dateOverride.override_end_date}` : ""}`,
        });
        return { checks, warnings, conflictRows, finalStatus: "fail" as const, finalReason: "Date override blocks this day" };
      }
      const s = parseHHMM(dateOverride.start_time);
      const e = parseHHMM(dateOverride.end_time);
      if (s == null || e == null) {
        checks.push({
          status: "fail",
          label: "Date override marked available but times are missing/unparseable",
          detail: `start_time="${dateOverride.start_time ?? "null"}", end_time="${dateOverride.end_time ?? "null"}"`,
        });
        return { checks, warnings, conflictRows, finalStatus: "fail" as const, finalReason: "Override has no valid times → not available (no fallback)" };
      }
      if (e <= s) {
        checks.push({ status: "fail", label: "Override end_time ≤ start_time", detail: `${fromMinutes(s)}–${fromMinutes(e)}` });
        return { checks, warnings, conflictRows, finalStatus: "fail" as const, finalReason: "Override window is empty" };
      }
      windows.push({ start: s, end: e, source: "date override" });
      checks.push({ status: "pass", label: "Working window from date override", detail: `${fromMinutes(s)}–${fromMinutes(e)}` });
    } else {
      // weekly hours
      const wh = sources.workingHours.filter(
        (w) => w.instructor_id === instructor.id && w.is_active && w.day_of_week === jsDow,
      );
      for (const w of wh) {
        const s = parseHHMM(w.start_time);
        const e = parseHHMM(w.end_time);
        if (s == null || e == null) {
          warnings.push({
            status: "warn",
            label: `Skipped working-hours row (unparseable times)`,
            detail: `start="${w.start_time ?? "null"}" end="${w.end_time ?? "null"}"`,
          });
          continue;
        }
        if (e <= s) {
          warnings.push({
            status: "warn",
            label: `Skipped working-hours row (end ≤ start)`,
            detail: `${fromMinutes(s)}–${fromMinutes(e)}`,
          });
          continue;
        }
        windows.push({ start: s, end: e, source: "instructor_working_hours" });
      }
      // availability windows (1=Mon..7=Sun OR 0..6 tolerated)
      const winDow = jsDow === 0 ? 7 : jsDow;
      const aw = sources.availabilityWindows.filter(
        (w) => w.instructor_id === instructor.id && w.is_active && (w.day_of_week === winDow || w.day_of_week === jsDow),
      );
      for (const w of aw) {
        const s = parseHHMM(w.start_time);
        const e = parseHHMM(w.end_time);
        if (s == null || e == null) {
          warnings.push({
            status: "warn",
            label: `Skipped availability_windows row (unparseable times)`,
            detail: `start="${w.start_time ?? "null"}" end="${w.end_time ?? "null"}"`,
          });
          continue;
        }
        if (e <= s) continue;
        windows.push({ start: s, end: e, source: "availability_windows" });
      }

      if (windows.length === 0) {
        checks.push({
          status: "fail",
          label: `No working windows resolved for ${DAY_NAMES[jsDow]}`,
          detail: "No active rows with parseable start/end times found.",
        });
        return { checks, warnings, conflictRows, finalStatus: "fail" as const, finalReason: "No working windows on this day" };
      }
      for (const w of windows) {
        checks.push({
          status: "pass",
          label: `Working window from ${w.source}`,
          detail: `${fromMinutes(w.start)}–${fromMinutes(w.end)}`,
        });
      }
    }

    // 5) Find containing window
    const containing = windows.find((w) => startMin >= w.start && endMin <= w.end);
    if (!containing) {
      checks.push({
        status: "fail",
        label: "Slot is outside every working window",
        detail: `Slot ${fromMinutes(startMin)}–${fromMinutes(endMin)} vs windows: ${windows.map((w) => `${fromMinutes(w.start)}–${fromMinutes(w.end)}`).join(", ")}`,
      });
      return { checks, warnings, conflictRows, finalStatus: "fail" as const, finalReason: "Outside working window" };
    }
    checks.push({
      status: "pass",
      label: "Slot fits inside a working window",
      detail: `${fromMinutes(containing.start)}–${fromMinutes(containing.end)}`,
    });

    // 6) Inspect raw conflict rows for malformed data
    const myBlocks = sources.manualBlocks.filter((b) => b.instructor_id === instructor.id);
    const myEvents = sources.calendarEvents.filter((e) => e.instructor_id === instructor.id);

    for (const b of myBlocks) {
      const s = new Date(b.start_datetime);
      const e = new Date(b.end_datetime);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        conflictRows.push({
          kind: "block",
          raw: `${b.start_datetime} → ${b.end_datetime}`,
          clipped: null,
          ignored: "Malformed datetime — ignored",
        });
        warnings.push({
          status: "warn",
          label: "Manual block has malformed datetime",
          detail: `${b.start_datetime} → ${b.end_datetime}`,
        });
        continue;
      }
      const sP = toLondonParts(s);
      const eP = toLondonParts(e);
      if (sP.date > date || eP.date < date) {
        conflictRows.push({
          kind: "block",
          raw: `${b.start_datetime} → ${b.end_datetime}`,
          clipped: null,
          ignored: `Outside ${date} (London)`,
        });
        continue;
      }
      const startM = sP.date === date ? sP.hour * 60 + sP.minute : 0;
      const endM = eP.date === date ? eP.hour * 60 + eP.minute : 24 * 60;
      conflictRows.push({
        kind: "block",
        raw: `${b.start_datetime} → ${b.end_datetime}`,
        clipped: { start: startM, end: endM, kind: "block" },
      });
    }

    for (const ev of myEvents) {
      const s = new Date(ev.start_time);
      const e = new Date(ev.end_time);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        conflictRows.push({
          kind: "event",
          raw: `${ev.start_time} → ${ev.end_time}`,
          clipped: null,
          ignored: "Malformed datetime — ignored (fails closed → still treated as conflict by engine)",
        });
        warnings.push({
          status: "warn",
          label: "Calendar event has malformed datetime",
          detail: `${ev.start_time} → ${ev.end_time}`,
        });
        continue;
      }
      if (ev.is_busy === false) {
        conflictRows.push({
          kind: "event",
          raw: `${ev.start_time} → ${ev.end_time}`,
          clipped: null,
          ignored: "is_busy=false — explicit free, skipped",
        });
        continue;
      }
      if (isAllDayLikeEvent(ev.start_time, ev.end_time)) {
        conflictRows.push({
          kind: "event",
          raw: `${ev.start_time} → ${ev.end_time}`,
          clipped: null,
          ignored: "All-day / multi-day — informational only",
        });
        continue;
      }
      const sP = toLondonParts(s);
      const eP = toLondonParts(e);
      if (sP.date > date || eP.date < date) {
        conflictRows.push({
          kind: "event",
          raw: `${ev.start_time} → ${ev.end_time}`,
          clipped: null,
          ignored: `Outside ${date} (London)`,
        });
        continue;
      }
      const startM = sP.date === date ? sP.hour * 60 + sP.minute : 0;
      const endM = eP.date === date ? eP.hour * 60 + eP.minute : 24 * 60;
      conflictRows.push({
        kind: "event",
        raw: `${ev.start_time} → ${ev.end_time}`,
        clipped: { start: startM, end: endM, kind: "event" },
      });
    }

    // 7) Run the canonical validator
    const conflicts = buildDayConflicts(
      date,
      myBlocks.map((b) => ({ start_datetime: b.start_datetime, end_datetime: b.end_datetime })),
      myEvents.map((e) => ({ start_time: e.start_time, end_time: e.end_time, is_busy: e.is_busy })),
    );

    const buffer = Math.max(0, instructor.buffer_minutes ?? 0);
    const result = validateSlot({
      dateStr: date,
      startMin,
      durationMinutes: duration,
      dayStartMin: containing.start,
      dayEndMin: containing.end,
      bufferMinutes: buffer,
      conflicts,
      isToday,
    });

    if (result.ok === true) {
      checks.push({
        status: "pass",
        label: "validateSlot() returned OK",
        detail: `Engine confirms slot is bookable. Buffer applied: ${buffer} min.`,
      });
      return {
        checks,
        warnings,
        conflictRows,
        finalStatus: "pass" as const,
        finalReason: "Bookable — passes all engine checks",
      };
    }

    const reason: RejectReason = result.reason;
    const cause = result.cause;
    checks.push({
      status: "fail",
      label: `validateSlot() rejected — reason: ${reason}`,
      detail: describeReason(reason, cause, buffer),
    });

    if (cause) {
      checks.push({
        status: "info",
        label: `Conflicting interval`,
        detail: `${fromMinutes(cause.start)}–${fromMinutes(cause.end)} (${cause.kind}${cause.label ? `: ${cause.label}` : ""})`,
      });
    }

    return {
      checks,
      warnings,
      conflictRows,
      finalStatus: "fail" as const,
      finalReason: describeReason(reason, cause, buffer),
    };
  }, [instructor, sources, startTime, duration, date, today]);

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Slot Debugger</h1>
        <p className="text-sm text-muted-foreground">
          Inspect why a single candidate slot was accepted or rejected by the canonical
          availability engine. All times are Europe/London.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1 lg:col-span-2">
            <Label>Instructor</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="start">Start time</Label>
            <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Math.max(15, parseInt(e.target.value || "0", 10) || 60))}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={run} disabled={!instructor || loading} className="w-full">
              {loading ? "Loading…" : "Re-run"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {verdict && (
        <>
          <Card className={
            verdict.finalStatus === "pass"
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-destructive/40 bg-destructive/5"
          }>
            <CardContent className="pt-6 flex items-center gap-3">
              <StatusIcon status={verdict.finalStatus} />
              <div>
                <div className="font-semibold">
                  {verdict.finalStatus === "pass" ? "ACCEPTED" : "REJECTED"}
                </div>
                <div className="text-sm text-muted-foreground">{verdict.finalReason}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engine checks (in order)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {verdict.checks.map((c, i) => (
                <Line key={i} {...c} />
              ))}
            </CardContent>
          </Card>

          {verdict.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data quality warnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {verdict.warnings.map((w, i) => (
                  <Line key={i} {...w} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Conflicts inspected ({verdict.conflictRows.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {verdict.conflictRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No manual blocks or calendar events loaded for this instructor on this day.
                </p>
              ) : (
                verdict.conflictRows.map((c, i) => (
                  <div key={i} className="text-xs font-mono border-l-2 border-muted pl-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={c.kind === "block" ? "destructive" : "secondary"}>{c.kind}</Badge>
                      <span>{c.raw}</span>
                    </div>
                    {c.clipped && (
                      <div className="text-muted-foreground mt-0.5">
                        Clipped to London day: {fromMinutes(c.clipped.start)}–{fromMinutes(c.clipped.end)}
                      </div>
                    )}
                    {c.ignored && (
                      <div className="text-amber-600 mt-0.5">Ignored: {c.ignored}</div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
