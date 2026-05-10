import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettingsDirty } from "./SettingsDirtyContext";
import { toast } from "@/hooks/use-toast";

const LENGTHS = [60, 90, 120];

interface Row {
  buffer_minutes: number | null;
  preferred_lesson_length: number | null;
  allowed_lesson_lengths: number[] | null;
  auto_block_bank_holidays: boolean | null;
}

interface Props {
  instructorId: string;
}

/**
 * Lesson length, buffer between lessons and bank-holiday auto-block.
 * Wired into SettingsDirtyContext under key "lesson-length".
 */
export function LessonLengthBufferEditor({ instructorId }: Props) {
  const [original, setOriginal] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, setDirty } = useSettingsDirty();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("buffer_minutes, preferred_lesson_length, allowed_lesson_lengths, auto_block_bank_holidays")
        .eq("id", instructorId)
        .single();
      if (cancelled) return;
      if (data) {
        const r = data as Row;
        setOriginal(r);
        setDraft(r);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  const dirty = !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original);

  useEffect(() => {
    setDirty("lesson-length", dirty);
    return () => setDirty("lesson-length", false);
  }, [dirty, setDirty]);

  useEffect(() => {
    if (!draft) return;
    register("lesson-length", {
      save: async () => {
        const { error } = await supabase.from("instructors").update({
          buffer_minutes: draft.buffer_minutes,
          preferred_lesson_length: draft.preferred_lesson_length,
          allowed_lesson_lengths: draft.allowed_lesson_lengths,
          auto_block_bank_holidays: draft.auto_block_bank_holidays,
        }).eq("id", instructorId);
        if (error) {
          toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
          throw error;
        }
        setOriginal(draft);
      },
      reset: () => setDraft(original),
    });
    return () => register("lesson-length", null);
  }, [draft, original, register, instructorId]);

  const toggleLength = (n: number) => {
    setDraft(p => {
      if (!p) return p;
      const list = new Set(p.allowed_lesson_lengths ?? []);
      if (list.has(n)) list.delete(n); else list.add(n);
      return { ...p, allowed_lesson_lengths: Array.from(list).sort((a, b) => a - b) };
    });
  };

  if (loading || !draft) {
    return <div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-medium mb-2">Lesson lengths offered to pupils</div>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map(n => {
            const on = (draft.allowed_lesson_lengths ?? []).includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleLength(n)}
                className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                style={{
                  background: on ? "#2B7BC8" : "transparent",
                  color: on ? "#fff" : "hsl(var(--foreground))",
                  borderColor: on ? "#2B7BC8" : "hsl(var(--border))",
                }}
              >
                {n} min
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Default lesson length</span>
          <select
            value={draft.preferred_lesson_length ?? 60}
            onChange={e => setDraft(p => p && ({ ...p, preferred_lesson_length: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          >
            {LENGTHS.map(n => <option key={n} value={n}>{n} min</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Buffer between lessons (min)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={draft.buffer_minutes ?? 0}
            onChange={e => setDraft(p => p && ({ ...p, buffer_minutes: e.target.value === "" ? 0 : Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex items-center justify-between rounded-2xl border p-3">
        <div>
          <div className="text-sm font-medium">Auto-block bank holidays</div>
          <div className="text-xs text-muted-foreground">
            {draft.auto_block_bank_holidays ? "Automatically blocked" : "Available on bank holidays"}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!draft.auto_block_bank_holidays}
          onClick={() => setDraft(p => p && ({ ...p, auto_block_bank_holidays: !p.auto_block_bank_holidays }))}
          className="h-6 w-11 rounded-full relative transition-colors"
          style={{ background: draft.auto_block_bank_holidays ? "#2B7BC8" : "hsl(var(--muted))" }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
            style={{ left: 2, transform: draft.auto_block_bank_holidays ? "translateX(20px)" : "translateX(0)" }}
          />
        </button>
      </div>
    </div>
  );
}
