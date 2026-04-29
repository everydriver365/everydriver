import { useState, useEffect, useMemo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Loader2, Sparkles, Check } from "lucide-react";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateLessonQueries } from "@/lib/invalidateLessonQueries";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VoiceQuickAddLessonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  onCreated?: () => void;
}

interface Pupil {
  id: string;
  name: string;
  postcode: string | null;
  address: string | null;
}

interface ParsedDraft {
  pupil_name?: string;
  lesson_date?: string;
  start_time?: string;
  duration_minutes?: number;
  location?: string;
  notes?: string;
}

export function VoiceQuickAddLessonSheet({
  open,
  onOpenChange,
  instructorId,
  onCreated,
}: VoiceQuickAddLessonSheetProps) {
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } =
    useVoiceToText();

  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [editTranscript, setEditTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [matchedPupilId, setMatchedPupilId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync live transcript into editable field
  useEffect(() => {
    if (transcript) setEditTranscript(transcript);
  }, [transcript]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      stopListening();
      resetTranscript();
      setEditTranscript("");
      setDraft(null);
      setMatchedPupilId(null);
    }
  }, [open, stopListening, resetTranscript]);

  // Load pupils for matching once
  useEffect(() => {
    if (!open || !instructorId) return;
    (async () => {
      const { data } = await supabase
        .from("pupils")
        .select("id, name, postcode, address")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("name");
      if (data) setPupils(data as Pupil[]);
    })();
  }, [open, instructorId]);

  const handleParse = async () => {
    if (!editTranscript.trim()) {
      toast.error("Say or type something first");
      return;
    }
    setParsing(true);
    setDraft(null);
    try {
      const { data, error } = await supabase.functions.invoke("parse-lesson-voice", {
        body: {
          transcript: editTranscript,
          pupil_names: pupils.map((p) => p.name),
          today_iso: format(new Date(), "yyyy-MM-dd"),
        },
      });
      if (error) throw error;
      const parsed = (data?.parsed || {}) as ParsedDraft;
      setDraft(parsed);

      // Try to match a pupil by name (case-insensitive substring or first-name match)
      if (parsed.pupil_name) {
        const target = parsed.pupil_name.toLowerCase().trim();
        const exact = pupils.find((p) => p.name.toLowerCase() === target);
        const partial = pupils.find(
          (p) =>
            p.name.toLowerCase().includes(target) ||
            target.includes(p.name.toLowerCase().split(" ")[0])
        );
        setMatchedPupilId((exact || partial)?.id || null);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not understand that — try rephrasing");
    } finally {
      setParsing(false);
    }
  };

  const matchedPupil = useMemo(
    () => pupils.find((p) => p.id === matchedPupilId) || null,
    [pupils, matchedPupilId]
  );

  const handleSave = async () => {
    if (!draft || !matchedPupilId) {
      toast.error("Select a pupil first");
      return;
    }
    if (!draft.lesson_date || !draft.start_time) {
      toast.error("Date and start time are required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("scheduled_lessons").insert({
        instructor_id: instructorId,
        pupil_id: matchedPupilId,
        lesson_date: draft.lesson_date,
        start_time: draft.start_time.length === 5 ? `${draft.start_time}:00` : draft.start_time,
        duration_minutes: draft.duration_minutes || 60,
        pickup_location: draft.location || matchedPupil?.address || null,
        pickup_postcode: matchedPupil?.postcode || null,
        notes: draft.notes || null,
        status: "scheduled",
      });
      if (error) throw error;
      toast.success("Lesson added");
      onCreated?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Voice quick-add lesson
          </DrawerTitle>
          <DrawerDescription>
            Speak naturally — e.g. "Book Sarah for Tuesday at half past four, hour and a half, test prep."
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {!isSupported && (
            <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md p-2">
              Voice capture isn't supported in this browser — type the request below instead.
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported || parsing || saving}
              aria-label={isListening ? "Stop recording" : "Start recording"}
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center transition-all",
                isListening
                  ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40 animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
                (!isSupported || parsing || saving) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground -mt-2">
            {isListening ? "Listening… tap to stop" : "Tap to speak"}
          </p>

          <div>
            <Label className="text-xs">Transcript</Label>
            <Textarea
              value={editTranscript}
              onChange={(e) => setEditTranscript(e.target.value)}
              placeholder="Edit if needed, or type from scratch…"
              className="mt-1 min-h-[80px] text-sm"
            />
          </div>

          <Button
            onClick={handleParse}
            disabled={!editTranscript.trim() || parsing}
            className="w-full"
            variant={draft ? "outline" : "default"}
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing…
              </>
            ) : draft ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Re-parse
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Parse with AI
              </>
            )}
          </Button>

          {draft && (
            <div className="rounded-xl border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Draft lesson
              </p>

              <div>
                <Label className="text-xs">Pupil</Label>
                <select
                  value={matchedPupilId || ""}
                  onChange={(e) => setMatchedPupilId(e.target.value || null)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— Select pupil —</option>
                  {pupils.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {draft.pupil_name && !matchedPupilId && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Heard "{draft.pupil_name}" — no match found, please choose.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={draft.lesson_date || ""}
                    onChange={(e) => setDraft({ ...draft, lesson_date: e.target.value })}
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input
                    type="time"
                    value={draft.start_time?.slice(0, 5) || ""}
                    onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                    className="h-9 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Duration (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={draft.duration_minutes ?? 60}
                    onChange={(e) =>
                      setDraft({ ...draft, duration_minutes: Number(e.target.value) || 60 })
                    }
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Pickup / location</Label>
                  <Input
                    value={draft.location || ""}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    placeholder={matchedPupil?.address || "Pickup spot"}
                    className="h-9 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Notes</Label>
                <Input
                  value={draft.notes || ""}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="Lesson focus, reminders…"
                  className="h-9 mt-1"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !matchedPupilId || !draft.lesson_date || !draft.start_time}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Add lesson
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
