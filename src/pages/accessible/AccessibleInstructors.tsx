import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { Search, MapPin, Check, SlidersHorizontal, X } from "lucide-react";

interface Instructor {
  id: string;
  name: string;
  home_postcode: string | null;
  hourly_rate: number | null;
  adaptations: string[] | null;
  disability_experience: string[] | null;
  bsl_signing: boolean | null;
  motability_friendly: boolean | null;
  accessibility_bio: string | null;
  profile_image_url: string | null;
  bio: string | null;
  special_skills: string[] | string | null;
}

type Pillar = "blue" | "pink" | "purple" | "teal";

const ADAPTATION_FILTERS = [
  "Hand controls",
  "Left-foot accelerator",
  "Steering ball",
  "Automatic only",
  "Wheelchair stowage",
];

const COMMUNICATION_FILTERS = ["BSL signing", "Lip-reading friendly", "Plain English"];

const TEACHING_FILTERS = ["Anxiety-aware", "Autism-friendly", "Returning after injury", "Older learners"];

const PILLAR_HASH: Pillar[] = ["purple", "teal", "blue", "pink"];

function pillarFor(name: string): Pillar {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PILLAR_HASH[Math.abs(sum) % PILLAR_HASH.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function categorise(label: string): Pillar {
  const l = label.toLowerCase();
  if (
    /(hand control|left.foot|steering ball|spinner|automatic|wheelchair|adapt|push.pull)/.test(l)
  )
    return "blue";
  if (/(bsl|sign|lip.read|deaf|hearing|plain english)/.test(l)) return "pink";
  if (/(anxiety|autism|adhd|returning|refresher|older|nervous|stroke|first.time)/.test(l))
    return "purple";
  return "teal";
}

function specsFromInstructor(i: Instructor): { label: string; pillar: Pillar }[] {
  const out: { label: string; pillar: Pillar }[] = [];
  const seen = new Set<string>();
  const push = (label: string, pillar?: Pillar) => {
    const key = label.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ label: label.trim(), pillar: pillar ?? categorise(label) });
  };
  (i.adaptations || []).forEach((a) => push(a, "blue"));
  (i.disability_experience || []).forEach((a) => push(a, "purple"));
  if (i.bsl_signing) push("BSL signing", "pink");
  if (i.motability_friendly) push("Motability friendly", "blue");
  const skills = Array.isArray(i.special_skills)
    ? i.special_skills
    : typeof i.special_skills === "string"
    ? i.special_skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  skills.forEach((s) => push(s));
  return out.slice(0, 4);
}

