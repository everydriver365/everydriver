import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettingsDirty } from "./SettingsDirtyContext";
import { toast } from "@/hooks/use-toast";
import { isValidOutwardCode } from "@/lib/pricing/resolveHourlyRate";

interface InstructorRow {
  hourly_rate: number | null;
  home_postcode: string | null;
  radius_miles: number | null;
}

interface PostcodeRule {
  id: string;
  outward_code: string;
  hourly_rate: number | null;
  _persisted?: boolean;
}

const newLocalId = () => `new-${Math.random().toString(36).slice(2, 10)}`;

/* ============================================================
   Hourly rate section
   ============================================================ */
export function HourlyRateSection({ instructorId }: { instructorId: string }) {
  const [rate, setRate] = useState<number | null>(null);
  const [orig, setOrig] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, setDirty } = useSettingsDirty();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("hourly_rate")
        .eq("id", instructorId)
        .single();
      const v = data?.hourly_rate == null ? null : Number(data.hourly_rate);
      setRate(v);
      setOrig(v);
      setLoading(false);
    })();
  }, [instructorId]);

  const dirty = rate !== orig;
  useEffect(() => { setDirty("rates-hourly", dirty); }, [dirty, setDirty]);
  useEffect(() => {
    register("rates-hourly", {
      save: async () => {
        const { error } = await supabase.from("instructors").update({ hourly_rate: rate }).eq("id", instructorId);
        if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); throw error; }
        setOrig(rate);
        toast({ title: "Saved" });
      },
      reset: () => setRate(orig),
    });
    return () => register("rates-hourly", null);
  }, [rate, orig, register, instructorId]);

  if (loading) return <div className="text-xs text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-xs">
      <label className="block text-xs font-medium mb-1.5">Hourly rate (£)</label>
      <input
        type="number" inputMode="decimal" step="0.50" min="0"
        value={rate ?? ""}
        onChange={e => setRate(e.target.value === "" ? null : Number(e.target.value))}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "hsl(var(--border) / 0.6)" }}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">Used as the default when you create new courses.</p>
    </div>
  );
}

/* ============================================================
   Coverage section
   ============================================================ */
export function CoverageSection({ instructorId }: { instructorId: string }) {
  const [draft, setDraft] = useState<{ home_postcode: string | null; radius_miles: number | null } | null>(null);
  const [orig, setOrig] = useState<typeof draft>(null);
  const [loading, setLoading] = useState(true);
  const { register, setDirty } = useSettingsDirty();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("home_postcode, radius_miles")
        .eq("id", instructorId)
        .single();
      if (data) {
        const v = { home_postcode: data.home_postcode, radius_miles: data.radius_miles == null ? null : Number(data.radius_miles) };
        setDraft(v);
        setOrig(v);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const dirty = !!draft && !!orig && JSON.stringify(draft) !== JSON.stringify(orig);
  useEffect(() => { setDirty("rates-coverage-fields", dirty); }, [dirty, setDirty]);
  useEffect(() => {
    if (!draft) return;
    register("rates-coverage-fields", {
      save: async () => {
        const { error } = await supabase.from("instructors").update(draft).eq("id", instructorId);
        if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); throw error; }
        setOrig(draft);
        toast({ title: "Saved" });
      },
      reset: () => setDraft(orig),
    });
    return () => register("rates-coverage-fields", null);
  }, [draft, orig, register, instructorId]);

  if (loading || !draft) return <div className="text-xs text-muted-foreground">Loading…</div>;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1.5">Home postcode</label>
        <input
          value={draft.home_postcode ?? ""}
          onChange={e => setDraft(p => p && ({ ...p, home_postcode: e.target.value.toUpperCase() }))}
          placeholder="SO22 5DR"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "hsl(var(--border) / 0.6)" }}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">The centre of your service area. Not shown to learners.</p>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Service radius (miles)</label>
        <input
          type="number" inputMode="numeric" min="1" max="60"
          value={draft.radius_miles ?? ""}
          onChange={e => setDraft(p => p && ({ ...p, radius_miles: e.target.value === "" ? null : Number(e.target.value) }))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "hsl(var(--border) / 0.6)" }}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">Learners outside this radius won't see you in search.</p>
      </div>
    </div>
  );
}

