import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettingsDirty } from "../SettingsDirtyContext";
import { toast } from "@/hooks/use-toast";
import { isValidOutwardCode } from "@/lib/pricing/resolveHourlyRate";

interface Row {
  hourly_rate: number | null;
  home_postcode: string | null;
  radius_miles: number | null;
}

interface PostcodeRule {
  id: string; // local uuid (db id or `new-...`)
  outward_code: string;
  hourly_rate: number | null;
  _persisted?: boolean;
}

function newLocalId() {
  return `new-${Math.random().toString(36).slice(2, 10)}`;
}

export function RatesCoveragePage({ instructorId }: { instructorId: string }) {
  const [original, setOriginal] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const [originalRules, setOriginalRules] = useState<PostcodeRule[]>([]);
  const [draftRules, setDraftRules] = useState<PostcodeRule[]>([]);

  const { register, setDirty } = useSettingsDirty();

  useEffect(() => {
    (async () => {
      const [{ data: inst }, { data: rules }] = await Promise.all([
        supabase
          .from("instructors")
          .select("hourly_rate, home_postcode, radius_miles")
          .eq("id", instructorId)
          .single(),
        supabase
          .from("instructor_postcode_rates")
          .select("id, outward_code, hourly_rate")
          .eq("instructor_id", instructorId)
          .order("outward_code", { ascending: true }),
      ]);
      if (inst) {
        setOriginal(inst as Row);
        setDraft(inst as Row);
      }
      const mapped: PostcodeRule[] = (rules ?? []).map((r: any) => ({
        id: r.id,
        outward_code: r.outward_code,
        hourly_rate: r.hourly_rate == null ? null : Number(r.hourly_rate),
        _persisted: true,
      }));
      setOriginalRules(mapped);
      setDraftRules(mapped);
      setLoading(false);
    })();
  }, [instructorId]);

  // Validation
  const codes = draftRules.map(r => (r.outward_code || "").trim().toUpperCase());
  const dupes = new Set(codes.filter((c, i) => c && codes.indexOf(c) !== i));
  const ruleErrors = draftRules.map(r => {
    const code = (r.outward_code || "").trim().toUpperCase();
    if (!code) return "Postcode required";
    if (!isValidOutwardCode(code)) return "Invalid postcode";
    if (dupes.has(code)) return "Duplicate";
    if (r.hourly_rate == null || r.hourly_rate <= 0) return "Rate must be > 0";
    return null;
  });
  const rulesValid = ruleErrors.every(e => e === null);

  const baseDirty = !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original);
  const rulesDirty =
    JSON.stringify(originalRules.map(r => ({ ...r, _persisted: undefined }))) !==
    JSON.stringify(draftRules.map(r => ({ ...r, _persisted: undefined })));
  const dirty = baseDirty || rulesDirty;

  useEffect(() => { setDirty("rates-coverage", dirty); }, [dirty, setDirty]);

  useEffect(() => {
    if (!draft) return;
    register("rates-coverage", {
      save: async () => {
        if (!rulesValid) {
          toast({ title: "Fix postcode rate errors before saving", variant: "destructive" });
          throw new Error("invalid postcode rules");
        }
        // 1. Save instructor base fields
        if (baseDirty) {
          const { error } = await supabase.from("instructors").update({
            hourly_rate: draft.hourly_rate,
            home_postcode: draft.home_postcode,
            radius_miles: draft.radius_miles,
          }).eq("id", instructorId);
          if (error) {
            toast({ title: "Couldn't save rates", description: error.message, variant: "destructive" });
            throw error;
          }
        }

        // 2. Diff postcode rules
        const originalById = new Map(originalRules.map(r => [r.id, r]));
        const draftById = new Map(draftRules.map(r => [r.id, r]));

        const toDelete = originalRules.filter(r => !draftById.has(r.id)).map(r => r.id);
        const toInsert = draftRules
          .filter(r => !r._persisted)
          .map(r => ({
            instructor_id: instructorId,
            outward_code: r.outward_code.trim().toUpperCase(),
            hourly_rate: r.hourly_rate as number,
          }));
        const toUpdate = draftRules.filter(r => {
          if (!r._persisted) return false;
          const orig = originalById.get(r.id);
          return orig && (
            orig.outward_code !== r.outward_code.trim().toUpperCase() ||
            Number(orig.hourly_rate) !== Number(r.hourly_rate)
          );
        });

        if (toDelete.length) {
          const { error } = await supabase.from("instructor_postcode_rates").delete().in("id", toDelete);
          if (error) { toast({ title: "Couldn't remove postcode rules", description: error.message, variant: "destructive" }); throw error; }
        }
        if (toInsert.length) {
          const { error } = await supabase.from("instructor_postcode_rates").insert(toInsert);
          if (error) { toast({ title: "Couldn't add postcode rules", description: error.message, variant: "destructive" }); throw error; }
        }
        for (const r of toUpdate) {
          const { error } = await supabase.from("instructor_postcode_rates").update({
            outward_code: r.outward_code.trim().toUpperCase(),
            hourly_rate: r.hourly_rate as number,
          }).eq("id", r.id);
          if (error) { toast({ title: "Couldn't update postcode rule", description: error.message, variant: "destructive" }); throw error; }
        }

        // 3. Refresh rules from server (so new rows get real ids)
        const { data: rules } = await supabase
          .from("instructor_postcode_rates")
          .select("id, outward_code, hourly_rate")
          .eq("instructor_id", instructorId)
          .order("outward_code", { ascending: true });
        const mapped: PostcodeRule[] = (rules ?? []).map((r: any) => ({
          id: r.id,
          outward_code: r.outward_code,
          hourly_rate: r.hourly_rate == null ? null : Number(r.hourly_rate),
          _persisted: true,
        }));
        setOriginalRules(mapped);
        setDraftRules(mapped);
        setOriginal(draft);
        toast({ title: "Saved" });
      },
      reset: () => {
        setDraft(original);
        setDraftRules(originalRules);
      },
    });
    return () => register("rates-coverage", null);
  }, [draft, original, draftRules, originalRules, baseDirty, rulesValid, register, instructorId]);

  if (loading || !draft) return <div className="sv2-card" style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading…</div>;

  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Rates</div>
          <div className="sv2-section-sub">Your default hourly rate for new bookings.</div>
        </div>
        <div className="sv2-grid-2">
          <div>
            <label className="sv2-label">Hourly rate <span className="sv2-optional">(£)</span></label>
            <input
              className="sv2-input"
              type="number" inputMode="decimal" step="0.50" min="0"
              value={draft.hourly_rate ?? ""}
              onChange={e => setDraft(p => p && ({ ...p, hourly_rate: e.target.value === "" ? null : Number(e.target.value) }))}
            />
            <div className="sv2-helper">Used as the default when you create new courses.</div>
          </div>
        </div>
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Coverage</div>
          <div className="sv2-section-sub">The area you'll travel to for lessons.</div>
        </div>
        <div className="sv2-grid-2">
          <div>
            <label className="sv2-label">Home postcode</label>
            <input
              className="sv2-input"
              value={draft.home_postcode ?? ""}
              onChange={e => setDraft(p => p && ({ ...p, home_postcode: e.target.value.toUpperCase() }))}
              placeholder="SO22 5DR"
            />
            <div className="sv2-helper">The centre of your service area. Not shown to learners.</div>
          </div>
          <div>
            <label className="sv2-label">Service radius <span className="sv2-optional">(miles)</span></label>
            <input
              className="sv2-input"
              type="number" inputMode="numeric" min="1" max="60"
              value={draft.radius_miles ?? ""}
              onChange={e => setDraft(p => p && ({ ...p, radius_miles: e.target.value === "" ? null : Number(e.target.value) }))}
            />
            <div className="sv2-helper">Learners outside this radius won't see you in search.</div>
          </div>
        </div>
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Postcode rates</div>
          <div className="sv2-section-sub">
            Charge a different hourly rate for specific postcode areas. Matched on the outward code (e.g. SO22).
            Pupils with their own custom rate are unaffected.
          </div>
        </div>

        {draftRules.length === 0 ? (
          <div
            style={{
              padding: 16,
              border: "1px dashed var(--color-border, #e2e8f0)",
              borderRadius: 12,
              color: "var(--color-text-tertiary)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            No postcode rules yet. Add one to charge a different rate for an area.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {draftRules.map((rule, idx) => {
              const err = ruleErrors[idx];
              return (
                <div
                  key={rule.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(110px, 160px) minmax(120px, 1fr) auto",
                    gap: 8,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <input
                      className="sv2-input"
                      value={rule.outward_code}
                      maxLength={4}
                      placeholder="SO22"
                      onChange={e => {
                        const v = e.target.value.replace(/\s+/g, "").toUpperCase().slice(0, 4);
                        setDraftRules(prev => prev.map(r => r.id === rule.id ? { ...r, outward_code: v } : r));
                      }}
                    />
                  </div>
                  <div>
                    <input
                      className="sv2-input"
                      type="number"
                      inputMode="decimal"
                      step="0.50"
                      min="0"
                      placeholder="£/hour"
                      value={rule.hourly_rate ?? ""}
                      onChange={e => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        setDraftRules(prev => prev.map(r => r.id === rule.id ? { ...r, hourly_rate: v } : r));
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Remove postcode rule"
                    onClick={() => setDraftRules(prev => prev.filter(r => r.id !== rule.id))}
                    style={{
                      border: "1px solid var(--color-border, #e2e8f0)",
                      background: "transparent",
                      borderRadius: 10,
                      padding: "0 12px",
                      height: 36,
                      cursor: "pointer",
                      color: "var(--color-text-secondary, #64748b)",
                    }}
                  >
                    ×
                  </button>
                  {err && (
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "hsl(0 72% 50%)" }}>
                      {err}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setDraftRules(prev => [...prev, { id: newLocalId(), outward_code: "", hourly_rate: null }])
          }
          style={{
            border: "1px solid var(--color-border, #e2e8f0)",
            background: "transparent",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            cursor: "pointer",
            color: "var(--color-text-primary, #0f172a)",
          }}
        >
          + Add postcode
        </button>

        <div className="sv2-helper" style={{ marginTop: 10 }}>
          Priority: pupil's custom rate → matching postcode rule → default hourly rate.
        </div>
      </section>
    </>
  );
}
