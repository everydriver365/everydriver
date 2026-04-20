import { useEffect, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import {
  Search, Accessibility, MessageSquare, Car, Wrench, Heart,
  ArrowRight, Star, Trophy, FileText, Users, Info,
} from "lucide-react";

// ---- Types ----
interface FeaturedInstructor {
  id: string;
  name: string;
  location_name: string | null;
  home_postcode: string | null;
  special_skills: string | string[] | null;
}
interface ForumTopic {
  id: string;
  title: string;
  category: string;
  author_name: string;
  reply_count: number;
  created_at: string;
}

// ---- Helpers ----
const PILLAR = ["purple", "teal", "blue", "amber", "pink", "green"] as const;
const hashColor = (s: string) => PILLAR[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % PILLAR.length];
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();

const CATEGORY_COLOUR: Record<string, string> = {
  adaptations: "blue",
  wins: "green",
  "dvla-licensing": "purple",
  motability: "pink",
  insurance: "teal",
  "learning-to-drive": "amber",
  general: "purple",
};
const CATEGORY_LABEL: Record<string, string> = {
  adaptations: "Adaptations",
  wins: "Wins",
  "dvla-licensing": "DVLA & licensing",
  motability: "Motability",
  insurance: "Insurance",
  "learning-to-drive": "Learning to drive",
  general: "General",
};

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function AccessibleHome() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<FeaturedInstructor[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [q, setQ] = useState("");
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: ins }, { data: tps }] = await Promise.all([
        supabase
          .from("public_instructors")
          .select("id, name, location_name, home_postcode, special_skills")
          .eq("is_active", true)
          .limit(3),
        supabase
          .from("accessible_forum_topics")
          .select("id, title, category, author_name, reply_count, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      setInstructors(ins ?? []);
      setTopics(tps ?? []);
    })();
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (postcode) params.set("postcode", postcode);
    navigate(`/accessible/instructors?${params.toString()}`);
  };

  return (
    <AccessibleLayout>
      <SEOHead
        title="Open Road — Driving, on your terms"
        description="A community by drivers, for drivers. Connect with disabled drivers, find adapted-vehicle instructors, trusted garages and services that understand what you need."
      />

      <div className="open-road">
        <style>{`
          .open-road {
            --or-purple: #3C3489; --or-purple-dark: #26215C; --or-purple-mid: #AFA9EC; --or-purple-light: #CECBF6; --or-purple-tint: #EEEDFE;
            --or-teal: #0F6E56; --or-teal-dark: #04342C; --or-teal-mid: #5DCAA5; --or-teal-light: #9FE1CB; --or-teal-tint: #E1F5EE;
            --or-blue: #185FA5; --or-blue-dark: #042C53; --or-blue-light: #B5D4F4; --or-blue-tint: #E6F1FB;
            --or-amber: #854F0B; --or-amber-dark: #412402; --or-amber-mid: #BA7517; --or-amber-tint: #FAEEDA;
            --or-pink: #993556; --or-pink-dark: #4B1528; --or-pink-tint: #FBEAF0;
            --or-green: #3B6D11; --or-green-mid: #639922; --or-green-tint: #EAF3DE;
            --or-coral: #D85A30;
            --or-bg: #FAFAF7; --or-card: #FFFFFF; --or-border: rgba(15,15,15,0.1);
            --or-text: #1A1A1A; --or-text-2: #555; --or-text-3: #888;
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--or-bg);
            color: var(--or-text);
            font-size: 15px;
            line-height: 1.6;
            font-weight: 400;
          }
          .open-road *, .open-road *::before, .open-road *::after { box-sizing: border-box; }
          .open-road h1, .open-road h2, .open-road h3 { font-weight: 500; margin: 0; color: var(--or-text); }
          .open-road h1 { font-size: 30px; line-height: 1.25; }
          .open-road h2 { font-size: 22px; line-height: 1.3; }
          .open-road h3 { font-size: 18px; line-height: 1.35; }
          .open-road p { margin: 0; }
          .open-road a { color: inherit; text-decoration: none; }
          .open-road a:focus-visible, .open-road button:focus-visible, .open-road input:focus-visible {
            outline: 2px solid var(--or-purple); outline-offset: 2px; border-radius: 8px;
          }

          .or-wrap { max-width: 1080px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 24px; }
          .or-card { background: var(--or-card); border: 0.5px solid var(--or-border); border-radius: 12px; }

          /* Hero */
          .or-hero { background: var(--or-purple-tint); border-radius: 12px; padding: 2.5rem 2rem; }
          .or-badge { display: inline-block; background: #fff; color: var(--or-purple); font-size: 12px; font-weight: 500; border-radius: 8px; padding: 4px 12px; margin-bottom: 14px; }
          .or-hero h1 { color: var(--or-purple-dark); max-width: 540px; margin-bottom: 10px; }
          .or-hero-sub { color: var(--or-purple); font-size: 16px; max-width: 520px; margin-bottom: 20px; }
          .or-search { background: #fff; border-radius: 12px; padding: 10px; max-width: 560px; display: flex; gap: 8px; flex-wrap: wrap; }
          .or-input-pill { background: #F1F1ED; border: 0; border-radius: 8px; padding: 0 12px; height: 40px; font: inherit; color: var(--or-text); display: flex; align-items: center; gap: 8px; }
          .or-input-pill input { background: transparent; border: 0; outline: none; flex: 1; font: inherit; min-width: 0; }
          .or-input-pill.--main { flex: 2; min-width: 160px; }
          .or-input-pill.--postcode { flex: 1; min-width: 100px; }
          .or-input-pill svg { color: var(--or-text-3); flex-shrink: 0; }
          .or-btn { height: 40px; padding: 0 16px; border-radius: 8px; font: inherit; font-weight: 500; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: opacity .15s; }
          .or-btn:hover { opacity: 0.9; }
          .or-btn-purple { background: var(--or-purple); color: #fff; }
          .or-btn-teal { background: var(--or-teal); color: #fff; }
          .or-btn-outline-teal { background: #fff; color: var(--or-teal); border: 0.5px solid var(--or-teal-mid); }
          .or-btn-outline-purple { background: #fff; color: var(--or-purple); border: 0.5px solid var(--or-purple-mid); }
          .or-trust { margin-top: 14px; font-size: 13px; color: var(--or-purple); }

          /* Pillars */
          .or-pillars { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
          .or-pillar { padding: 18px; display: block; transition: border-color .15s; }
          .or-pillar:hover { border-color: var(--or-purple-mid); }
          .or-icon-tile { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
          .or-pillar h3 { font-size: 14px; margin-bottom: 4px; }
          .or-pillar p { font-size: 13px; color: var(--or-text-2); line-height: 1.5; }

          /* Tracker */
          .or-tracker { background: var(--or-teal-tint); border-radius: 12px; padding: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; align-items: center; }
          .or-tracker h2 { color: var(--or-teal-dark); }
          .or-tracker-sub { color: var(--or-teal); font-size: 14px; margin: 8px 0 16px; }
          .or-tracker-ctas { display: flex; gap: 8px; flex-wrap: wrap; }
          .or-score-card { background: #fff; border-radius: 12px; padding: 18px; }
          .or-score-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
          .or-score-label { font-size: 11px; color: var(--or-teal); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 500; }
          .or-score-status { font-size: 14px; font-weight: 500; color: var(--or-teal-dark); margin-top: 2px; }
          .or-metric { display: flex; align-items: center; gap: 10px; font-size: 12px; margin-bottom: 8px; }
          .or-metric:last-child { margin-bottom: 0; }
          .or-metric-name { width: 70px; color: var(--or-text-2); }
          .or-bar { flex: 1; height: 4px; background: #EEE; border-radius: 100px; overflow: hidden; }
          .or-bar-fill { height: 100%; border-radius: 100px; }
          .or-metric-val { width: 26px; text-align: right; font-weight: 500; color: var(--or-text); }

          /* Section header */
          .or-section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
          .or-section-title { font-size: 16px; font-weight: 500; }
          .or-section-sub { font-size: 12px; color: var(--or-text-2); margin-top: 2px; }
          .or-section-link { font-size: 13px; color: var(--or-blue); font-weight: 500; }

          /* Instructors */
          .or-instructors-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
          .or-ins-card { background: #F4F4F0; border-radius: 8px; padding: 14px; display: block; transition: background .15s; }
          .or-ins-card:hover { background: #EDEDE7; }
          .or-ins-top { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
          .or-avatar { width: 36px; height: 36px; border-radius: 100px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; flex-shrink: 0; }
          .or-ins-name { font-size: 13px; font-weight: 500; }
          .or-ins-meta { font-size: 11px; color: var(--or-text-2); margin-top: 1px; }
          .or-chips { display: flex; flex-wrap: wrap; gap: 4px; }
          .or-chip { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 100px; }

          /* Forum */
          .or-thread { display: flex; gap: 12px; padding: 12px 0; border-bottom: 0.5px solid var(--or-border); }
          .or-thread:last-child { border-bottom: 0; padding-bottom: 0; }
          .or-thread:first-child { padding-top: 0; }
          .or-thread-body { flex: 1; min-width: 0; }
          .or-thread-title { font-size: 14px; font-weight: 500; margin: 6px 0 2px; }
          .or-thread-meta { font-size: 12px; color: var(--or-text-2); }

          /* Resources */
          .or-resource-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
          .or-resource { padding: 12px; border-radius: 8px; display: block; transition: opacity .15s; }
          .or-resource:hover { opacity: 0.85; }
          .or-resource-name { font-size: 13px; font-weight: 500; }
          .or-resource-count { font-size: 11px; margin-top: 2px; opacity: 0.8; }

          /* Testimonial */
          .or-test { background: var(--or-purple-tint); border-radius: 12px; padding: 2rem; }
          .or-test-inner { max-width: 540px; }
          .or-eyebrow { color: var(--or-purple); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; }
          .or-quote { font-family: 'Source Serif 4', 'Source Serif Pro', Georgia, serif; font-size: 18px; font-weight: 500; color: var(--or-purple-dark); line-height: 1.4; margin-bottom: 16px; }
          .or-attr { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
          .or-attr-name { font-size: 13px; font-weight: 500; color: var(--or-purple-dark); }
          .or-attr-meta { font-size: 11px; color: var(--or-purple); }
          .or-test h3 { color: var(--or-purple-dark); margin-bottom: 6px; }
          .or-test p.--lead { color: var(--or-purple); font-size: 13px; margin-bottom: 16px; }

          /* Footer */
          .or-footer { padding: 20px; }
          .or-footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 20px; }
          .or-footer-eyebrow { font-size: 12px; font-weight: 500; color: var(--or-text-2); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
          .or-footer-link { font-size: 13px; display: block; padding: 4px 0; color: var(--or-text); }
          .or-footer-link:hover { color: var(--or-purple); }
          .or-footer-bottom { border-top: 0.5px solid var(--or-border); margin-top: 16px; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
          .or-footer-brand { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--or-text-2); }

          /* Pillar tints / colours map */
          .pt-purple { background: var(--or-purple-tint); color: var(--or-purple); }
          .pt-teal   { background: var(--or-teal-tint);   color: var(--or-teal); }
          .pt-blue   { background: var(--or-blue-tint);   color: var(--or-blue); }
          .pt-amber  { background: var(--or-amber-tint);  color: var(--or-amber); }
          .pt-pink   { background: var(--or-pink-tint);   color: var(--or-pink); }
          .pt-green  { background: var(--or-green-tint);  color: var(--or-green); }

          .pt-purple-dark { background: var(--or-purple-tint); color: var(--or-purple-dark); }
          .pt-teal-dark   { background: var(--or-teal-tint);   color: var(--or-teal-dark); }
          .pt-blue-dark   { background: var(--or-blue-tint);   color: var(--or-blue-dark); }
          .pt-amber-dark  { background: var(--or-amber-tint);  color: var(--or-amber-dark); }
          .pt-pink-dark   { background: var(--or-pink-tint);   color: var(--or-pink-dark); }
          .pt-green-dark  { background: var(--or-green-tint);  color: var(--or-green); }

          @media (max-width: 620px) {
            .or-hero { padding: 1.5rem 1.25rem; }
            .or-tracker { padding: 1.5rem; }
            .or-test { padding: 1.5rem; }
          }

          @media (prefers-reduced-motion: reduce) {
            .open-road *, .open-road *::before, .open-road *::after { transition: none !important; animation: none !important; }
          }
        `}</style>

        <div className="or-wrap">
          {/* 2. Hero */}
          <section className="or-hero" aria-labelledby="or-h1">
            <span className="or-badge">A community by drivers, for drivers</span>
            <h1 id="or-h1">Driving, on your terms.</h1>
            <p className="or-hero-sub">
              Connect with other disabled drivers, find adapted-vehicle instructors, trusted garages, and services that
              actually understand what you need.
            </p>
            <form className="or-search" onSubmit={onSearch} role="search" aria-label="Find instructors, garages or services">
              <label className="or-input-pill --main">
                <Search size={16} />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Instructor, garage, or service…"
                  aria-label="Search"
                />
              </label>
              <label className="or-input-pill --postcode">
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="Postcode"
                  aria-label="Postcode"
                />
              </label>
              <button type="submit" className="or-btn or-btn-purple">Search</button>
            </form>
            <p className="or-trust">★ 4.9 on Trustpilot · 12,400+ members · Free to join</p>
          </section>

          {/* 3. Pillars */}
          <section className="or-pillars" aria-label="What you'll find">
            <Link to="/accessible/forum" className="or-card or-pillar">
              <div className="or-icon-tile pt-teal"><MessageSquare size={18} /></div>
              <h3>Community</h3>
              <p>Share tips, stories, and advice</p>
            </Link>
            <Link to="/accessible/instructors" className="or-card or-pillar">
              <div className="or-icon-tile pt-blue"><Car size={18} /></div>
              <h3>Instructors</h3>
              <p>Find trained adapted-vehicle teachers</p>
            </Link>
            <Link to="/accessible/garages" className="or-card or-pillar">
              <div className="or-icon-tile pt-amber"><Wrench size={18} /></div>
              <h3>Garages</h3>
              <p>Trusted for hand controls and more</p>
            </Link>
            <Link to="/accessible/services" className="or-card or-pillar">
              <div className="or-icon-tile pt-pink"><Heart size={18} /></div>
              <h3>Services</h3>
              <p>Insurance, Motability, breakdown</p>
            </Link>
          </section>

          {/* 4. Tracker */}
          <section className="or-tracker" aria-labelledby="or-tracker-h">
            <div>
              <span className="or-badge" style={{ color: "var(--or-teal)" }}>Members-only feature</span>
              <h2 id="or-tracker-h">Prove you're a great driver. With data, not words.</h2>
              <p className="or-tracker-sub">
                Our in-car tracker measures location and driving behaviour far more accurately than any phone app —
                giving you the evidence you need for insurers, DVLA reviews, and peace of mind.
              </p>
              <div className="or-tracker-ctas">
                <Link to="/accessible/trackers" className="or-btn or-btn-teal">Learn about the tracker</Link>
                <Link to="/accessible/trackers#sample" className="or-btn or-btn-outline-teal">See a sample report</Link>
              </div>
            </div>
            <div className="or-score-card" aria-label="Sample driving score">
              <div className="or-score-top">
                <ScoreRing value={92} />
                <div>
                  <div className="or-score-label">Your driving score</div>
                  <div className="or-score-status">Excellent this month</div>
                </div>
              </div>
              <Metric name="Speed" value={96} colour="var(--or-green-mid)" />
              <Metric name="Cornering" value={95} colour="var(--or-green-mid)" />
              <Metric name="Braking" value={84} colour="var(--or-amber-mid)" />
            </div>
          </section>

          {/* 5. Featured instructors */}
          <section className="or-card" style={{ padding: 20 }} aria-labelledby="or-ins-h">
            <header className="or-section-head">
              <div>
                <h3 id="or-ins-h" className="or-section-title">Top-rated instructors near you</h3>
                <div className="or-section-sub">Verified by the Open Road team · Reviewed by members</div>
              </div>
              <Link to="/accessible/instructors" className="or-section-link">See all →</Link>
            </header>
            <div className="or-instructors-grid">
              {instructors.length === 0 && (
                <p style={{ color: "var(--or-text-2)", fontSize: 13 }}>Loading instructors…</p>
              )}
              {instructors.map((ins) => {
                const c = hashColor(ins.id);
                const skillsRaw = ins.special_skills;
                const skills = (Array.isArray(skillsRaw)
                  ? skillsRaw
                  : typeof skillsRaw === "string" ? skillsRaw.split(",").map(s => s.trim()).filter(Boolean) : []
                ).slice(0, 3);
                return (
                  <Link key={ins.id} to={`/accessible/instructors/${ins.id}`} className="or-ins-card">
                    <div className="or-ins-top">
                      <div className={`or-avatar pt-${c}`}>{initials(ins.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="or-ins-name">{ins.name}</div>
                        <div className="or-ins-meta">
                          {(ins.location_name || ins.home_postcode || "UK")} · <Star size={10} style={{ display: "inline", marginRight: 2 }} />4.8
                        </div>
                      </div>
                    </div>
                    <div className="or-chips">
                      {skills.length > 0 ? skills.map((s, i) => {
                        const cc = PILLAR[i % PILLAR.length];
                        return <span key={s} className={`or-chip pt-${cc}`}>{s}</span>;
                      }) : (
                        <>
                          <span className="or-chip pt-blue">Hand controls</span>
                          <span className="or-chip pt-purple">Patient</span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 6. Community preview */}
          <section className="or-card" style={{ padding: 20 }} aria-labelledby="or-com-h">
            <header className="or-section-head">
              <div>
                <h3 id="or-com-h" className="or-section-title">Latest from the community</h3>
                <div className="or-section-sub">Real advice from drivers who get it</div>
              </div>
              <Link to="/accessible/forum" className="or-section-link">Open forum →</Link>
            </header>
            <div>
              {topics.length === 0 && (
                <p style={{ color: "var(--or-text-2)", fontSize: 13 }}>No posts yet — be the first.</p>
              )}
              {topics.map((t) => {
                const cat = CATEGORY_COLOUR[t.category] ?? "purple";
                const label = CATEGORY_LABEL[t.category] ?? t.category;
                const c = hashColor(t.author_name);
                return (
                  <Link key={t.id} to={`/accessible/forum/${t.id}`} className="or-thread">
                    <div className={`or-avatar pt-${c}`} aria-hidden>{initials(t.author_name)}</div>
                    <div className="or-thread-body">
                      <span className={`or-chip pt-${cat}`}>{label}</span>
                      <div className="or-thread-title">{t.title}</div>
                      <div className="or-thread-meta">
                        {t.author_name} · {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"} · {timeAgo(t.created_at)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 7. Resources */}
          <section className="or-card" style={{ padding: 20 }} aria-labelledby="or-res-h">
            <header className="or-section-head">
              <div>
                <h3 id="or-res-h" className="or-section-title">Plain-English resources</h3>
                <div className="or-section-sub">Reviewed by qualified assessors and OTs</div>
              </div>
              <Link to="/accessible/resources" className="or-section-link">All guides →</Link>
            </header>
            <div className="or-resource-grid">
              <Link to="/accessible/resources?cat=licensing" className="or-resource pt-purple-dark">
                <div className="or-resource-name">Licensing & DVLA</div>
                <div className="or-resource-count">12 guides</div>
              </Link>
              <Link to="/accessible/resources?cat=adaptations" className="or-resource pt-blue-dark">
                <div className="or-resource-name">Adaptations A–Z</div>
                <div className="or-resource-count">24 guides</div>
              </Link>
              <Link to="/accessible/resources?cat=motability" className="or-resource pt-amber-dark">
                <div className="or-resource-name">Motability & funding</div>
                <div className="or-resource-count">9 guides</div>
              </Link>
              <Link to="/accessible/resources?cat=learning" className="or-resource pt-pink-dark">
                <div className="or-resource-name">Learning to drive</div>
                <div className="or-resource-count">14 guides</div>
              </Link>
            </div>
          </section>

          {/* 8. Testimonial + CTA */}
          <section className="or-test" aria-labelledby="or-join-h">
            <div className="or-test-inner">
              <div className="or-eyebrow">From the community</div>
              <p className="or-quote">
                "Three years of false starts with other instructors. Open Road matched me with Jenna and I passed last month. This place gets it."
              </p>
              <div className="or-attr">
                <div className="or-avatar pt-amber">MT</div>
                <div>
                  <div className="or-attr-name">Marcus T.</div>
                  <div className="or-attr-meta">Member since 2024</div>
                </div>
              </div>
              <h3 id="or-join-h">Join a community that's on your side.</h3>
              <p className="--lead">Free to join. No pity, no jargon, no strings — just real drivers helping each other.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link to="/pupil/signup" className="or-btn or-btn-purple">Create free account</Link>
                <Link to="/accessible/forum" className="or-btn or-btn-outline-purple">Browse as guest</Link>
              </div>
            </div>
          </section>

          {/* 9. Footer */}
          <footer className="or-card or-footer" aria-label="Footer">
            <div className="or-footer-grid">
              <div>
                <div className="or-footer-eyebrow">Explore</div>
                <Link to="/accessible/forum" className="or-footer-link">Community</Link>
                <Link to="/accessible/instructors" className="or-footer-link">Instructors</Link>
                <Link to="/accessible/garages" className="or-footer-link">Garages</Link>
                <Link to="/accessible/resources" className="or-footer-link">Resources</Link>
              </div>
              <div>
                <div className="or-footer-eyebrow">Features</div>
                <Link to="/accessible/trackers" className="or-footer-link">Vehicle tracker</Link>
                <Link to="/accessible/trackers#score" className="or-footer-link">Driving score</Link>
                <Link to="/pupil" className="or-footer-link">Member dashboard</Link>
              </div>
              <div>
                <div className="or-footer-eyebrow">Accessibility</div>
                <Link to="/accessible/settings" className="or-footer-link">Text size</Link>
                <Link to="/accessible/settings" className="or-footer-link">Dyslexia-friendly font</Link>
                <Link to="/accessible/settings" className="or-footer-link">High contrast</Link>
                <Link to="/accessible/statement" className="or-footer-link">Accessibility statement</Link>
              </div>
              <div>
                <div className="or-footer-eyebrow">About</div>
                <Link to="/about" className="or-footer-link">Our story</Link>
                <Link to="/privacy" className="or-footer-link">Privacy</Link>
                <Link to="/terms" className="or-footer-link">Terms</Link>
                <Link to="/contact" className="or-footer-link">Contact</Link>
              </div>
            </div>
            <div className="or-footer-bottom">
              <div className="or-footer-brand">
                <div className="or-avatar pt-purple" style={{ width: 24, height: 24 }} aria-hidden>
                  <Accessibility size={14} />
                </div>
                Open Road · © {new Date().getFullYear()}
              </div>
              <div style={{ fontSize: 11, color: "var(--or-text-3)" }}>
                Built with the community, for the community.
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AccessibleLayout>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-label={`Score ${value} of 100`}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="#9FE1CB" strokeWidth="6" />
      <circle
        cx="30" cy="30" r={r} fill="none" stroke="#0F6E56" strokeWidth="6"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        transform="rotate(-90 30 30)"
      />
      <text x="30" y="34" textAnchor="middle" fontSize="14" fontWeight="500" fill="#04342C">{value}</text>
    </svg>
  );
}

function Metric({ name, value, colour }: { name: string; value: number; colour: string }) {
  return (
    <div className="or-metric">
      <span className="or-metric-name">{name}</span>
      <span className="or-bar"><span className="or-bar-fill" style={{ width: `${value}%`, background: colour }} /></span>
      <span className="or-metric-val">{value}</span>
    </div>
  );
}