/* ============================================================
   Postcode rates section
   ============================================================ */
export function PostcodeRatesSection({ instructorId }: { instructorId: string }) {
  const [originalRules, setOriginalRules] = useState<PostcodeRule[]>([]);
  const [draftRules, setDraftRules] = useState<PostcodeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const reload = async () => {
    const { data } = await supabase
      .from("instructor_postcode_rates")
      .select("id, outward_code, hourly_rate")
      .eq("instructor_id", instructorId)
      .order("outward_code", { ascending: true });
    const mapped: PostcodeRule[] = (data ?? []).map((r: any) => ({
      id: r.id,
      outward_code: r.outward_code,
      hourly_rate: r.hourly_rate == null ? null : Number(r.hourly_rate),
      _persisted: true,
    }));
    setOriginalRules(mapped);
    setDraftRules(mapped);
  };

  useEffect(() => {
    (async () => { await reload(); setLoading(false); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const validateRule = (r: PostcodeRule, others: PostcodeRule[]): string | null => {
    const code = (r.outward_code || "").trim().toUpperCase();
    if (!code) return "Postcode required";
    if (!isValidOutwardCode(code)) return "Invalid postcode";
    if (others.some(o => o.id !== r.id && (o.outward_code || "").trim().toUpperCase() === code)) return "Duplicate";
    if (r.hourly_rate == null || r.hourly_rate <= 0) return "Rate must be > 0";
    return null;
  };

  const updateLocal = (id: string, patch: Partial<PostcodeRule>) =>
    setDraftRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const isRowDirty = (r: PostcodeRule) => {
    if (!r._persisted) return true;
    const o = originalRules.find(x => x.id === r.id);
    if (!o) return true;
    return o.outward_code !== (r.outward_code || "").trim().toUpperCase()
        || Number(o.hourly_rate) !== Number(r.hourly_rate);
  };

  const saveRow = async (rule: PostcodeRule) => {
    const err = validateRule(rule, draftRules);
    if (err) { toast({ title: err, variant: "destructive" }); return; }
    setBusyId(rule.id);
    try {
      const payload = {
        outward_code: rule.outward_code.trim().toUpperCase(),
        hourly_rate: rule.hourly_rate as number,
      };
      if (rule._persisted) {
        const { error } = await supabase.from("instructor_postcode_rates").update(payload).eq("id", rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("instructor_postcode_rates").insert({ instructor_id: instructorId, ...payload });
        if (error) throw error;
      }
      await reload();
      toast({ title: "Saved" });
    } catch (e: any) {
      toast({ title: "Couldn't save", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const deleteRow = async (rule: PostcodeRule) => {
    if (!rule._persisted) {
      setDraftRules(prev => prev.filter(r => r.id !== rule.id));
      return;
    }
    if (!confirm(`Delete postcode rate for ${rule.outward_code}?`)) return;
    setBusyId(rule.id);
    try {
      const { error } = await supabase.from("instructor_postcode_rates").delete().eq("id", rule.id);
      if (error) throw error;
      await reload();
      toast({ title: "Removed" });
    } catch (e: any) {
      toast({ title: "Couldn't remove", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="text-xs text-muted-foreground">Loading…</div>;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Charge a different hourly rate for specific postcode areas. Matched on the outward code (e.g. SO22).
        Pupils with their own custom rate are unaffected.
      </p>

      {draftRules.length === 0 ? (
        <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground mb-3"
             style={{ borderColor: "hsl(var(--border))" }}>
          No postcode rules yet. Add one to charge a different rate for an area.
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {draftRules.map((rule) => {
            const dirtyRow = isRowDirty(rule);
            const err = dirtyRow ? validateRule(rule, draftRules) : null;
            const busy = busyId === rule.id;
            return (
              <div key={rule.id} className="grid items-start gap-2"
                   style={{ gridTemplateColumns: "minmax(110px, 160px) minmax(120px, 1fr) auto auto" }}>
                <input
                  value={rule.outward_code}
                  maxLength={4}
                  placeholder="SO22"
                  disabled={busy}
                  onChange={e => updateLocal(rule.id, { outward_code: e.target.value.replace(/\s+/g, "").toUpperCase().slice(0, 4) })}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border) / 0.6)" }}
                />
                <input
                  type="number" inputMode="decimal" step="0.50" min="0"
                  placeholder="£/hour"
                  disabled={busy}
                  value={rule.hourly_rate ?? ""}
                  onChange={e => updateLocal(rule.id, { hourly_rate: e.target.value === "" ? null : Number(e.target.value) })}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "hsl(var(--border) / 0.6)" }}
                />
                <button
                  type="button"
                  disabled={busy || !dirtyRow || !!err}
                  onClick={() => saveRow(rule)}
                  className="rounded-lg px-3 h-9 text-sm font-medium disabled:opacity-40"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  {rule._persisted ? "Save" : "Add"}
                </button>
                <button
                  type="button"
                  aria-label="Delete postcode rule"
                  disabled={busy}
                  onClick={() => deleteRow(rule)}
                  className="rounded-lg border bg-transparent px-3 h-9 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
                  style={{ borderColor: "hsl(var(--border) / 0.6)" }}
                >
                  Delete
                </button>
                {err && (
                  <div style={{ gridColumn: "1 / -1", color: "hsl(0 72% 50%)" }} className="text-xs">
                    {err}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDraftRules(prev => [...prev, { id: newLocalId(), outward_code: "", hourly_rate: null }])}
          className="rounded-lg border bg-transparent px-3 py-2 text-sm hover:bg-muted"
          style={{ borderColor: "hsl(var(--border) / 0.6)" }}
        >
          + Add postcode
        </button>
        <button
          type="button"
          onClick={() => setShowImport(v => !v)}
          className="rounded-lg border bg-transparent px-3 py-2 text-sm hover:bg-muted"
          style={{ borderColor: "hsl(var(--border) / 0.6)" }}
        >
          {showImport ? "Close import" : "Bulk import (CSV)"}
        </button>
      </div>

      {showImport && (
        <CsvImporter
          existing={originalRules}
          onCancel={() => setShowImport(false)}
          onApply={async (rows) => {
            setBusyId("__import__");
            try {
              const byCode = new Map(originalRules.map(r => [r.outward_code.toUpperCase(), r]));
              const updates: { id: string; hourly_rate: number }[] = [];
              const inserts: { instructor_id: string; outward_code: string; hourly_rate: number }[] = [];
              for (const r of rows) {
                const existing = byCode.get(r.outward_code);
                if (existing) {
                  if (Number(existing.hourly_rate) !== r.hourly_rate) {
                    updates.push({ id: existing.id, hourly_rate: r.hourly_rate });
                  }
                } else {
                  inserts.push({ instructor_id: instructorId, outward_code: r.outward_code, hourly_rate: r.hourly_rate });
                }
              }
              if (inserts.length) {
                const { error } = await supabase.from("instructor_postcode_rates").insert(inserts);
                if (error) throw error;
              }
              for (const u of updates) {
                const { error } = await supabase.from("instructor_postcode_rates").update({ hourly_rate: u.hourly_rate }).eq("id", u.id);
                if (error) throw error;
              }
              await reload();
              setShowImport(false);
              toast({ title: "Import complete", description: `${inserts.length} added, ${updates.length} updated` });
            } catch (e: any) {
              toast({ title: "Import failed", description: e?.message, variant: "destructive" });
            } finally {
              setBusyId(null);
            }
          }}
        />
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Priority: pupil's custom rate → matching postcode rule → default hourly rate.
      </p>
    </div>
  );
}
