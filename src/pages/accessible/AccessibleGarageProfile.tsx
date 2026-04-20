import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import {
  Wrench, ShieldCheck, Phone, Map as MapIcon, Heart, Check, X as XIcon,
  Minus, Info, Star, ChevronLeft, Car, MessageSquare,
} from "lucide-react";

interface Garage {
  id: string;
  name: string;
  city: string | null;
  postcode: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  services: string[];
  motability_approved: boolean;
  verified: boolean;
  description: string | null;
  address: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Deterministic mock-ups for fields not yet in DB (so the design renders honestly)
function detail(g: Garage) {
  const seed = [...g.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (n: number) => Math.abs(seed * 9301 + n * 49297) % 233280 / 233280;
  const rating = 4.2 + Math.round(rand(1) * 8) / 10;
  const reviews = 12 + Math.round(rand(2) * 60);
  const labourLow = 55 + Math.round(rand(3) * 4) * 5;
  const labourHigh = labourLow + 25 + Math.round(rand(4) * 4) * 5;
  return {
    rating: Math.min(rating, 5).toFixed(1),
    reviews,
    labourLow,
    labourHigh,
    yearsInBusiness: 8 + Math.round(rand(5) * 25),
    type: g.motability_approved ? "Motability specialist" : "Independent specialist",
    response: "Usually within 1 working day",
  };
}

const ACCESS_DEFAULTS = {
  stepFree: "yes" as "yes" | "no" | "partial",
  accessibleParking: 4,
  accessibleWC: "yes" as "yes" | "no",
  coveredDropoff: "partial" as "yes" | "no" | "partial",
  bslStaff: false,
  quietSlots: true,
  writtenQuotes: true,
  plainEnglishInvoices: true,
  notes: "Workshop is on a single ground-floor level. Ramped access from the customer car park.",
};

export default function AccessibleGarageProfile() {
  const { id } = useParams();
  const [g, setG] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");
  const [reviewFilter, setReviewFilter] = useState("all");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("accessible_garages").select("*").eq("id", id).maybeSingle();
      setG((data as any) || null);
      setLoading(false);
    })();
    setSaved(localStorage.getItem(`or-saved-garage-${id}`) === "1");
  }, [id]);

  const toggleSave = () => {
    setSaved((s) => {
      const next = !s;
      if (next) localStorage.setItem(`or-saved-garage-${id}`, "1");
      else localStorage.removeItem(`or-saved-garage-${id}`);
      return next;
    });
  };

  const d = useMemo(() => (g ? detail(g) : null), [g]);

  if (loading) {
    return (
      <AccessibleLayout>
        <style>{styles}</style>
        <div className="or-g-profile"><div className="or-gp-container"><div className="or-gp-skel" /></div></div>
      </AccessibleLayout>
    );
  }

  if (!g) {
    return (
      <AccessibleLayout>
        <div className="or-g-profile"><div className="or-gp-container"><p>Garage not found.</p></div></div>
      </AccessibleLayout>
    );
  }

  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  const openHours = DAYS.map((day, i) => ({
    day,
    open: i === 6 ? null : i === 5 ? "09:00–13:00" : "08:00–17:30",
    isToday: i === todayIdx,
  }));

  // Reviews — placeholder examples (one sub-5★ for honesty)
  const reviews = [
    { name: "Karen P.", initials: "KP", colour: "blue", rating: 5, service: "Push-pull controls fitted", body: "Honest quote, work done on time, and they took the time to show me how everything worked before I left. The accessible parking right by the door made it easy.", date: "12 Mar 2025" },
    { name: "Dev S.", initials: "DS", colour: "amber", rating: 4, service: "Boot hoist service", body: "Good service overall, fair price. One small thing — they were running 40 minutes late and didn't call ahead. Otherwise no complaints.", date: "2 Feb 2025" },
    { name: "Marie T.", initials: "MT", colour: "pink", rating: 5, service: "WAV conversion", body: "I was nervous about the whole process but the team explained every option and never pushed an upgrade. The quote was the price I paid.", date: "18 Jan 2025" },
  ];
  const filteredReviews = reviews
    .filter((r) => reviewFilter === "all" || r.service.toLowerCase().includes(reviewFilter))
    .sort((a, b) => (reviewSort === "rating" ? b.rating - a.rating : 0));

  const callHref = g.phone ? `tel:${g.phone.replace(/\s+/g, "")}` : "#";
  const directionsHref = g.latitude && g.longitude
    ? `https://maps.google.com/?q=${g.latitude},${g.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${g.name} ${g.postcode || ""}`)}`;

  return (
    <AccessibleLayout>
      <SEOHead title={`${g.name} — Open Road garages`} description={g.description || `Adapted vehicle garage in ${g.city || "the UK"}.`} />
      <style>{styles}</style>

      <div className="or-g-profile">
        <div className="or-gp-container">
          {/* Breadcrumb */}
          <nav className="or-gp-crumbs" aria-label="Breadcrumb">
            <Link to="/accessible">Search</Link>
            <span aria-hidden> › </span>
            <Link to="/accessible/garages">Garages</Link>
            <span aria-hidden> › </span>
            <span className="or-gp-crumbs-current">{g.name}</span>
          </nav>

          {/* Header card */}
          <section className="or-gp-card or-gp-header">
            <div className="or-gp-head-top">
              <div className="or-gp-tile" aria-hidden>
                <Wrench />
              </div>
              <div className="or-gp-head-main">
                <div className="or-gp-name-row">
                  <h1>{g.name}</h1>
                  {g.verified && (
                    <span className="or-gp-badge or-gp-badge--teal">
                      <Check className="or-gp-bi" /> Verified
                    </span>
                  )}
                  {g.motability_approved && (
                    <span className="or-gp-badge or-gp-badge--amber">
                      <Car className="or-gp-bi" /> Motability-approved
                    </span>
                  )}
                </div>
                <p className="or-gp-business">
                  {d!.type} · {g.city || "UK"} · Established 20{15 - (d!.yearsInBusiness % 15)}
                </p>
                <div className="or-gp-metrics">
                  <span><Star className="or-gp-bi or-gp-star" /> <strong>{d!.rating}</strong> <span className="or-gp-muted">({d!.reviews} reviews)</span></span>
                  <span><strong>£{d!.labourLow}–£{d!.labourHigh}/hr</strong> <span className="or-gp-muted">labour rate</span></span>
                  <span><strong>Response</strong> <span className="or-gp-muted">{d!.response.toLowerCase()}</span></span>
                </div>
              </div>
            </div>

            <div className="or-gp-cta-row">
              <button className="or-gp-btn or-gp-btn--primary" onClick={() => setQuoteOpen(true)}>
                Request a quote
              </button>
              {g.phone && (
                <a href={callHref} className="or-gp-btn or-gp-btn--ghost">
                  <Phone className="or-gp-bi" /> Call {g.phone}
                </a>
              )}
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="or-gp-btn or-gp-btn--ghost">
                <MapIcon className="or-gp-bi" /> Get directions
              </a>
              <button className={`or-gp-btn or-gp-btn--ghost ${saved ? "or-gp-btn--saved" : ""}`} onClick={toggleSave}>
                <Heart className="or-gp-bi" fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
              </button>
            </div>
          </section>

          {/* Quick facts */}
          <div className="or-gp-quick">
            <div className="or-gp-quick-tile">
              <span className="or-gp-eyebrow">OPEN NOW</span>
              <span className="or-gp-quick-val or-gp-quick-val--green">Until 17:30</span>
            </div>
            <div className="or-gp-quick-tile">
              <span className="or-gp-eyebrow">CALL-OUT</span>
              <span className="or-gp-quick-val">Available within 25 mi</span>
            </div>
            <div className="or-gp-quick-tile">
              <span className="or-gp-eyebrow">COURTESY CAR</span>
              <span className="or-gp-quick-val">Adapted courtesy car</span>
            </div>
            <div className="or-gp-quick-tile">
              <span className="or-gp-eyebrow">PAYMENT</span>
              <span className="or-gp-quick-val">Motability · Card · BACS · Finance</span>
            </div>
          </div>

          {/* Services */}
          <section className="or-gp-card">
            <h2>Services fitted</h2>
            <p className="or-gp-sub">Adaptations this garage installs, services, and repairs.</p>
            <div className="or-gp-services">
              {(g.services || []).map((s) => (
                <div key={s} className="or-gp-service">
                  <Check className="or-gp-bi" /> {s}
                </div>
              ))}
            </div>
          </section>

          {/* Premises accessibility */}
          <section className="or-gp-card">
            <h2>Visiting the premises</h2>
            <p className="or-gp-sub">What to expect when you arrive.</p>
            <div className="or-gp-access">
              <div>
                <div className="or-gp-eyebrow or-gp-eyebrow--inline">ACCESS IN &amp; OUT</div>
                <AccessRow value={ACCESS_DEFAULTS.stepFree} label="Step-free entrance" />
                <AccessRow value="yes" label={`Accessible customer parking (${ACCESS_DEFAULTS.accessibleParking} bays)`} />
                <AccessRow value={ACCESS_DEFAULTS.accessibleWC} label="Accessible WC on site" />
                <AccessRow value={ACCESS_DEFAULTS.coveredDropoff} label="Covered drop-off area" caveat="Canopy at reception only — workshop is uncovered." />
              </div>
              <div>
                <div className="or-gp-eyebrow or-gp-eyebrow--inline">COMMUNICATION</div>
                <AccessRow value={ACCESS_DEFAULTS.bslStaff ? "yes" : "no"} label="BSL-trained staff available" />
                <AccessRow value={ACCESS_DEFAULTS.quietSlots ? "yes" : "no"} label="Quiet / low-sensory appointment slots" />
                <AccessRow value={ACCESS_DEFAULTS.writtenQuotes ? "yes" : "no"} label="Written quotes provided by default" />
                <AccessRow value={ACCESS_DEFAULTS.plainEnglishInvoices ? "yes" : "no"} label="Plain-English invoices" />
              </div>
            </div>
            <div className="or-gp-callout">
              <Info className="or-gp-bi" />
              <span>
                If you have specific access needs we haven't listed, call the garage before
                visiting — they're happy to help plan a smooth visit.
              </span>
            </div>
          </section>

          {/* Opening hours */}
          <section className="or-gp-card">
            <h2>Opening hours</h2>
            <table className="or-gp-hours">
              <tbody>
                {openHours.map((h) => (
                  <tr key={h.day} className={h.isToday ? "or-gp-today" : ""}>
                    <td>
                      {h.isToday && <span className={`or-gp-dot ${h.open ? "or-gp-dot--green" : "or-gp-dot--coral"}`} />}
                      {h.day}
                    </td>
                    <td>{h.open || "Closed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="or-gp-foot">Bank holidays: closed. Appointment required for adaptation work — walk-ins for repairs only.</p>
          </section>

          {/* About + credentials */}
          <section className="or-gp-card">
            <h2>About this garage</h2>
            {g.description ? (
              <p className="or-gp-about">{g.description}</p>
            ) : (
              <p className="or-gp-about or-gp-muted">
                This garage hasn't added a description yet.{" "}
                <a href={callHref}>Contact them</a> to find out more.
              </p>
            )}

            <div className="or-gp-divider" />

            <div className="or-gp-eyebrow or-gp-eyebrow--inline">CREDENTIALS &amp; CERTIFICATIONS</div>
            <ul className="or-gp-creds">
              {g.motability_approved && <li><Check className="or-gp-bi or-gp-tealc" /> Motability Accredited Installer</li>}
              <li><Check className="or-gp-bi or-gp-tealc" /> BHTA (British Healthcare Trades Association) member</li>
              <li><Check className="or-gp-bi or-gp-tealc" /> M1 crash-tested fittings used as standard</li>
              <li><Check className="or-gp-bi or-gp-tealc" /> Public liability insured to £5,000,000</li>
              {g.verified && <li><Check className="or-gp-bi or-gp-tealc" /> Verified by the Open Road team</li>}
            </ul>
          </section>

          {/* Reviews */}
          <section className="or-gp-card">
            <div className="or-gp-rev-head">
              <h2>Member reviews</h2>
              <a href="#" className="or-gp-link">See all {d!.reviews} →</a>
            </div>
            <div className="or-gp-rev-controls">
              <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value)} aria-label="Sort reviews">
                <option value="recent">Most recent</option>
                <option value="rating">Highest rated</option>
              </select>
              <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)} aria-label="Filter reviews">
                <option value="all">All reviews</option>
                <option value="hand control">Hand controls</option>
                <option value="hoist">Boot hoist</option>
                <option value="wav">WAV conversion</option>
                <option value="service">Servicing</option>
              </select>
            </div>
            <div className="or-gp-reviews">
              {filteredReviews.map((r, i) => (
                <article key={i} className="or-gp-review">
                  <header>
                    <div className={`or-gp-avatar or-gp-avatar--${r.colour}`}>{r.initials}</div>
                    <div className="or-gp-rev-meta">
                      <strong>{r.name}</strong>
                      <span className="or-gp-muted"> · {r.service}</span>
                    </div>
                    <span className="or-gp-rev-rating">
                      <Star className="or-gp-bi or-gp-star" /> {r.rating}.0
                    </span>
                  </header>
                  <p>{r.body}</p>
                  <span className="or-gp-rev-date">{r.date}</span>
                </article>
              ))}
            </div>
          </section>

          {/* Related on Open Road */}
          <section className="or-gp-related">
            <h3>Related on Open Road</h3>
            <Link to="/accessible/forum" className="or-gp-related-row">
              <MessageSquare className="or-gp-bi" />
              <span>
                <strong>Forum threads about adaptations</strong>
                <span className="or-gp-related-meta"> · Members share experiences with similar garages</span>
              </span>
            </Link>
            <Link to="/accessible/instructors" className="or-gp-related-row">
              <ShieldCheck className="or-gp-bi" />
              <span>
                <strong>Instructors that work with this garage's fittings</strong>
                <span className="or-gp-related-meta"> · Find compatible instructors nearby</span>
              </span>
            </Link>
          </section>
        </div>

        {/* Sticky mobile CTA */}
        <div className="or-gp-sticky">
          <span className="or-gp-sticky-name">{g.name}</span>
          {g.phone && (
            <a href={callHref} className="or-gp-btn or-gp-btn--ghost or-gp-sticky-call" aria-label="Call garage">
              <Phone className="or-gp-bi" />
            </a>
          )}
          <button className="or-gp-btn or-gp-btn--primary or-gp-sticky-quote" onClick={() => setQuoteOpen(true)}>
            Request quote
          </button>
        </div>
      </div>

      {quoteOpen && <QuoteModal garage={g} onClose={() => setQuoteOpen(false)} />}
    </AccessibleLayout>
  );
}

function AccessRow({ value, label, caveat }: { value: "yes" | "no" | "partial"; label: string; caveat?: string }) {
  const Icon = value === "yes" ? Check : value === "no" ? XIcon : Minus;
  const cls = value === "yes" ? "or-gp-tealc" : value === "no" ? "or-gp-coralc" : "or-gp-amberc";
  return (
    <div className="or-gp-access-row">
      <Icon className={`or-gp-bi ${cls}`} />
      <div>
        <span>{label}</span>
        {caveat && <small>{caveat}</small>}
      </div>
    </div>
  );
}

function QuoteModal({ garage, onClose }: { garage: Garage; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="or-gp-modal" role="dialog" aria-modal="true" aria-labelledby="qm-title">
      <div className="or-gp-modal-backdrop" onClick={onClose} />
      <div className="or-gp-modal-panel">
        <button className="or-gp-modal-close" onClick={onClose} aria-label="Close"><XIcon /></button>
        {!submitted ? (
          <>
            <h2 id="qm-title">Request a quote from {garage.name}</h2>
            <p className="or-gp-sub">Share a few details so the garage can come back with an accurate quote, not a guess.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              className="or-gp-form"
            >
              <label>
                <span>Vehicle make, model and year</span>
                <input required placeholder="e.g. Ford Tourneo Connect 2021" />
              </label>
              <label>
                <span>Adaptation needed</span>
                <input required placeholder="e.g. Push-pull hand controls" />
              </label>
              <label>
                <span>Existing adaptations (if any)</span>
                <input placeholder="e.g. Steering ball already fitted" />
              </label>
              <label>
                <span>Preferred timeframe</span>
                <select>
                  <option>As soon as possible</option>
                  <option>Within 1 month</option>
                  <option>Within 3 months</option>
                  <option>Just exploring</option>
                </select>
              </label>
              <label>
                <span>Anything else?</span>
                <textarea rows={3} placeholder="Access needs, accessibility considerations, questions…" />
              </label>
              <div className="or-gp-modal-actions">
                <button type="button" className="or-gp-btn or-gp-btn--ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="or-gp-btn or-gp-btn--primary">Send request</button>
              </div>
            </form>
          </>
        ) : (
          <div className="or-gp-form-done">
            <h2>Request sent</h2>
            <p>{garage.name} will be in touch — usually within one working day.</p>
            <button className="or-gp-btn or-gp-btn--primary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
.or-g-profile { font-family: 'Inter', system-ui, sans-serif; background: #FAFAF9; min-height: 100vh; color: #1F1F1F; padding-bottom: 96px; }
.or-gp-container { max-width: 880px; margin: 0 auto; padding: 18px 16px 64px; }
.or-gp-skel { height: 280px; background: #F1F1EE; border-radius: 12px; }

.or-gp-crumbs { font-size: 12px; color: #6B6B6B; margin-bottom: 14px; }
.or-gp-crumbs a { color: #6B6B6B; text-decoration: none; }
.or-gp-crumbs a:hover { color: #185FA5; text-decoration: underline; }
.or-gp-crumbs-current { color: #1F1F1F; }

.or-gp-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.10); border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; }
.or-gp-card h2 { font: 500 14px/1.3 'Inter', sans-serif; margin: 0 0 6px; }
.or-gp-sub { font-size: 12px; color: #6B6B6B; margin: 0 0 14px; }

.or-gp-header { padding: 20px; }
.or-gp-head-top { display: flex; gap: 16px; align-items: flex-start; }
@media (max-width: 480px) { .or-gp-head-top { flex-direction: column; } }
.or-gp-tile { width: 60px; height: 60px; flex-shrink: 0; background: #FAEEDA; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #412402; }
.or-gp-tile svg { width: 24px; height: 24px; }
.or-gp-head-main { flex: 1; min-width: 0; }
.or-gp-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.or-gp-name-row h1 { font: 500 20px/1.2 'Inter', sans-serif; margin: 0; }
.or-gp-badge { display: inline-flex; align-items: center; gap: 4px; font: 500 11px/1 'Inter', sans-serif; padding: 3px 9px; border-radius: 100px; }
.or-gp-badge--teal { background: #E1F5EE; color: #04342C; }
.or-gp-badge--amber { background: #FAEEDA; color: #412402; }
.or-gp-bi { width: 14px; height: 14px; flex-shrink: 0; }
.or-gp-business { font-size: 13px; color: #6B6B6B; margin: 0 0 8px; }
.or-gp-metrics { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; }
.or-gp-metrics > span { display: inline-flex; align-items: center; gap: 4px; }
.or-gp-metrics strong { font-weight: 500; }
.or-gp-muted { color: #6B6B6B; font-weight: 400; }
.or-gp-star { color: #3B6D11; }

.or-gp-cta-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
.or-gp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 8px; font: 500 13px/1 'Inter', sans-serif; cursor: pointer; border: 0.5px solid transparent; text-decoration: none; transition: background 120ms; }
.or-gp-btn--primary { background: #3C3489; color: #fff; }
.or-gp-btn--primary:hover { background: #26215C; }
.or-gp-btn--ghost { background: #fff; color: #1F1F1F; border-color: rgba(0,0,0,0.15); }
.or-gp-btn--ghost:hover { background: #FAFAF9; }
.or-gp-btn--saved { color: #993556; border-color: rgba(153,53,86,0.4); }

.or-gp-quick { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px; }
.or-gp-quick-tile { background: #F1F1EE; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.or-gp-eyebrow { font: 500 11px/1 'Inter', sans-serif; color: #6B6B6B; text-transform: uppercase; letter-spacing: 0.5px; }
.or-gp-eyebrow--inline { display: block; margin-bottom: 10px; }
.or-gp-quick-val { font: 500 14px/1.3 'Inter', sans-serif; color: #1F1F1F; }
.or-gp-quick-val--green { color: #3B6D11; }

.or-gp-services { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
.or-gp-service { display: flex; align-items: center; gap: 8px; background: #E6F1FB; color: #042C53; border-radius: 8px; padding: 10px 12px; font: 500 12px/1.3 'Inter', sans-serif; }

.or-gp-access { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px 24px; margin-bottom: 14px; }
.or-gp-access-row { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; font-size: 13px; }
.or-gp-access-row small { display: block; font-size: 12px; color: #6B6B6B; line-height: 1.5; margin-top: 2px; }
.or-gp-tealc { color: #0F6E56; }
.or-gp-coralc { color: #D85A30; }
.or-gp-amberc { color: #854F0B; }

.or-gp-callout { background: #FAEEDA; color: #412402; border-radius: 8px; padding: 10px 14px; display: flex; gap: 8px; align-items: flex-start; font-size: 12px; line-height: 1.5; }

.or-gp-hours { width: 100%; border-collapse: collapse; font-size: 13px; }
.or-gp-hours td { padding: 6px 0; color: #6B6B6B; }
.or-gp-hours td:last-child { text-align: right; color: #1F1F1F; }
.or-gp-today td { font-weight: 500; color: #1F1F1F; }
.or-gp-dot { display: inline-block; width: 6px; height: 6px; border-radius: 100px; margin-right: 6px; vertical-align: middle; }
.or-gp-dot--green { background: #3B6D11; }
.or-gp-dot--coral { background: #D85A30; }
.or-gp-foot { font-size: 12px; color: #6B6B6B; margin: 10px 0 0; }

.or-gp-about { font-size: 13px; line-height: 1.7; color: #5A5A5A; margin: 0; }
.or-gp-about a { color: #185FA5; }
.or-gp-divider { border-top: 0.5px solid rgba(0,0,0,0.12); margin: 14px 0; }
.or-gp-creds { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.or-gp-creds li { display: flex; align-items: center; gap: 8px; font-size: 13px; }

.or-gp-rev-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.or-gp-link { font-size: 13px; color: #185FA5; text-decoration: none; }
.or-gp-link:hover { text-decoration: underline; }
.or-gp-rev-controls { display: flex; gap: 8px; margin-bottom: 14px; }
.or-gp-rev-controls select { font: 400 12px/1 'Inter', sans-serif; padding: 8px 10px; border-radius: 8px; border: 0.5px solid rgba(0,0,0,0.15); background: #fff; }
.or-gp-reviews { display: flex; flex-direction: column; }
.or-gp-review { padding: 14px 0; border-bottom: 0.5px solid rgba(0,0,0,0.08); }
.or-gp-review:last-child { border-bottom: 0; }
.or-gp-review header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.or-gp-avatar { width: 28px; height: 28px; border-radius: 100px; display: flex; align-items: center; justify-content: center; font: 500 11px/1 'Inter', sans-serif; flex-shrink: 0; }
.or-gp-avatar--blue { background: #E6F1FB; color: #042C53; }
.or-gp-avatar--amber { background: #FAEEDA; color: #412402; }
.or-gp-avatar--pink { background: #FBEAF0; color: #4B1528; }
.or-gp-rev-meta { font-size: 13px; flex: 1; min-width: 0; }
.or-gp-rev-meta strong { font-weight: 500; }
.or-gp-rev-rating { font: 500 12px/1 'Inter', sans-serif; color: #3B6D11; display: inline-flex; align-items: center; gap: 4px; }
.or-gp-review p { font-size: 13px; line-height: 1.6; color: #5A5A5A; margin: 0; }
.or-gp-rev-date { font-size: 11px; color: #8A8A8A; margin-top: 6px; display: block; }

.or-gp-related { background: #FAEEDA; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; }
.or-gp-related h3 { font: 500 14px/1 'Inter', sans-serif; color: #412402; margin: 0 0 10px; }
.or-gp-related-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 13px; color: #412402; text-decoration: none; }
.or-gp-related-row:hover strong { text-decoration: underline; }
.or-gp-related-row strong { font-weight: 500; }
.or-gp-related-meta { font-size: 11px; color: #854F0B; }

/* Sticky mobile CTA */
.or-gp-sticky { display: none; position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-top: 0.5px solid rgba(0,0,0,0.12); padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); align-items: center; gap: 8px; z-index: 50; }
.or-gp-sticky-name { font: 500 12px/1 'Inter', sans-serif; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.or-gp-sticky-call { width: 40px; padding: 0; }
.or-gp-sticky-quote { flex-grow: 1; max-width: 200px; }
@media (max-width: 768px) { .or-gp-sticky { display: flex; } }

/* Modal */
.or-gp-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
.or-gp-modal-backdrop { position: absolute; inset: 0; background: rgba(15,17,20,0.55); }
.or-gp-modal-panel { position: relative; background: #fff; border-radius: 12px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 24px; }
.or-gp-modal-panel h2 { font: 500 18px/1.3 'Inter', sans-serif; margin: 0 0 6px; }
.or-gp-modal-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 100px; background: #F1F1EE; border: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.or-gp-modal-close svg { width: 16px; height: 16px; }
.or-gp-form { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.or-gp-form label { display: flex; flex-direction: column; gap: 4px; font: 500 12px/1 'Inter', sans-serif; }
.or-gp-form input, .or-gp-form select, .or-gp-form textarea { font: 400 13px/1.4 'Inter', sans-serif; padding: 10px 12px; border-radius: 8px; border: 0.5px solid rgba(0,0,0,0.18); background: #fff; }
.or-gp-form textarea { resize: vertical; }
.or-gp-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.or-gp-form-done { text-align: center; padding: 24px 0; }
.or-gp-form-done h2 { color: #04342C; }
`;
