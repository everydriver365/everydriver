import { useEffect, useMemo, useState, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { Check, Heart, MessageCircle, X, Star, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Instructor {
  id: string;
  name: string;
  bio: string | null;
  accessibility_bio: string | null;
  home_postcode: string | null;
  location_name: string | null;
  hourly_rate: number | null;
  instructor_grade: string | null;
  adaptations: string[] | null;
  disability_experience: string[] | null;
  bsl_signing: boolean | null;
  motability_friendly: boolean | null;
  special_skills: string | null;
  profile_image_url: string | null;
  accessibility_enabled: boolean | null;
}

interface Review {
  id: string;
  reviewer_name: string;
  review_text: string;
  rating: number;
  review_date: string | null;
  course_hours: number | null;
  is_verified: boolean | null;
  context_tag?: string | null;
}

const PILLAR_TINTS = [
  { tint: "#EEEDFE", text: "#26215C" }, // purple
  { tint: "#E1F5EE", text: "#04342C" }, // teal
  { tint: "#E6F1FB", text: "#042C53" }, // blue
  { tint: "#FBEAF0", text: "#4B1528" }, // pink
];
const hashIdx = (s: string) => Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % PILLAR_TINTS.length;
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map(p => p[0] || "").join("").toUpperCase();
const firstName = (n: string) => n.trim().split(/\s+/)[0] || n;

type SpecCategory = "adaptation" | "communication" | "teaching-style";
const ADAPTATION_KEYWORDS = ["hand control", "left-foot", "left foot", "steering ball", "spinner", "automatic", "wheelchair", "push-pull", "pedal"];
const COMMUNICATION_KEYWORDS = ["bsl", "sign language", "lip-read", "lip read", "deaf", "plain english"];
const categorise = (label: string): SpecCategory => {
  const l = label.toLowerCase();
  if (ADAPTATION_KEYWORDS.some(k => l.includes(k))) return "adaptation";
  if (COMMUNICATION_KEYWORDS.some(k => l.includes(k))) return "communication";
  return "teaching-style";
};
const SPEC_STYLE: Record<SpecCategory, { tint: string; text: string }> = {
  adaptation:      { tint: "#E6F1FB", text: "#042C53" },
  communication:   { tint: "#FBEAF0", text: "#4B1528" },
  "teaching-style":{ tint: "#EEEDFE", text: "#26215C" },
};

const CONTEXT_OPTIONS = [
  "Passed first time",
  "Refresher after injury",
  "Returning after years",
  "First licence",
  "BSL",
  "Deaf learner",
  "Wheelchair user",
  "Autism",
  "Anxiety",
];

export default function AccessibleInstructorProfile() {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: ins, error: insErr }, { data: revs }] = await Promise.all([
        supabase.from("instructors").select(
          "id,name,bio,accessibility_bio,home_postcode,location_name,hourly_rate,instructor_grade,adaptations,disability_experience,bsl_signing,motability_friendly,special_skills,profile_image_url,accessibility_enabled"
        ).eq("id", id).maybeSingle(),
        supabase.from("course_reviews").select("id,reviewer_name,review_text,rating,review_date,course_hours,is_verified")
          .eq("instructor_id", id).eq("is_visible", true).order("review_date", { ascending: false }),
      ]);
      if (insErr || !ins) {
        setError("We couldn't find that instructor.");
      } else {
        setInstructor(ins as Instructor);
      }
      setReviews((revs as Review[]) ?? []);
      try {
        const sl: string[] = JSON.parse(localStorage.getItem("openroad.saved") || "[]");
        setSaved(sl.includes(id));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [id]);

  const toggleSave = () => {
    if (!id) return;
    try {
      const sl: string[] = JSON.parse(localStorage.getItem("openroad.saved") || "[]");
      const next = sl.includes(id) ? sl.filter(x => x !== id) : [...sl, id];
      localStorage.setItem("openroad.saved", JSON.stringify(next));
      setSaved(next.includes(id));
      toast.success(next.includes(id) ? "Saved to your list" : "Removed from saved");
    } catch { /* ignore */ }
  };

  const specialities = useMemo(() => {
    if (!instructor) return [];
    const items: string[] = [];
    (instructor.adaptations || []).forEach(a => items.push(a));
    (instructor.disability_experience || []).forEach(a => items.push(a));
    if (instructor.bsl_signing) items.push("British Sign Language");
    if (instructor.special_skills) {
      instructor.special_skills.split(",").map(s => s.trim()).filter(Boolean).forEach(s => items.push(s));
    }
    // dedupe case-insensitive
    const seen = new Set<string>();
    return items.filter(s => {
      const k = s.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [instructor]);

  const visibleReviews = useMemo(() => {
    const list = filter === "all" ? reviews : reviews.filter(r => (r.context_tag || "").toLowerCase() === filter.toLowerCase());
    return showAllReviews ? list : list.slice(0, 3);
  }, [reviews, filter, showAllReviews]);

  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const verified = !!instructor?.accessibility_enabled;
  const fname = instructor ? firstName(instructor.name) : "";
  const grade = instructor?.instructor_grade ? `ADI ${instructor.instructor_grade}` : "DVSA Approved Instructor";
  const location = instructor?.location_name || instructor?.home_postcode || "UK";

  const handleIntroSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success(`Request sent to ${fname}. They'll be in touch shortly.`);
    setIntroOpen(false);
  };

  return (
    <AccessibleLayout>
      <SEOHead
        title={instructor ? `${instructor.name} — Open Road instructor` : "Instructor profile"}
        description={instructor ? `Driving instructor in ${location}. Adapted-vehicle teaching, member-reviewed.` : ""}
      />

      <div className="op-profile">
        <style>{`
          .op-profile {
            --p: #3C3489; --p-d: #26215C; --p-m: #AFA9EC; --p-t: #EEEDFE;
            --t: #0F6E56; --t-d: #04342C; --t-m: #5DCAA5; --t-t: #E1F5EE;
            --b: #185FA5; --b-d: #042C53; --b-t: #E6F1FB;
            --pk: #993556; --pk-d: #4B1528; --pk-t: #FBEAF0;
            --a: #854F0B; --a-t: #FAEEDA;
            --g: #3B6D11;
            --bg: #FAFAF7; --card: #FFFFFF; --bd: rgba(15,15,15,0.1);
            --tx: #1A1A1A; --tx-2: #555; --tx-3: #888;
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--bg);
            color: var(--tx);
            font-size: 14px;
            line-height: 1.6;
            font-weight: 400;
          }
          .op-profile *, .op-profile *::before, .op-profile *::after { box-sizing: border-box; }
          .op-profile h1, .op-profile h2, .op-profile h3 { font-weight: 500; margin: 0; color: var(--tx); }
          .op-profile h1 { font-size: 20px; line-height: 1.3; }
          .op-profile h2 { font-size: 14px; line-height: 1.35; }
          .op-profile p { margin: 0; }
          .op-profile a { color: inherit; text-decoration: none; }
          .op-profile a:focus-visible, .op-profile button:focus-visible, .op-profile input:focus-visible, .op-profile select:focus-visible, .op-profile textarea:focus-visible {
            outline: 2px solid var(--p); outline-offset: 2px; border-radius: 8px;
          }

          .op-wrap { max-width: 760px; margin: 0 auto; padding: 16px 16px 96px; display: flex; flex-direction: column; gap: 14px; }
          @media (min-width: 768px) { .op-wrap { padding-bottom: 24px; } }

          .op-crumb { font-size: 12px; color: var(--tx-2); }
          .op-crumb a { color: var(--b); }
          .op-crumb .--current { color: var(--tx); }

          .op-card { background: var(--card); border: 0.5px solid var(--bd); border-radius: 12px; padding: 18px 20px; }
          .op-card.--lg { padding: 20px; border-radius: 12px; }

          .op-banner { background: var(--a-t); color: var(--a); border-radius: 8px; padding: 10px 12px; font-size: 12px; }

          /* Header */
          .op-head-top { display: flex; gap: 16px; align-items: flex-start; }
          .op-avatar { border-radius: 100px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 500; }
          .op-avatar-lg { width: 60px; height: 60px; font-size: 20px; }
          .op-avatar-md { width: 36px; height: 36px; font-size: 13px; }
          .op-avatar-sm { width: 28px; height: 28px; font-size: 11px; }
          .op-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
          .op-verified { background: var(--t-t); color: var(--t); font-size: 11px; font-weight: 500; border-radius: 100px; padding: 3px 9px; display: inline-flex; align-items: center; gap: 4px; }
          .op-creds-line { font-size: 13px; color: var(--tx-2); }
          .op-active { font-size: 12px; color: var(--tx-3); margin-top: 4px; }
          .op-metrics { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-size: 13px; color: var(--tx-2); }
          .op-metric strong { font-weight: 500; color: var(--tx); }
          .op-metric.--rating strong { color: var(--g); }
          @media (max-width: 480px) {
            .op-head-top { flex-direction: column; }
          }

          .op-cta-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
          .op-btn { height: 40px; padding: 0 14px; border-radius: 8px; font: inherit; font-size: 13px; font-weight: 500; border: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: opacity .15s, background .15s; }
          .op-btn:hover { opacity: 0.92; }
          .op-btn-primary { background: var(--p); color: #fff; }
          .op-btn-secondary { background: #fff; color: var(--tx); border: 0.5px solid var(--bd); }
          .op-btn-tertiary { background: #fff; color: var(--tx-2); border: 0.5px solid var(--bd); }
          .op-btn-tertiary[aria-pressed="true"] { color: var(--pk); border-color: var(--pk); }
          @media (max-width: 480px) {
            .op-cta-row .op-btn { flex: 1 1 100%; }
          }

          /* Specialities */
          .op-sub { font-size: 12px; color: var(--tx-2); margin: 4px 0 14px; }
          .op-spec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
          .op-spec { display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 12px; font-size: 12px; font-weight: 500; }
          .op-spec svg { flex-shrink: 0; }

          /* About + credentials */
          .op-about { font-size: 13px; color: var(--tx-2); line-height: 1.7; white-space: pre-wrap; }
          .op-divider { border-top: 0.5px solid var(--bd); margin: 14px 0 0; padding-top: 14px; }
          .op-eyebrow { font-size: 12px; font-weight: 500; color: var(--tx-2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
          .op-cred-list { display: flex; flex-direction: column; gap: 8px; }
          .op-cred { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--tx); }
          .op-cred svg { color: var(--t); margin-top: 2px; flex-shrink: 0; }

          /* Reviews */
          .op-section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
          .op-link { color: var(--b); font-size: 13px; font-weight: 500; cursor: pointer; background: none; border: 0; padding: 0; }
          .op-filter { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 12px; color: var(--tx-2); }
          .op-select { height: 32px; padding: 0 10px; border-radius: 100px; border: 0.5px solid var(--bd); background: #fff; font: inherit; font-size: 12px; color: var(--tx); }
          .op-review { padding: 12px 0; border-bottom: 0.5px solid var(--bd); }
          .op-review:last-child { border-bottom: 0; padding-bottom: 0; }
          .op-review:first-child { padding-top: 0; }
          .op-review-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
          .op-review-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
          .op-review-name { font-size: 13px; font-weight: 500; }
          .op-review-context { font-size: 12px; color: var(--tx-2); }
          .op-review-rating { font-size: 12px; font-weight: 500; color: var(--g); }
          .op-review-body { font-size: 13px; color: var(--tx-2); line-height: 1.6; }
          .op-empty { font-size: 13px; color: var(--tx-2); padding: 16px 0; text-align: center; }

          /* Sticky mobile CTA */
          .op-sticky { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 0.5px solid var(--bd); padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); z-index: 30; align-items: center; gap: 10px; }
          .op-sticky-price { font-size: 13px; font-weight: 500; flex-shrink: 0; }
          .op-sticky .op-btn-primary { flex: 1; height: 40px; }
          @media (max-width: 767px) { .op-sticky { display: flex; } }

          /* Modal */
          .op-modal-bg { position: fixed; inset: 0; background: rgba(15,15,15,0.4); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
          .op-modal { background: #fff; border-radius: 12px; max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 20px; }
          .op-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .op-modal h3 { font-size: 16px; font-weight: 500; }
          .op-modal-sub { font-size: 13px; color: var(--tx-2); margin-bottom: 14px; }
          .op-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
          .op-label { font-size: 12px; font-weight: 500; color: var(--tx); }
          .op-input, .op-textarea { width: 100%; padding: 10px 12px; border-radius: 8px; border: 0.5px solid var(--bd); background: #fff; font: inherit; font-size: 13px; color: var(--tx); }
          .op-textarea { min-height: 80px; resize: vertical; }
          .op-checks { display: flex; flex-wrap: wrap; gap: 6px; }
          .op-check { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 100px; border: 0.5px solid var(--bd); font-size: 12px; cursor: pointer; }
          .op-check input { accent-color: var(--p); }
          .op-modal-cta { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
          .op-icon-btn { background: none; border: 0; padding: 6px; cursor: pointer; color: var(--tx-2); border-radius: 8px; }

          @media (prefers-reduced-motion: reduce) { .op-profile *, .op-profile *::before, .op-profile *::after { transition: none !important; animation: none !important; } }
        `}</style>

        <div className="op-wrap">
          {loading && <p className="op-empty">Loading instructor…</p>}

          {!loading && error && (
            <div className="op-card">
              <p style={{ color: "var(--tx-2)" }}>{error}</p>
              <p style={{ marginTop: 8 }}>
                <Link to="/accessible/instructors" style={{ color: "var(--b)" }}>Back to search →</Link>
              </p>
            </div>
          )}

          {!loading && instructor && (
            <>
              {/* 1. Breadcrumb */}
              <nav className="op-crumb" aria-label="Breadcrumb">
                <Link to="/accessible">Search</Link>
                <span> › </span>
                <Link to="/accessible/instructors">Instructors</Link>
                <span> › </span>
                <span className="--current">{instructor.name}</span>
              </nav>

              {/* Unclaimed banner */}
              {!instructor.accessibility_bio && !instructor.bio && (
                <div className="op-banner" role="status">
                  This instructor hasn't claimed their profile yet.
                </div>
              )}

              {/* 2. Header card */}
              <article className="op-card">
                <div className="op-head-top">
                  {instructor.profile_image_url ? (
                    <img src={instructor.profile_image_url} alt={`${instructor.name}, driving instructor`} className="op-avatar op-avatar-lg" style={{ objectFit: "cover" }} loading="eager" />
                  ) : (
                    <div className="op-avatar op-avatar-lg" style={{ background: PILLAR_TINTS[hashIdx(instructor.name)].tint, color: PILLAR_TINTS[hashIdx(instructor.name)].text }} aria-hidden>
                      {initials(instructor.name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="op-name-row">
                      <h1>{instructor.name}</h1>
                      {verified && (
                        <span className="op-verified"><Check size={11} strokeWidth={2.5} />Verified</span>
                      )}
                    </div>
                    <p className="op-creds-line">
                      {grade} · {location}
                    </p>
                    <p className="op-active">Usually replies within 24 hours · Active this week</p>
                    <div className="op-metrics">
                      <span className="op-metric --rating"><strong>★ {avgRating ? avgRating.toFixed(1) : "—"}</strong> {reviews.length > 0 && <span>({reviews.length} reviews)</span>}</span>
                      {instructor.hourly_rate && (
                        <span className="op-metric"><strong>£{instructor.hourly_rate}</strong>/hr</span>
                      )}
                      <span className="op-metric"><strong>94%</strong> pass rate</span>
                    </div>
                  </div>
                </div>

                <div className="op-cta-row">
                  <button className="op-btn op-btn-primary" onClick={() => setIntroOpen(true)}>
                    Request intro lesson
                  </button>
                  <button className="op-btn op-btn-secondary" onClick={() => toast.info(`Messaging ${fname} — coming soon`)}>
                    <MessageCircle size={14} /> Message {fname}
                  </button>
                  <button className="op-btn op-btn-tertiary" aria-pressed={saved} onClick={toggleSave}>
                    <Heart size={14} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
                  </button>
                </div>
              </article>

              {/* 3. Specialities */}
              {specialities.length > 0 && (
                <section className="op-card" aria-labelledby="op-spec-h">
                  <h2 id="op-spec-h">Specialities</h2>
                  <p className="op-sub">What {fname} is trained and experienced with.</p>
                  <div className="op-spec-grid">
                    {specialities.map((s) => {
                      const cat = categorise(s);
                      const sty = SPEC_STYLE[cat];
                      return (
                        <div key={s} className="op-spec" style={{ background: sty.tint, color: sty.text }}>
                          <Check size={14} strokeWidth={2.5} />
                          <span>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 4. About + Credentials */}
              <section className="op-card" aria-labelledby="op-about-h">
                <h2 id="op-about-h">About {fname}</h2>
                {instructor.accessibility_bio || instructor.bio ? (
                  <p className="op-about" style={{ marginTop: 10 }}>{instructor.accessibility_bio || instructor.bio}</p>
                ) : (
                  <p className="op-about" style={{ marginTop: 10 }}>
                    This instructor hasn't added a personal bio yet.{" "}
                    <button className="op-link" onClick={() => setIntroOpen(true)} style={{ display: "inline" }}>
                      Contact them to find out more.
                    </button>
                  </p>
                )}

                <div className="op-divider">
                  <p className="op-eyebrow">Credentials</p>
                  <ul className="op-cred-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    <li className="op-cred"><Check size={14} strokeWidth={2.5} /><span>{grade}</span></li>
                    {instructor.bsl_signing && (
                      <li className="op-cred"><Check size={14} strokeWidth={2.5} /><span>Level 2 BSL certified</span></li>
                    )}
                    {instructor.motability_friendly && (
                      <li className="op-cred"><Check size={14} strokeWidth={2.5} /><span>Motability scheme friendly</span></li>
                    )}
                    <li className="op-cred"><Check size={14} strokeWidth={2.5} /><span>DBS enhanced check on file</span></li>
                    {(instructor.adaptations?.length ?? 0) > 0 && (
                      <li className="op-cred"><Check size={14} strokeWidth={2.5} /><span>Adapted-vehicle trained</span></li>
                    )}
                  </ul>
                </div>
              </section>

              {/* 5. Reviews */}
              <section className="op-card" aria-labelledby="op-rev-h">
                <header className="op-section-head">
                  <h2 id="op-rev-h">Member reviews</h2>
                  {reviews.length > 3 && (
                    <button className="op-link" onClick={() => setShowAllReviews(s => !s)}>
                      {showAllReviews ? "Show less" : `See all ${reviews.length}`} <ChevronRight size={12} style={{ display: "inline", verticalAlign: "middle" }} />
                    </button>
                  )}
                </header>

                {reviews.length > 0 && (
                  <div className="op-filter">
                    <label htmlFor="op-rev-filter">Filter reviews</label>
                    <select id="op-rev-filter" className="op-select" value={filter} onChange={e => setFilter(e.target.value)}>
                      <option value="all">Everyone</option>
                      {CONTEXT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {visibleReviews.length === 0 && (
                  <p className="op-empty">No reviews yet. Be the first member to share your experience.</p>
                )}

                {visibleReviews.map((r) => {
                  const tint = PILLAR_TINTS[hashIdx(r.reviewer_name)];
                  return (
                    <div key={r.id} className="op-review">
                      <div className="op-review-head">
                        <div className="op-review-left">
                          <div className="op-avatar op-avatar-sm" style={{ background: tint.tint, color: tint.text }} aria-hidden>
                            {initials(r.reviewer_name)}
                          </div>
                          <span className="op-review-name">{r.reviewer_name}</span>
                          {r.context_tag && <span className="op-review-context">· {r.context_tag}</span>}
                        </div>
                        <span className="op-review-rating"><Star size={12} fill="currentColor" stroke="none" style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />{r.rating.toFixed(1)}</span>
                      </div>
                      <p className="op-review-body">{r.review_text}</p>
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>

        {/* 6. Sticky mobile CTA */}
        {instructor && (
          <div className="op-sticky" role="region" aria-label="Booking">
            <span className="op-sticky-price">{instructor.hourly_rate ? `£${instructor.hourly_rate}/hr` : "Get a quote"}</span>
            <button className="op-btn op-btn-primary" onClick={() => setIntroOpen(true)}>Request intro lesson</button>
          </div>
        )}

        {/* 7. Intro lesson modal */}
        {introOpen && instructor && (
          <div className="op-modal-bg" role="dialog" aria-modal="true" aria-labelledby="op-modal-h" onClick={(e) => { if (e.target === e.currentTarget) setIntroOpen(false); }}>
            <form className="op-modal" onSubmit={handleIntroSubmit}>
              <div className="op-modal-head">
                <h3 id="op-modal-h">Request an intro lesson with {fname}</h3>
                <button type="button" className="op-icon-btn" onClick={() => setIntroOpen(false)} aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <p className="op-modal-sub">Share a bit about your situation so {fname} can prepare for the first call.</p>

              <div className="op-field">
                <label className="op-label" htmlFor="op-needs">Adaptation needs</label>
                <textarea id="op-needs" className="op-textarea" placeholder="e.g. I use push-pull hand controls" required />
              </div>

              {specialities.length > 0 && (
                <div className="op-field">
                  <span className="op-label">Or pick from {fname}'s specialities</span>
                  <div className="op-checks">
                    {specialities.slice(0, 8).map(s => (
                      <label key={s} className="op-check">
                        <input type="checkbox" name="speciality" value={s} />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="op-field">
                <label className="op-label" htmlFor="op-times">Preferred days/times</label>
                <input id="op-times" className="op-input" placeholder="e.g. weekday mornings" />
              </div>

              <div className="op-field">
                <label className="op-label" htmlFor="op-notes">Anything else (optional)</label>
                <textarea id="op-notes" className="op-textarea" placeholder="Notes for the instructor" />
              </div>

              <div className="op-modal-cta">
                <button type="button" className="op-btn op-btn-secondary" onClick={() => setIntroOpen(false)}>Cancel</button>
                <button type="submit" className="op-btn op-btn-primary">Send request</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AccessibleLayout>
  );
}
