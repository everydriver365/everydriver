import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettingsDirty } from "../SettingsDirtyContext";
import { toast } from "@/hooks/use-toast";

interface Row {
  hourly_rate: number | null;
  home_postcode: string | null;
  radius_miles: number | null;
}

export function RatesCoveragePage({ instructorId }: { instructorId: string }) {
  const [original, setOriginal] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, setDirty } = useSettingsDirty();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("hourly_rate, home_postcode, radius_miles")
        .eq("id", instructorId)
        .single();
      if (data) {
        setOriginal(data as Row);
        setDraft(data as Row);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const dirty = !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original);
  useEffect(() => { setDirty("rates-coverage", dirty); }, [dirty, setDirty]);

  useEffect(() => {
    if (!draft) return;
    register("rates-coverage", {
      save: async () => {
        const { error } = await supabase.from("instructors").update({
          hourly_rate: draft.hourly_rate,
          home_postcode: draft.home_postcode,
          radius_miles: draft.radius_miles,
        }).eq("id", instructorId);
        if (error) toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
        else { setOriginal(draft); toast({ title: "Saved" }); }
      },
      reset: () => setDraft(original),
    });
    return () => register("rates-coverage", null);
  }, [draft, original, register, instructorId]);

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
    </>
  );
}
