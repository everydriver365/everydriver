import { useEffect, useMemo, useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

type UnmatchedRow = {
  id: string;
  external_event_id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
};

type Pupil = { id: string; name: string };

export default function UnmatchedGoogleEventsPage() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [rows, setRows] = useState<UnmatchedRow[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPupil, setSelectedPupil] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!instructorId) return;
    setLoading(true);
    const [r, p] = await Promise.all([
      supabase
        .from("unmatched_google_events")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("status", "pending")
        .order("start_time", { ascending: true }),
      supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructorId)
        .order("name"),
    ]);
    if (r.data) setRows(r.data as any);
    if (p.data) setPupils(p.data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [instructorId]);

  const pupilOptions = useMemo(() => pupils, [pupils]);

  const assign = async (row: UnmatchedRow) => {
    const pupilId = selectedPupil[row.id];
    if (!pupilId) {
      toast.error("Pick a pupil first");
      return;
    }
    if (!instructorId) return;
    setBusyId(row.id);
    try {
      const start = new Date(row.start_time);
      const end = new Date(row.end_time);
      const date = start.toLocaleDateString("sv-SE", { timeZone: "Europe/London" });
      const time = start.toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      const duration = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));

      const { data: lesson, error: insErr } = await supabase
        .from("scheduled_lessons")
        .insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
          lesson_date: date,
          start_time: `${time}:00`,
          duration_minutes: duration,
          pickup_location: row.location,
          status: "scheduled",
          booking_status: "confirmed",
          google_event_id: row.external_event_id,
          source: "google_calendar_import",
          calendar_sync_status: "synced",
        })
        .select("id")
        .single();

      if (insErr) throw insErr;

      await supabase
        .from("unmatched_google_events")
        .update({
          status: "resolved",
          resolved_pupil_id: pupilId,
          resolved_lesson_id: lesson?.id ?? null,
        })
        .eq("id", row.id);

      toast.success("Lesson created");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to create lesson");
    } finally {
      setBusyId(null);
    }
  };

  const dismiss = async (row: UnmatchedRow) => {
    setBusyId(row.id);
    const { error } = await supabase
      .from("unmatched_google_events")
      .update({ status: "dismissed" })
      .eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast.error("Failed to dismiss");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  return (
    <InstructorPortalLayout>
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Unmatched Google events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Events from your Google Calendar that we couldn't match to a pupil. Assign a pupil to
            create a lesson, or dismiss to keep it as a busy block only.
          </p>
        </div>

        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>
        ) : rows.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            Nothing waiting. Any Google Calendar events whose title matches a pupil are imported
            automatically.
          </Card>
        ) : (
          rows.map((row) => {
            const start = new Date(row.start_time);
            return (
              <Card key={row.id} className="p-4 space-y-3">
                <div>
                  <div className="font-medium">{row.title || "(no title)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(start, "EEE d MMM, HH:mm")}
                    {row.location ? ` · ${row.location}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <Select
                      value={selectedPupil[row.id] ?? ""}
                      onValueChange={(v) =>
                        setSelectedPupil((prev) => ({ ...prev, [row.id]: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a pupil" />
                      </SelectTrigger>
                      <SelectContent>
                        {pupilOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => assign(row)}
                    disabled={busyId === row.id || !selectedPupil[row.id]}
                  >
                    Create lesson
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => dismiss(row)}
                    disabled={busyId === row.id}
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </InstructorPortalLayout>
  );
}