export default function AccessibleInstructors() {
  const [params, setParams] = useSearchParams();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [postcode, setPostcode] = useState(params.get("postcode") || "");
  const [query, setQuery] = useState(params.get("q") || "");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Try accessible-flagged first
      let { data } = await supabase
        .from("instructors")
        .select(
          "id,name,home_postcode,hourly_rate,adaptations,disability_experience,bsl_signing,motability_friendly,accessibility_bio,profile_image_url,bio,special_skills"
        )
        .eq("accessibility_enabled", true)
        .order("name");
      // Fall back to all active instructors if nothing has been flagged yet
      if (!data || data.length === 0) {
        const fallback = await supabase
          .from("public_instructors")
          .select(
            "id,name,home_postcode,hourly_rate,profile_image_url,bio,special_skills"
          )
          .order("name")
          .limit(60);
        data = (fallback.data as any) || [];
      }
      setInstructors((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const filtered = useMemo(() => {
    return instructors.filter((i) => {
      if (postcode && !(i.home_postcode || "").toLowerCase().startsWith(postcode.toLowerCase().slice(0, 3))) {
        return false;
      }
      if (query) {
        const hay = `${i.name} ${i.bio || ""} ${i.accessibility_bio || ""}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      if (activeFilters.length) {
        const specs = specsFromInstructor(i).map((s) => s.label.toLowerCase());
        const blob = `${specs.join(" ")} ${(i.adaptations || []).join(" ")} ${(i.disability_experience || []).join(" ")}`.toLowerCase();
        for (const f of activeFilters) {
          if (f === "BSL signing" && !i.bsl_signing && !blob.includes("bsl")) return false;
          if (f !== "BSL signing" && !blob.includes(f.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [instructors, postcode, query, activeFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (postcode) next.set("postcode", postcode);
    setParams(next, { replace: true });
  };

  return (
    <AccessibleLayout>
      <SEOHead
        title="Find an instructor — Open Road"
        description="Search adapted-vehicle driving instructors trained for disabled learners. Filter by adaptations, BSL, and teaching style."
      />

      <div className="open-road-instructors">
        <style>{`
          .open-road-instructors {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            color: #1c1c1c;
            --or-purple:#3C3489; --or-purple-d:#26215C; --or-purple-m:#AFA9EC; --or-purple-l:#CECBF6; --or-purple-t:#EEEDFE;
            --or-teal:#0F6E56; --or-teal-d:#04342C; --or-teal-m:#5DCAA5; --or-teal-l:#9FE1CB; --or-teal-t:#E1F5EE;
            --or-blue:#185FA5; --or-blue-d:#042C53; --or-blue-l:#B5D4F4; --or-blue-t:#E6F1FB;
            --or-amber:#854F0B; --or-amber-t:#FAEEDA;
            --or-pink:#993556; --or-pink-d:#4B1528; --or-pink-t:#FBEAF0;
            --or-green:#3B6D11; --or-green-t:#EAF3DE;
            --or-coral:#D85A30;
            --or-border: rgba(15,15,30,0.10);
            --or-text-2: #5b6473;
            padding: 24px 0 64px;
            background: #fafafa;
          }
          .or-container { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
          .or-h1 { font-size: 30px; font-weight: 500; line-height: 1.25; color: var(--or-purple-d); margin: 0 0 6px; }
          .or-sub { font-size: 15px; color: var(--or-text-2); margin: 0 0 20px; max-width: 620px; }
          .or-card { background: #fff; border: 0.5px solid var(--or-border); border-radius: 12px; }

          /* Search bar */
          .or-search { padding: 12px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
          .or-search-field { display: flex; align-items: center; gap: 8px; background: #f3f4f6; border-radius: 8px; padding: 0 12px; flex: 1; min-width: 180px; height: 40px; }
          .or-search-field input { background: transparent; border: 0; outline: none; flex: 1; font: inherit; color: inherit; height: 100%; }
          .or-search-field input::placeholder { color: #9ca3af; }
          .or-search-field svg { color: #6b7280; flex-shrink: 0; }
          .or-search-postcode { flex: 0 1 160px; min-width: 120px; }
          .or-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 40px; padding: 0 16px; border-radius: 8px; font: 500 14px/1 'Inter', sans-serif; cursor: pointer; border: 0; transition: opacity .15s; text-decoration: none; }
          .or-btn:hover { opacity: 0.9; }
          .or-btn-primary { background: var(--or-purple); color: #fff; }
          .or-btn-secondary { background: #fff; color: var(--or-purple-d); border: 0.5px solid var(--or-purple-m); }
          .or-btn-ghost { background: transparent; color: var(--or-text-2); border: 0.5px solid var(--or-border); }

          /* Filters */
          .or-filter-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin: 20px 0 12px; }
          .or-result-count { font-size: 13px; color: var(--or-text-2); }
          .or-result-count strong { color: var(--or-purple-d); font-weight: 500; }
          .or-filter-toggle { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 100px; background: #fff; border: 0.5px solid var(--or-border); font: 500 13px/1 'Inter', sans-serif; color: var(--or-purple-d); cursor: pointer; }
          .or-filter-panel { padding: 16px 18px; margin-bottom: 16px; }
          .or-filter-group { margin-bottom: 14px; }
          .or-filter-group:last-child { margin-bottom: 0; }
          .or-filter-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: var(--or-text-2); margin-bottom: 8px; }
          .or-chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .or-chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 100px; font: 400 13px/1 'Inter', sans-serif; cursor: pointer; border: 0.5px solid var(--or-border); background: #fff; color: var(--or-purple-d); transition: all .15s; }
          .or-chip:hover { border-color: var(--or-purple-m); }
          .or-chip[data-active="true"] { background: var(--or-purple); color: #fff; border-color: var(--or-purple); font-weight: 500; }
          .or-chip-clear { background: var(--or-purple-t); color: var(--or-purple-d); border-color: transparent; font-weight: 500; }

          /* Active filters strip */
          .or-active-strip { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 16px; align-items: center; }
          .or-active-strip-label { font-size: 12px; color: var(--or-text-2); margin-right: 4px; }
          .or-active-pill { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px 0 10px; border-radius: 100px; background: var(--or-purple-t); color: var(--or-purple-d); font-size: 12px; font-weight: 500; }
          .or-active-pill button { background: transparent; border: 0; padding: 4px; cursor: pointer; color: inherit; display: inline-flex; border-radius: 100px; }
          .or-active-pill button:hover { background: rgba(60,52,137,0.15); }

          /* Results grid */
          .or-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
          @media (min-width: 720px) { .or-grid { grid-template-columns: 1fr 1fr; } }

          .or-instructor-card { display: flex; flex-direction: column; padding: 16px; gap: 14px; transition: border-color .15s; }
          .or-instructor-card:hover { border-color: var(--or-purple-m); }
          .or-card-top { display: flex; gap: 14px; align-items: flex-start; }
          .or-avatar { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font: 500 17px/1 'Inter', sans-serif; flex-shrink: 0; overflow: hidden; }
          .or-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .or-avatar[data-pillar="purple"] { background: var(--or-purple-t); color: var(--or-purple-d); }
          .or-avatar[data-pillar="teal"] { background: var(--or-teal-t); color: var(--or-teal-d); }
          .or-avatar[data-pillar="blue"] { background: var(--or-blue-t); color: var(--or-blue-d); }
          .or-avatar[data-pillar="pink"] { background: var(--or-pink-t); color: var(--or-pink-d); }
          .or-name { font-size: 16px; font-weight: 500; color: #111; margin: 0 0 2px; line-height: 1.3; }
          .or-meta { font-size: 13px; color: var(--or-text-2); display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; }
          .or-meta .dot { color: #d1d5db; }
          .or-rate { font-weight: 500; color: var(--or-purple-d); }

          .or-bio { font-size: 13px; color: var(--or-text-2); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

          .or-spec-row { display: flex; flex-wrap: wrap; gap: 6px; }
          .or-spec { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 10px; border-radius: 100px; font: 500 11px/1 'Inter', sans-serif; }
          .or-spec[data-pillar="blue"] { background: var(--or-blue-t); color: var(--or-blue-d); }
          .or-spec[data-pillar="pink"] { background: var(--or-pink-t); color: var(--or-pink-d); }
          .or-spec[data-pillar="purple"] { background: var(--or-purple-t); color: var(--or-purple-d); }
          .or-spec[data-pillar="teal"] { background: var(--or-teal-t); color: var(--or-teal-d); }
          .or-spec svg { width: 11px; height: 11px; }

          .or-card-actions { display: flex; gap: 8px; margin-top: 4px; }
          .or-card-actions .or-btn { flex: 1; height: 38px; font-size: 13px; }

          /* Empty / loading */
          .or-empty { padding: 48px 24px; text-align: center; color: var(--or-text-2); }
          .or-empty-title { font-size: 18px; font-weight: 500; color: var(--or-purple-d); margin-bottom: 6px; }
          .or-skel { background: #fff; border: 0.5px solid var(--or-border); border-radius: 12px; padding: 16px; height: 180px; }
          .or-skel-pulse { background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%); background-size: 200% 100%; animation: orPulse 1.4s ease-in-out infinite; border-radius: 8px; }
          @keyframes orPulse { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

          @media (max-width: 480px) {
            .or-h1 { font-size: 24px; }
            .or-search { flex-direction: column; align-items: stretch; }
            .or-search-field, .or-search .or-btn { width: 100%; }
          }
        `}</style>

        <div className="or-container">
          <h1 className="or-h1">Find an instructor</h1>
          <p className="or-sub">
            Adapted-vehicle driving instructors with experience teaching disabled learners. Search by area, filter by what you need.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="or-card or-search" role="search" aria-label="Find instructors">
            <div className="or-search-field">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Name, location, or speciality"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search keyword"
              />
            </div>
            <div className="or-search-field or-search-postcode">
              <MapPin size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                aria-label="Postcode"
              />
            </div>
            <button type="submit" className="or-btn or-btn-primary">Search</button>
          </form>

          {/* Filter toggle row */}
          <div className="or-filter-bar">
            <div className="or-result-count" aria-live="polite">
              {loading ? "Searching…" : <><strong>{filtered.length}</strong> instructor{filtered.length === 1 ? "" : "s"} found</>}
            </div>
            <button
              type="button"
              className="or-filter-toggle"
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={14} />
              {filtersOpen ? "Hide filters" : "Filters"}
              {activeFilters.length > 0 && <span style={{ background: "var(--or-purple)", color: "#fff", borderRadius: "100px", padding: "1px 7px", fontSize: 11 }}>{activeFilters.length}</span>}
            </button>
          </div>

          {/* Filters panel */}
          {filtersOpen && (
            <section className="or-card or-filter-panel" aria-label="Filter instructors">
              <div className="or-filter-group">
                <div className="or-filter-label">Adaptations</div>
                <div className="or-chips">
                  {ADAPTATION_FILTERS.map((f) => (
                    <button key={f} type="button" className="or-chip" data-active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>
                      {activeFilters.includes(f) && <Check size={12} />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="or-filter-group">
                <div className="or-filter-label">Communication</div>
                <div className="or-chips">
                  {COMMUNICATION_FILTERS.map((f) => (
                    <button key={f} type="button" className="or-chip" data-active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>
                      {activeFilters.includes(f) && <Check size={12} />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="or-filter-group">
                <div className="or-filter-label">Teaching style</div>
                <div className="or-chips">
                  {TEACHING_FILTERS.map((f) => (
                    <button key={f} type="button" className="or-chip" data-active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>
                      {activeFilters.includes(f) && <Check size={12} />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilters.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <button type="button" className="or-chip or-chip-clear" onClick={() => setActiveFilters([])}>
                    Clear all filters
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Active filters strip (when panel collapsed) */}
          {!filtersOpen && activeFilters.length > 0 && (
            <div className="or-active-strip">
              <span className="or-active-strip-label">Active:</span>
              {activeFilters.map((f) => (
                <span key={f} className="or-active-pill">
                  {f}
                  <button type="button" onClick={() => toggleFilter(f)} aria-label={`Remove ${f}`}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="or-grid" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="or-skel"><div className="or-skel-pulse" style={{ height: "100%" }} /></div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="or-card or-empty">
              <div className="or-empty-title">No matches yet</div>
              <p style={{ margin: 0 }}>Try widening your postcode or removing a filter — we're adding accessible-trained instructors every week.</p>
            </div>
          ) : (
            <div className="or-grid">
              {filtered.map((i) => {
                const pillar = pillarFor(i.name);
                const specs = specsFromInstructor(i);
                const bio = i.accessibility_bio || i.bio;
                const firstName = i.name.split(" ")[0];
                return (
                  <article key={i.id} className="or-card or-instructor-card">
                    <div className="or-card-top">
                      <div className="or-avatar" data-pillar={pillar} aria-hidden="true">
                        {i.profile_image_url ? (
                          <img src={i.profile_image_url} alt="" loading="lazy" />
                        ) : (
                          initials(i.name)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 className="or-name">{i.name}</h2>
                        <div className="or-meta">
                          <span>{i.home_postcode || "UK"}</span>
                          {i.hourly_rate && (
                            <>
                              <span className="dot">·</span>
                              <span className="or-rate">£{i.hourly_rate}/hr</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {bio && <p className="or-bio">{bio}</p>}

                    {specs.length > 0 && (
                      <div className="or-spec-row">
                        {specs.map((s) => (
                          <span key={s.label} className="or-spec" data-pillar={s.pillar}>
                            <Check size={11} aria-hidden="true" />
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="or-card-actions">
                      <Link to={`/accessible/instructors/${i.id}`} className="or-btn or-btn-secondary">
                        View profile
                      </Link>
                      <Link to={`/accessible/instructors/${i.id}?intro=1`} className="or-btn or-btn-primary">
                        Request intro with {firstName}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AccessibleLayout>
  );
}
