import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { useSettingsDirty } from "../SettingsDirtyContext";
import { toast } from "@/hooks/use-toast";

const LENGTHS = [60, 90, 120];

interface Row {
  buffer_minutes: number | null;
  preferred_lesson_length: number | null;
  allowed_lesson_lengths: number[] | null;
  auto_block_bank_holidays: boolean | null;
}

export function AvailabilityPage({ instructorId }: { instructorId: string }) {
  const [original, setOriginal] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, setDirty } = useSettingsDirty();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("buffer_minutes, preferred_lesson_length, allowed_lesson_lengths, auto_block_bank_holidays")
        .eq("id", instructorId)
        .single();
      if (data) {
        const r = data as Row;
        setOriginal(r);
        setDraft(r);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const dirty = !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original);
  useEffect(() => { setDirty("availability", dirty); }, [dirty, setDirty]);

  useEffect(() => {
    if (!draft) return;
    register("availability", {
      save: async () => {
        const { error } = await supabase.from("instructors").update({
          buffer_minutes: draft.buffer_minutes,
          preferred_lesson_length: draft.preferred_lesson_length,
          allowed_lesson_lengths: draft.allowed_lesson_lengths,
          auto_block_bank_holidays: draft.auto_block_bank_holidays,
        }).eq("id", instructorId);
        if (error) toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
        else { setOriginal(draft); toast({ title: "Saved" }); }
      },
      reset: () => setDraft(original),
    });
    return () => register("availability", null);
  }, [draft, original, register, instructorId]);

  const toggleLength = (n: number) => {
    setDraft(p => {
      if (!p) return p;
      const list = new Set(p.allowed_lesson_lengths ?? []);
      if (list.has(n)) list.delete(n); else list.add(n);
      return { ...p, allowed_lesson_lengths: Array.from(list).sort((a, b) => a - b) };
    });
  };

  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Working hours</div>
          <div className="sv2-section-sub">The days and times you teach each week.</div>
        </div>
        <WorkingHoursEditor instructorId={instructorId} />
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Lesson length & buffer</div>
          <div className="sv2-section-sub">What lengths you offer and how long you need between lessons.</div>
        </div>
        {loading || !draft ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading…</div>
        ) : (
          <div className="sv2-grid-2">
            <div>
              <label className="sv2-label">Allowed lesson lengths</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LENGTHS.map(n => {
                  const on = (draft.allowed_lesson_lengths ?? []).includes(n);
                  return (
                    <button
                      type="button" key={n}
                      onClick={() => toggleLength(n)}
                      className="sv2-chip"
                      style={on ? { background: "var(--color-text-primary)", color: "#fff", borderColor: "var(--color-text-primary)" } : undefined}
                    >
                      {n} min
                    </button>
                  );
                })}
              </div>
              <div className="sv2-helper">Pupils only see these durations when booking.</div>
            </div>
            <div>
              <label className="sv2-label">Default lesson length <span className="sv2-optional">(minutes)</span></label>
              <select
                className="sv2-select"
                value={draft.preferred_lesson_length ?? 60}
                onChange={e => setDraft(p => p && ({ ...p, preferred_lesson_length: Number(e.target.value) }))}
              >
                {LENGTHS.map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <div>
              <label className="sv2-label">Buffer between lessons <span className="sv2-optional">(minutes)</span></label>
              <input
                className="sv2-input"
                type="number" min="0" max="60" inputMode="numeric"
                value={draft.buffer_minutes ?? 0}
                onChange={e => setDraft(p => p && ({ ...p, buffer_minutes: e.target.value === "" ? 0 : Number(e.target.value) }))}
              />
              <div className="sv2-helper">Travel and admin time before the next pupil.</div>
            </div>
            <div>
              <label className="sv2-label">Bank holidays</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  className={`sv2-toggle ${draft.auto_block_bank_holidays ? "on" : ""}`}
                  role="switch" aria-checked={!!draft.auto_block_bank_holidays}
                  onClick={() => setDraft(p => p && ({ ...p, auto_block_bank_holidays: !p.auto_block_bank_holidays }))}
                />
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {draft.auto_block_bank_holidays ? "Automatically blocked" : "Available on bank holidays"}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
