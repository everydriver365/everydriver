import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettingsDirty } from "./SettingsDirtyContext";
import { toast } from "@/hooks/use-toast";
import { isValidOutwardCode, extractOutwardCode, resolveHourlyRate } from "@/lib/pricing/resolveHourlyRate";
import { verifyOutwardCode, getCachedOutwardStatus, type OutwardStatus } from "@/lib/pricing/verifyOutwardCode";

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
  const [defaultRate, setDefaultRate] = useState<number | null>(null);
  const [testPostcode, setTestPostcode] = useState("");

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
    (async () => {
      await reload();
      const { data } = await supabase.from("instructors").select("hourly_rate").eq("id", instructorId).single();
      setDefaultRate(data?.hourly_rate == null ? null : Number(data.hourly_rate));
      setLoading(false);
    })();
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
                <div>
                  <input
                    value={rule.outward_code}
                    maxLength={4}
                    placeholder="SO22"
                    disabled={busy}
                    onChange={e => updateLocal(rule.id, { outward_code: e.target.value.replace(/\s+/g, "").toUpperCase().slice(0, 4) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "hsl(var(--border) / 0.6)" }}
                  />
                  <OutwardStatusBadge code={rule.outward_code} />
                </div>
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

      {(() => {
        const trimmed = testPostcode.trim();
        if (!trimmed) {
          return (
            <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "hsl(var(--border))" }}>
              <label className="block text-xs font-medium mb-1.5">Test a learner postcode</label>
              <input
                value={testPostcode}
                onChange={e => setTestPostcode(e.target.value.toUpperCase())}
                placeholder="e.g. SO22 5DR"
                className="w-full max-w-xs rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "hsl(var(--border) / 0.6)" }}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Enter a postcode to preview which rate would apply.
              </p>
            </div>
          );
        }
        const outward = extractOutwardCode(trimmed);
        const persistedRules = draftRules
          .filter(r => r._persisted)
          .map(r => ({ outward_code: r.outward_code, hourly_rate: Number(r.hourly_rate) || 0 }));
        const match = outward
          ? persistedRules.find(r => r.outward_code.toUpperCase() === outward)
          : null;
        const resolved = resolveHourlyRate({
          pupilPostcode: trimmed,
          instructorDefaultRate: defaultRate,
          postcodeRules: persistedRules,
        });
        const valid = !!outward;
        return (
          <div
            className="mt-4 rounded-xl border p-3"
            style={{ borderColor: match ? "hsl(142 70% 40% / 0.5)" : "hsl(var(--border))" }}
          >
            <label className="block text-xs font-medium mb-1.5">Test a learner postcode</label>
            <input
              value={testPostcode}
              onChange={e => setTestPostcode(e.target.value.toUpperCase())}
              placeholder="e.g. SO22 5DR"
              className="w-full max-w-xs rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "hsl(var(--border) / 0.6)" }}
            />
            <div className="mt-2 text-xs space-y-1">
              {!valid ? (
                <div style={{ color: "hsl(0 72% 50%)" }}>Not a recognisable UK postcode.</div>
              ) : (
                <>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span>Outward code: <span className="font-mono font-medium text-foreground">{outward}</span></span>
                    <OutwardStatusBadge code={outward || ""} />
                  </div>
                  {match ? (
                    <div>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium mr-2"
                        style={{ background: "hsl(142 70% 40% / 0.15)", color: "hsl(142 70% 30%)" }}
                      >
                        Postcode rule
                      </span>
                      Uses <span className="font-semibold text-foreground">£{match.hourly_rate.toFixed(2)}/hr</span> from your{" "}
                      <span className="font-mono">{match.outward_code}</span> rule.
                    </div>
                  ) : (
                    <div>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium mr-2"
                        style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                      >
                        Default
                      </span>
                      No matching rule. Falls back to default{" "}
                      {defaultRate != null
                        ? <>rate <span className="font-semibold text-foreground">£{defaultRate.toFixed(2)}/hr</span>.</>
                        : <>hourly rate (not set).</>}
                    </div>
                  )}
                  {resolved != null && (
                    <div className="text-muted-foreground">
                      Effective rate: <span className="font-semibold text-foreground">£{resolved.toFixed(2)}/hr</span>{" "}
                      (a 1-hour lesson would cost £{resolved.toFixed(2)})
                    </div>
                  )}
                  <div className="text-muted-foreground italic">
                    Note: a pupil's own custom rate would still override this.
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      <p className="mt-3 text-xs text-muted-foreground">
        Priority: pupil's custom rate → matching postcode rule → default hourly rate.
      </p>
    </div>
  );
}

/* ============================================================
   CSV importer (inline)
   ============================================================ */
interface ParsedRow { outward_code: string; hourly_rate: number; }
interface ParseError { line: number; raw: string; reason: string; }

function parseCsv(text: string): { rows: ParsedRow[]; errors: ParseError[] } {
  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    // skip header
    if (i === 0 && /[a-z]/i.test(line) && !/\d/.test(line)) continue;
    const parts = line.split(/[,\t;]/).map(s => s.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 2) { errors.push({ line: i + 1, raw, reason: "Need 2 columns: postcode, rate" }); continue; }
    const code = parts[0].replace(/\s+/g, "").toUpperCase().slice(0, 4);
    const rateStr = parts[1].replace(/[£$,\s]/g, "");
    const rate = Number(rateStr);
    if (!isValidOutwardCode(code)) { errors.push({ line: i + 1, raw, reason: `Invalid postcode "${parts[0]}"` }); continue; }
    if (!Number.isFinite(rate) || rate <= 0) { errors.push({ line: i + 1, raw, reason: `Invalid rate "${parts[1]}"` }); continue; }
    if (seen.has(code)) { errors.push({ line: i + 1, raw, reason: `Duplicate ${code} in CSV` }); continue; }
    seen.add(code);
    rows.push({ outward_code: code, hourly_rate: Math.round(rate * 100) / 100 });
  }
  return { rows, errors };
}

function CsvImporter({
  existing,
  onApply,
  onCancel,
}: {
  existing: PostcodeRule[];
  onApply: (rows: ParsedRow[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { rows, errors } = parseCsv(text);
  const existingCodes = new Set(existing.map(r => r.outward_code.toUpperCase()));
  const newCount = rows.filter(r => !existingCodes.has(r.outward_code)).length;
  const updateCount = rows.filter(r => existingCodes.has(r.outward_code)).length;

  const onFile = async (f: File | null) => {
    if (!f) return;
    setText(await f.text());
  };

  return (
    <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium">Bulk import postcode rates</div>
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={e => onFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Format: <code>outward_code,hourly_rate</code> per line. Header optional. Example:
        <br />
        <code>SO22,42.00</code> &nbsp;<code>SO23,40</code> &nbsp;<code>PO19,45</code>
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        placeholder={"SO22, 42.00\nSO23, 40\nPO19, 45"}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2"
        style={{ borderColor: "hsl(var(--border) / 0.6)" }}
      />
      {(rows.length > 0 || errors.length > 0) && (
        <div className="mt-2 text-xs">
          <div className="text-muted-foreground">
            {rows.length} valid · {newCount} new · {updateCount} update existing · {errors.length} error{errors.length === 1 ? "" : "s"}
          </div>
          {errors.length > 0 && (
            <ul className="mt-1 max-h-24 overflow-auto" style={{ color: "hsl(0 72% 50%)" }}>
              {errors.slice(0, 10).map((e, i) => (
                <li key={i}>Line {e.line}: {e.reason}</li>
              ))}
              {errors.length > 10 && <li>…and {errors.length - 10} more</li>}
            </ul>
          )}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy || rows.length === 0}
          onClick={async () => { setBusy(true); try { await onApply(rows); } finally { setBusy(false); } }}
          className="rounded-lg px-3 h-9 text-sm font-medium disabled:opacity-40"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {busy ? "Importing…" : `Import ${rows.length || ""}`.trim()}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border bg-transparent px-3 h-9 text-sm hover:bg-muted disabled:opacity-40"
          style={{ borderColor: "hsl(var(--border) / 0.6)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Outward code verification badge (postcodes.io)
   ============================================================ */
function OutwardStatusBadge({ code }: { code: string }) {
  const trimmed = (code || "").replace(/\s+/g, "").toUpperCase();
  const formatOk = trimmed.length > 0 && isValidOutwardCode(trimmed);
  const [status, setStatus] = useState<OutwardStatus>(() =>
    formatOk ? (getCachedOutwardStatus(trimmed) ?? "unknown") : "unknown"
  );
  const lastChecked = useRef<string>("");

  useEffect(() => {
    if (!formatOk) { setStatus("unknown"); return; }
    const cached = getCachedOutwardStatus(trimmed);
    if (cached) { setStatus(cached); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (lastChecked.current === trimmed) return;
      lastChecked.current = trimmed;
      setStatus("checking");
      const res = await verifyOutwardCode(trimmed, ctrl.signal);
      setStatus(res);
    }, 400);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [trimmed, formatOk]);

  if (!trimmed) return null;
  if (!formatOk) {
    return <span className="mt-1 inline-block text-[11px]" style={{ color: "hsl(0 72% 50%)" }}>Invalid format</span>;
  }
  if (status === "checking" || status === "unknown") {
    return <span className="mt-1 inline-block text-[11px] text-muted-foreground">Checking…</span>;
  }
  if (status === "valid") {
    return (
      <span className="mt-1 inline-flex items-center gap-1 text-[11px]" style={{ color: "hsl(142 70% 30%)" }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Verified UK postcode
      </span>
    );
  }
  if (status === "invalid") {
    return <span className="mt-1 inline-block text-[11px]" style={{ color: "hsl(28 90% 45%)" }}>Postcode not found</span>;
  }
  return <span className="mt-1 inline-block text-[11px] text-muted-foreground">Couldn't verify</span>;
}

/* ============================================================
   Rate modifiers (weekend / bank holiday / off-peak)
   ============================================================ */
interface ModifiersDraft {
  weekend_surcharge_pct: number;
  bank_holiday_surcharge_pct: number;
  odd_hours_surcharge_pct: number;
  odd_hours_start: string; // "HH:MM"
  odd_hours_end: string;   // "HH:MM"
}

const trimTime = (t: string | null | undefined): string => (t || "").slice(0, 5);

export function RateModifiersSection({ instructorId }: { instructorId: string }) {
  const [draft, setDraft] = useState<ModifiersDraft | null>(null);
  const [orig, setOrig] = useState<ModifiersDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, setDirty } = useSettingsDirty();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("weekend_surcharge_pct, bank_holiday_surcharge_pct, odd_hours_surcharge_pct, odd_hours_start, odd_hours_end")
        .eq("id", instructorId)
        .single();
      const d: ModifiersDraft = {
        weekend_surcharge_pct: Number((data as any)?.weekend_surcharge_pct ?? 0),
        bank_holiday_surcharge_pct: Number((data as any)?.bank_holiday_surcharge_pct ?? 0),
        odd_hours_surcharge_pct: Number((data as any)?.odd_hours_surcharge_pct ?? 0),
        odd_hours_start: trimTime((data as any)?.odd_hours_start) || "20:00",
        odd_hours_end: trimTime((data as any)?.odd_hours_end) || "07:00",
      };
      setDraft(d);
      setOrig(d);
      setLoading(false);
    })();
  }, [instructorId]);

  const dirty = !!draft && !!orig && JSON.stringify(draft) !== JSON.stringify(orig);
  useEffect(() => { setDirty("rate-modifiers", dirty); }, [dirty, setDirty]);

  useEffect(() => {
    if (!draft) return;
    register("rate-modifiers", {
      save: async () => {
        const clamp = (n: number) => Math.max(0, Math.min(200, Number(n) || 0));
        const payload = {
          weekend_surcharge_pct: clamp(draft.weekend_surcharge_pct),
          bank_holiday_surcharge_pct: clamp(draft.bank_holiday_surcharge_pct),
          odd_hours_surcharge_pct: clamp(draft.odd_hours_surcharge_pct),
          odd_hours_start: draft.odd_hours_start,
          odd_hours_end: draft.odd_hours_end,
        };
        const { error } = await supabase.from("instructors").update(payload).eq("id", instructorId);
        if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); throw error; }
        setOrig(draft);
        toast({ title: "Saved" });
      },
      reset: () => setDraft(orig),
    });
    return () => register("rate-modifiers", null);
  }, [draft, orig, register, instructorId]);

  if (loading || !draft) return <div className="text-xs text-muted-foreground">Loading…</div>;

  const Row = ({
    label, hint, value, onChange,
  }: { label: string; hint: string; value: number; onChange: (n: number) => void }) => (
    <div className="grid items-center gap-3" style={{ gridTemplateColumns: "1fr 140px" }}>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <div className="relative">
        <input
          type="number" inputMode="decimal" step="1" min="0" max="200"
          value={value}
          onChange={e => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full rounded-lg border bg-background pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "hsl(var(--border) / 0.6)" }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Row
        label="Weekend surcharge"
        hint="Applied to lessons on Saturday or Sunday."
        value={draft.weekend_surcharge_pct}
        onChange={n => setDraft(p => p && ({ ...p, weekend_surcharge_pct: n }))}
      />
      <Row
        label="Bank holiday surcharge"
        hint="Applied on UK bank holidays. Takes priority over weekend surcharge."
        value={draft.bank_holiday_surcharge_pct}
        onChange={n => setDraft(p => p && ({ ...p, bank_holiday_surcharge_pct: n }))}
      />

      <div className="rounded-xl border p-3" style={{ borderColor: "hsl(var(--border))" }}>
        <Row
          label="Off-peak / odd-hours surcharge"
          hint="Applied when the lesson starts inside the window below."
          value={draft.odd_hours_surcharge_pct}
          onChange={n => setDraft(p => p && ({ ...p, odd_hours_surcharge_pct: n }))}
        />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">Window starts at</label>
            <input
              type="time"
              value={draft.odd_hours_start}
              onChange={e => setDraft(p => p && ({ ...p, odd_hours_start: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "hsl(var(--border) / 0.6)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Window ends at</label>
            <input
              type="time"
              value={draft.odd_hours_end}
              onChange={e => setDraft(p => p && ({ ...p, odd_hours_end: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "hsl(var(--border) / 0.6)" }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Window can wrap midnight (e.g. 20:00 → 07:00). Surcharges stack with each other but bank
          holiday replaces weekend.
        </p>
      </div>
    </div>
  );
}
