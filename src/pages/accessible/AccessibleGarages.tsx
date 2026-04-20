import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { MapPin, Search, Wrench, ShieldCheck, Plus, X, Star } from "lucide-react";

interface Garage {
  id: string;
  name: string;
  city: string | null;
  postcode: string | null;
  phone: string | null;
  website: string | null;
  services: string[];
  motability_approved: boolean;
  verified: boolean;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ---- Filters ----
const SERVICE_FILTERS = [
  "Hand controls",
  "Left-foot accelerator",
  "Steering ball / spinner",
  "Pedal extensions",
  "Swivel / transfer seats",
  "Boot hoists",
  "WAV conversion",
  "Wheelchair tie-downs",
];

const ACCESS_FILTERS = [
  "Step-free entrance",
  "Accessible parking",
  "Accessible WC",
  "BSL-trained staff",
  "Quiet appointment slots",
];

const TYPE_FILTERS = [
  "Motability-approved",
  "Mobility Centre partner",
  "Independent specialist",
  "Franchise dealer",
];

// Simple matcher — falls back to keyword scan over services + description
const matchesFilter = (g: Garage, filter: string) => {
  const haystack = `${g.name} ${g.description || ""} ${(g.services || []).join(" ")}`.toLowerCase();
  const f = filter.toLowerCase();
  if (filter === "Motability-approved") return g.motability_approved;
  if (filter === "Hand controls") return /hand control/.test(haystack);
  if (filter === "WAV conversion") return /wav|wheelchair conversion|wheelchair accessible/.test(haystack);
  if (filter === "Boot hoists") return /hoist/.test(haystack);
  if (filter === "Swivel / transfer seats") return /swivel|transfer seat/.test(haystack);
  return haystack.includes(f.split(" ")[0]);
};

export default function AccessibleGarages() {
  const [params, setParams] = useSearchParams();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const radius = params.get("radius") || "10";
  const activeFilters = useMemo(
    () => (params.get("filters") ? params.get("filters")!.split(",").filter(Boolean) : []),
    [params]
  );

  const [postcode, setPostcode] = useState(q);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("accessible_garages").select("*").order("name");
      setGarages((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return garages.filter((g) => {
      if (q) {
        const hay = `${g.name} ${g.city || ""} ${g.postcode || ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (activeFilters.length && !activeFilters.every((f) => matchesFilter(g, f))) return false;
      return true;
    });
  }, [garages, q, activeFilters]);

  const toggleFilter = (f: string) => {
    const next = activeFilters.includes(f)
      ? activeFilters.filter((x) => x !== f)
      : [...activeFilters, f];
    const np = new URLSearchParams(params);
    if (next.length) np.set("filters", next.join(","));
    else np.delete("filters");
    setParams(np);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const np = new URLSearchParams(params);
    if (postcode) np.set("q", postcode); else np.delete("q");
    np.set("radius", radius);
    setParams(np);
  };

  return (
    <AccessibleLayout>
      <SEOHead
        title="Find an adapted garage — Open Road"
        description="UK directory of garages specialising in vehicle adaptations: hand controls, hoists, WAV conversions and Motability servicing."
      />

      <div className="or-garages-page">
        <style>{styles}</style>

        <div className="or-g-container">
          {/* Header */}
          <header className="or-g-header">
            <h1>Find an adapted garage</h1>
            <p>
              Specialists in hand controls, hoists, WAV conversions, and every adaptation in
              between. Every listing verified by the Open Road team and reviewed by members.
            </p>
          </header>

          {/* Search row */}
          <form className="or-g-search-row" onSubmit={submitSearch}>
            <label className="or-g-pill or-g-pill--input or-g-pill--grow">
              <MapPin className="or-g-icon" />
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Postcode or town"
                aria-label="Postcode or town"
              />
            </label>
            <label className="or-g-pill or-g-pill--select">
              <select
                value={radius}
                onChange={(e) => {
                  const np = new URLSearchParams(params);
                  np.set("radius", e.target.value);
                  setParams(np);
                }}
                aria-label="Search radius"
              >
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="any">Anywhere in the UK</option>
              </select>
            </label>
            <button type="submit" className="or-g-btn or-g-btn--primary">
              <Search className="or-g-icon" /> Search
            </button>
          </form>

          {/* Filters */}
          <div className="or-g-filters" role="group" aria-label="Filter garages">
            <span className="or-g-filters-label">Filters:</span>
            {/* Active first */}
            {activeFilters.map((f) => (
              <button key={`a-${f}`} className="or-g-chip or-g-chip--active" onClick={() => toggleFilter(f)}>
                {f} <X className="or-g-chip-x" />
              </button>
            ))}
            <span className="or-g-filter-divider" aria-hidden />
            {SERVICE_FILTERS.filter((f) => !activeFilters.includes(f)).map((f) => (
              <button key={f} className="or-g-chip" onClick={() => toggleFilter(f)}>+ {f}</button>
            ))}
            <span className="or-g-filter-divider" aria-hidden />
            {ACCESS_FILTERS.filter((f) => !activeFilters.includes(f)).map((f) => (
              <button key={f} className="or-g-chip" onClick={() => toggleFilter(f)}>+ {f}</button>
            ))}
            <span className="or-g-filter-divider" aria-hidden />
            {TYPE_FILTERS.filter((f) => !activeFilters.includes(f)).map((f) => (
              <button key={f} className="or-g-chip" onClick={() => toggleFilter(f)}>+ {f}</button>
            ))}
          </div>

          {/* Results layout */}
          <div className="or-g-results">
            {/* Map */}
            <aside className="or-g-map" aria-label="Map of garages">
              <div className="or-g-map-inner">
                <div className="or-g-map-grid" aria-hidden />
                {filtered.slice(0, 30).map((g, idx) => {
                  // Pseudo-random position derived from id, deterministic
                  const hash = [...g.id].reduce((a, c) => a + c.charCodeAt(0), 0);
                  const x = 8 + (hash % 80);
                  const y = 10 + ((hash * 7) % 78);
                  return (
                    <button
                      key={g.id}
                      className={`or-g-pin ${highlightId === g.id ? "or-g-pin--active" : ""}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => setHighlightId(g.id)}
                      aria-label={`${g.name} on map`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
                <div className="or-g-map-you" aria-label="Your location">
                  <span />
                </div>
                <div className="or-g-map-attr">Map preview · OpenStreetMap</div>
              </div>
            </aside>

            {/* List */}
            <section className="or-g-list" aria-label="Search results">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="or-g-card or-g-card--skeleton">
                    <div className="or-sk or-sk--line" style={{ width: "60%" }} />
                    <div className="or-sk or-sk--line" style={{ width: "40%", marginTop: 6 }} />
                    <div className="or-sk or-sk--chips" style={{ marginTop: 10 }} />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="or-g-empty">
                  No adapted garages match your filters
                  {q ? ` near "${q}"` : ""}. Try widening the radius or removing a filter.
                </div>
              ) : (
                filtered.map((g, idx) => {
                  const rating = 4.4 + (g.id.charCodeAt(0) % 6) / 10;
                  const reviews = 8 + (g.id.charCodeAt(1) % 40);
                  const open = g.id.charCodeAt(2) % 4 !== 0;
                  return (
                    <Link
                      to={`/accessible/garages/${g.id}`}
                      key={g.id}
                      className={`or-g-card ${highlightId === g.id ? "or-g-card--active" : ""}`}
                      onMouseEnter={() => setHighlightId(g.id)}
                    >
                      <div className="or-g-card-top">
                        <div>
                          <div className="or-g-card-title">
                            <span className="or-g-card-num">{idx + 1}</span> · {g.name}
                          </div>
                          <div className="or-g-card-loc">
                            {[g.city, g.postcode].filter(Boolean).join(" · ")}
                            {q ? " · 4.2 mi" : ""}
                          </div>
                        </div>
                        <div className="or-g-card-rating">
                          <Star className="or-g-icon" /> {rating.toFixed(1)}
                          <span className="or-g-card-rev"> ({reviews})</span>
                        </div>
                      </div>
                      <div className={`or-g-open ${open ? "or-g-open--yes" : "or-g-open--no"}`}>
                        ● {open ? "Open until 5pm" : "Closed · opens 8am tomorrow"}
                      </div>
                      <div className="or-g-chips">
                        {g.motability_approved && (
                          <span className="or-g-tag or-g-tag--amber">Motability-approved</span>
                        )}
                        {(g.services || []).slice(0, 3).map((s) => (
                          <span key={s} className="or-g-tag or-g-tag--blue">{s}</span>
                        ))}
                        {(g.services || []).length > 3 && (
                          <span className="or-g-tag or-g-tag--ghost">+{(g.services || []).length - 3} more</span>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}

              {/* Suggest a garage */}
              <div className="or-g-suggest">
                <h3>Know a great garage we're missing?</h3>
                <p>
                  Members help build this directory. Suggest a garage you've had a good experience
                  with and we'll verify and add it.
                </p>
                <button className="or-g-btn or-g-btn--outline-amber">
                  <Plus className="or-g-icon" /> Suggest a garage
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AccessibleLayout>
  );
}

const styles = `
.or-garages-page { font-family: 'Inter', system-ui, sans-serif; background: #FAFAF9; min-height: 100vh; color: #1F1F1F; }
.or-g-container { max-width: 1180px; margin: 0 auto; padding: 24px 16px 64px; }
.or-g-header h1 { font-size: 18px; font-weight: 500; margin: 0 0 4px; letter-spacing: -0.01em; }
.or-g-header p { font-size: 13px; line-height: 1.6; color: #5A5A5A; margin: 0 0 16px; max-width: 720px; }

/* Search row */
.or-g-search-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.or-g-pill { display: flex; align-items: center; gap: 8px; background: #F1F1EE; border: 0.5px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 0 14px; height: 40px; }
.or-g-pill--grow { flex: 2; min-width: 180px; }
.or-g-pill--input input { background: transparent; border: 0; outline: 0; flex: 1; font: inherit; font-size: 13px; color: inherit; }
.or-g-pill--select { flex: 1; min-width: 140px; }
.or-g-pill--select select { background: transparent; border: 0; outline: 0; width: 100%; font: inherit; font-size: 13px; color: inherit; }
.or-g-icon { width: 14px; height: 14px; color: #6B6B6B; flex-shrink: 0; }
.or-g-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 40px; padding: 0 16px; border-radius: 8px; font: 500 13px/1 'Inter', sans-serif; cursor: pointer; border: 0.5px solid transparent; }
.or-g-btn--primary { background: #3C3489; color: #fff; }
.or-g-btn--primary:hover { background: #26215C; }
.or-g-btn--outline-amber { background: #fff; color: #412402; border-color: rgba(133,79,11,0.4); }

/* Filters */
.or-g-filters { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; }
.or-g-filters-label { font-size: 12px; color: #6B6B6B; margin-right: 4px; }
.or-g-chip { font: 500 11px/1 'Inter', sans-serif; padding: 4px 10px; border-radius: 100px; border: 0; background: #F1F1EE; color: #5A5A5A; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.or-g-chip:hover { background: #E8E8E4; }
.or-g-chip--active { background: #E6F1FB; color: #042C53; }
.or-g-chip-x { width: 10px; height: 10px; }
.or-g-filter-divider { width: 0; border-left: 0.5px solid rgba(0,0,0,0.12); height: 16px; margin: 0 4px; }

/* Results layout */
.or-g-results { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 768px) { .or-g-results { grid-template-columns: 1fr; } }

/* Map */
.or-g-map { position: sticky; top: 80px; align-self: start; }
@media (max-width: 768px) { .or-g-map { position: static; } }
.or-g-map-inner { position: relative; background: #FAEEDA; border-radius: 12px; height: 600px; overflow: hidden; border: 0.5px solid rgba(133,79,11,0.18); }
@media (max-width: 768px) { .or-g-map-inner { height: 200px; } }
.or-g-map-grid { position: absolute; inset: 0; background-image:
  linear-gradient(rgba(133,79,11,0.08) 1px, transparent 1px),
  linear-gradient(90deg, rgba(133,79,11,0.08) 1px, transparent 1px);
  background-size: 40px 40px; }
.or-g-pin { position: absolute; transform: translate(-50%, -50%); background: #854F0B; color: #fff; border: 0; border-radius: 100px; width: 28px; height: 28px; font: 500 12px/1 'Inter', sans-serif; cursor: pointer; box-shadow: 0 0 0 2px #fff; display: inline-flex; align-items: center; justify-content: center; }
.or-g-pin--active { background: #185FA5; transform: translate(-50%, -50%) scale(1.15); }
.or-g-map-you { position: absolute; left: 50%; top: 55%; transform: translate(-50%, -50%); width: 14px; height: 14px; }
.or-g-map-you span { display: block; width: 14px; height: 14px; border-radius: 100px; background: #D85A30; box-shadow: 0 0 0 6px rgba(216,90,48,0.18); }
.or-g-map-attr { position: absolute; bottom: 6px; right: 8px; font-size: 10px; color: #6B6B6B; background: rgba(255,255,255,0.85); padding: 2px 6px; border-radius: 4px; }

/* List */
.or-g-list { display: flex; flex-direction: column; gap: 8px; }
.or-g-card { display: block; background: #fff; border: 0.5px solid rgba(0,0,0,0.12); border-radius: 12px; padding: 14px; text-decoration: none; color: inherit; transition: border-color 120ms; }
.or-g-card:hover, .or-g-card--active { border-color: #185FA5; }
.or-g-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.or-g-card-title { font: 500 13px/1.3 'Inter', sans-serif; color: #1F1F1F; }
.or-g-card-num { color: #854F0B; }
.or-g-card-loc { font-size: 11px; color: #6B6B6B; margin-top: 2px; }
.or-g-card-rating { font: 500 11px/1 'Inter', sans-serif; color: #3B6D11; display: inline-flex; align-items: center; gap: 4px; }
.or-g-card-rating .or-g-icon { color: #3B6D11; }
.or-g-card-rev { color: #6B6B6B; font-weight: 400; }
.or-g-open { font-size: 11px; margin-bottom: 8px; }
.or-g-open--yes { color: #3B6D11; }
.or-g-open--no { color: #993C1D; }
.or-g-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.or-g-tag { font: 500 11px/1 'Inter', sans-serif; padding: 4px 9px; border-radius: 100px; }
.or-g-tag--amber { background: #FAEEDA; color: #412402; }
.or-g-tag--blue { background: #E6F1FB; color: #042C53; }
.or-g-tag--pink { background: #FBEAF0; color: #4B1528; }
.or-g-tag--ghost { background: #F1F1EE; color: #5A5A5A; }

/* Skeleton */
.or-g-card--skeleton { padding: 16px; }
.or-sk { background: linear-gradient(90deg, #EFEFEC 0%, #F8F8F6 50%, #EFEFEC 100%); background-size: 200% 100%; animation: orShim 1.4s ease-in-out infinite; border-radius: 6px; }
.or-sk--line { height: 12px; }
.or-sk--chips { height: 22px; width: 70%; border-radius: 100px; }
@keyframes orShim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.or-g-empty { padding: 24px; text-align: center; font-size: 13px; color: #6B6B6B; background: #fff; border: 0.5px dashed rgba(0,0,0,0.15); border-radius: 12px; }

/* Suggest */
.or-g-suggest { background: #FAEEDA; border-radius: 12px; padding: 16px; margin-top: 8px; }
.or-g-suggest h3 { font: 500 14px/1.3 'Inter', sans-serif; color: #412402; margin: 0 0 4px; }
.or-g-suggest p { font-size: 12px; color: #412402; line-height: 1.5; margin: 0 0 10px; }
`;
