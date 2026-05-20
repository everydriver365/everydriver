import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  loadCourseAvailabilitySources,
  computeDaySlots,
  type CourseAvailabilitySources,
  type InstructorLite,
} from "@/lib/courseAvailability";
import {
  describeReason,
  fromMinutes,
  parseHHMM,
  validateSlot,
  buildDayConflicts,
  londonDateStr,
} from "@/lib/availabilityEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InstructorRow {
  id: string;
  name: string;
  available_from: string | null;
  buffer_minutes: number | null;
  slot_increment_minutes: number | null;
  is_network_placeholder: boolean | null;
}

export default function AvailabilityTester() {
  const today = londonDateStr(new Date());

  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [instructorId, setInstructorId] = useState<string>("");
  const [date, setDate] = useState<string>(today);
  const [duration, setDuration] = useState<number>(60);
  const [startTime, setStartTime] = useState<string>("");
  const [respectAvailableFrom, setRespectAvailableFrom] = useState<boolean>(false);

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

  // Auto-run when instructor / date change.
  useEffect(() => {
    if (instructor) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId, date]);

  const lite: InstructorLite | null = instructor
    ? {
        id: instructor.id,
        available_from: instructor.available_from,
        buffer_minutes: instructor.buffer_minutes,
        is_network_placeholder: instructor.is_network_placeholder,
      }
    : null;

  const result = useMemo(() => {
    if (!lite || !sources) return null;
    const day = new Date(`${date}T12:00:00Z`);
    return computeDaySlots(lite, day, sources, {
      durationMinutes: duration,
      bufferMinutes: instructor?.buffer_minutes ?? 0,
      slotIncrementMinutes: instructor?.slot_increment_minutes ?? undefined,
      respectAvailableFrom,
    });
  }, [lite, sources, date, duration, instructor, respectAvailableFrom]);

  const validation = useMemo(() => {
    if (!lite || !sources || !result || result.windows.length === 0) return null;
    const startMin = parseHHMM(startTime);
    if (startMin == null) return null;

    // Find the window containing this start.
    const win = result.windows.find(
      (w) => startMin >= w.start && startMin + duration <= w.end,
    );
    if (!win) {
      return { ok: false as const, reason: "outside_window" as const };
    }

    const conflicts = buildDayConflicts(
      date,
      sources.manualBlocks
        .filter((b) => b.instructor_id === lite.id)
        .map((b) => ({ start_datetime: b.start_datetime, end_datetime: b.end_datetime })),
      sources.calendarEvents
        .filter((e) => e.instructor_id === lite.id)
        .map((e) => ({ start_time: e.start_time, end_time: e.end_time, is_busy: e.is_busy })),
    );

    return validateSlot({
      dateStr: date,
      startMin,
      durationMinutes: duration,
      dayStartMin: win.start,
      dayEndMin: win.end,
      bufferMinutes: instructor?.buffer_minutes ?? 0,
      conflicts,
      isToday: date === today,
    });
  }, [lite, sources, result, startTime, duration, date, instructor, today]);

  // Group rejections by reason for the summary.
  const rejectionSummary = useMemo(() => {
    if (!result) return [] as { reason: string; count: number }[];
    const map = new Map<string, number>();
    for (const r of result.rejected) map.set(r.reason, (map.get(r.reason) || 0) + 1);
    return [...map.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [result]);

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Availability Tester</h1>
        <p className="text-sm text-muted-foreground">
          Runs the canonical engine (<code>computeDaySlots</code> / <code>validateSlot</code>) end-to-end
          against live data for the chosen instructor and date. All times are Europe/London.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Instructor</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger><SelectValue placeholder="Choose instructor" /></SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">Date (London)</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="duration">Lesson duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Math.max(15, parseInt(e.target.value || "0", 10) || 60))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="start">Test a specific start time (HH:MM, optional)</Label>
            <Input
              id="start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={respectAvailableFrom}
                onChange={(e) => setRespectAvailableFrom(e.target.checked)}
              />
              Respect <code>available_from</code>
            </label>
          </div>

          <div className="flex items-end">
            <Button onClick={run} disabled={!instructor || loading}>
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

      {instructor && sources && result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Instructor settings</CardTitle>
            </CardHeader>
            <CardContent className="text-sm grid grid-cols-2 md:grid-cols-4 gap-y-2">
              <div><span className="text-muted-foreground">Name:</span> {instructor.name}</div>
              <div><span className="text-muted-foreground">Buffer:</span> {instructor.buffer_minutes ?? 0} min</div>
              <div><span className="text-muted-foreground">Slot increment:</span> {instructor.slot_increment_minutes ?? 15} min</div>
              <div><span className="text-muted-foreground">available_from:</span> {instructor.available_from ?? "—"}</div>
              <div><span className="text-muted-foreground">Network placeholder:</span> {instructor.is_network_placeholder ? "yes" : "no"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Working windows for {date}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {result.windows.length === 0 ? (
                <p className="text-muted-foreground">
                  No working windows resolved — instructor is not available on this day.
                </p>
              ) : (
                <ul className="space-y-1">
                  {result.windows.map((w, i) => (
                    <li key={i}>
                      <Badge variant="secondary">{fromMinutes(w.start)} – {fromMinutes(w.end)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw conflicts loaded</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">Manual blocks ({sources.manualBlocks.filter((b) => b.instructor_id === instructor.id).length})</p>
                <ul className="text-muted-foreground space-y-1">
                  {sources.manualBlocks
                    .filter((b) => b.instructor_id === instructor.id)
                    .map((b, i) => (
                      <li key={i}>{b.start_datetime} → {b.end_datetime}</li>
                    ))}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Calendar events ({sources.calendarEvents.filter((e) => e.instructor_id === instructor.id).length})</p>
                <ul className="text-muted-foreground space-y-1">
                  {sources.calendarEvents
                    .filter((e) => e.instructor_id === instructor.id)
                    .map((e, i) => (
                      <li key={i}>
                        {e.start_time} → {e.end_time}{" "}
                        <Badge variant={e.is_busy ? "destructive" : "outline"} className="ml-1">
                          {e.is_busy ? "busy" : "free"}
                        </Badge>
                      </li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available slots ({result.slots.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {result.slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookable slots for these inputs.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.slots.map((s, i) => (
                    <Badge key={i} variant="default">
                      {fromMinutes(s.start)} – {fromMinutes(s.end)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rejection breakdown</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {rejectionSummary.length === 0 ? (
                <p className="text-muted-foreground">No rejections.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {rejectionSummary.map((r) => (
                      <Badge key={r.reason} variant="outline">
                        {r.reason}: {r.count}
                      </Badge>
                    ))}
                  </div>
                  <details>
                    <summary className="cursor-pointer text-muted-foreground">
                      Show all {result.rejected.length} rejected candidates
                    </summary>
                    <ul className="mt-2 space-y-1 max-h-80 overflow-auto">
                      {result.rejected.map((r, i) => (
                        <li key={i} className="font-mono text-xs">
                          {fromMinutes(r.start)} – {fromMinutes(r.end)} → {r.reason}
                          {r.cause ? ` (${describeReason(r.reason, r.cause, instructor.buffer_minutes ?? 0)})` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
            </CardContent>
          </Card>

          {startTime && (
            <Card>
              <CardHeader>
                <CardTitle>validateSlot result for {startTime}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {validation == null ? (
                  <p className="text-muted-foreground">Enter a valid HH:MM start time above.</p>
                ) : validation.ok ? (
                  <Badge variant="default">OK — bookable</Badge>
                ) : (
                  <div className="space-y-1">
                    <Badge variant="destructive">REJECTED: {validation.reason}</Badge>
                    <p className="text-muted-foreground">
                      {describeReason(
                        validation.reason,
                        "cause" in validation ? validation.cause : undefined,
                        instructor.buffer_minutes ?? 0,
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
