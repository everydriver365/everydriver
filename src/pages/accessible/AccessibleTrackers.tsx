import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { Clock, ArrowRight, ArrowLeft, RotateCw, MapPin, Shield, FileText, Users, Info, Check, X, Plug } from "lucide-react";
import trackerImage from "@/assets/atom-e-tracker.webp";

const styles = `
.open-road-tracker {
  --or-teal: #0F6E56;
  --or-teal-dark: #04342C;
  --or-teal-mid: #5DCAA5;
  --or-teal-tint: #E1F5EE;
  --or-teal-light: #9FE1CB;
  --or-purple: #3C3489;
  --or-purple-dark: #26215C;
  --or-purple-tint: #EEEDFE;
  --or-purple-mid: #CECBF6;
  --or-blue: #185FA5;
  --or-blue-tint: #E6F1FB;
  --or-blue-mid: #B5D4F4;
  --or-amber: #854F0B;
  --or-amber-tint: #FAEEDA;
  --or-amber-mid: #FAC775;
  --or-coral: #993C1D;
  --or-coral-tint: #FAECE7;
  --or-coral-mid: #F5C4B3;
  --or-pink: #993556;
  --or-pink-tint: #FBEAF0;
  --or-grey: #888780;
  --or-grey-tint: #F4F4F2;
  --or-ink: #1A1A17;
  --or-border: rgba(0,0,0,0.12);

  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--or-ink);
  background: #FFFFFF;
}
.open-road-tracker * { box-sizing: border-box; }
.open-road-tracker h1 { font-size: 26px; font-weight: 500; line-height: 1.3; margin: 0; }
.open-road-tracker h2 { font-size: 18px; font-weight: 500; line-height: 1.4; margin: 0; }
.open-road-tracker h3 { font-size: 16px; font-weight: 500; line-height: 1.4; margin: 0; }
.open-road-tracker p { margin: 0; }
.open-road-tracker .or-wrap { max-width: 880px; margin: 0 auto; padding: 24px 16px 64px; display: flex; flex-direction: column; gap: 20px; }

.open-road-tracker .or-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 40px; padding: 8px 18px;
  border-radius: 8px; font-size: 15px; font-weight: 500;
  border: 0.5px solid transparent; cursor: pointer; text-decoration: none;
  transition: opacity 0.15s ease;
}
.open-road-tracker .or-btn:focus-visible { outline: 2px solid var(--or-teal); outline-offset: 2px; }
.open-road-tracker .or-btn:hover { opacity: 0.9; }
.open-road-tracker .or-btn-primary { background: var(--or-teal); color: #fff; }
.open-road-tracker .or-btn-secondary { background: #fff; color: var(--or-teal); border-color: var(--or-teal); }

.open-road-tracker .or-pill {
  display: inline-flex; align-items: center; padding: 4px 10px;
  border-radius: 100px; font-size: 12px; font-weight: 500;
}

/* Hero */
.open-road-tracker .or-hero {
  background: var(--or-teal-tint);
  border-radius: 12px;
  padding: 2rem;
  display: flex; flex-direction: column; gap: 14px;
}
.open-road-tracker .or-hero-badge {
  align-self: flex-start;
  background: #fff; color: var(--or-teal);
  padding: 4px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 500;
}
.open-road-tracker .or-hero h1 { color: var(--or-teal-dark); max-width: 520px; }
.open-road-tracker .or-hero-sub { color: var(--or-teal); max-width: 520px; }
.open-road-tracker .or-hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; }

/* Comparison */
.open-road-tracker .or-compare {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}
.open-road-tracker .or-card {
  background: #fff; border: 0.5px solid var(--or-border);
  border-radius: 12px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 14px;
}
.open-road-tracker .or-card-recommended { border: 2px solid var(--or-teal-mid); }
.open-road-tracker .or-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.open-road-tracker .or-card-label { font-size: 14px; font-weight: 500; }
.open-road-tracker .or-stat { font-size: 28px; font-weight: 500; line-height: 1.1; }
.open-road-tracker .or-stat-label { font-size: 12px; margin-top: 4px; }
.open-road-tracker .or-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.open-road-tracker .or-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; }
.open-road-tracker .or-list-icon { flex-shrink: 0; margin-top: 2px; }

/* Metrics */
.open-road-tracker .or-metrics-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
}
.open-road-tracker .or-metric {
  background: var(--or-grey-tint);
  border-radius: 8px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.open-road-tracker .or-metric-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.open-road-tracker .or-metric-name { font-size: 13px; font-weight: 500; }
.open-road-tracker .or-metric-desc { font-size: 11px; color: var(--or-grey); }

/* Use cases */
.open-road-tracker .or-usecases {
  background: var(--or-purple-tint);
  border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.open-road-tracker .or-usecases h3 { color: var(--or-purple-dark); }
.open-road-tracker .or-usecase-list { display: flex; flex-direction: column; gap: 10px; }
.open-road-tracker .or-usecase {
  background: #fff; border-radius: 8px; padding: 12px 14px;
  display: flex; align-items: center; gap: 12px;
}
.open-road-tracker .or-usecase-icon {
  width: 32px; height: 32px; border-radius: 100px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.open-road-tracker .or-usecase-title { font-size: 14px; font-weight: 500; }
.open-road-tracker .or-usecase-desc { font-size: 12px; color: var(--or-grey); }

/* Privacy */
.open-road-tracker .or-privacy {
  background: var(--or-grey-tint); border-radius: 8px; padding: 12px 14px;
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 12px; color: var(--or-grey); line-height: 1.5;
}

/* Final CTA */
.open-road-tracker .or-final { text-align: center; padding: 24px 16px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
.open-road-tracker .or-final p { color: var(--or-grey); font-size: 14px; }

@media (prefers-reduced-motion: reduce) {
  .open-road-tracker * { transition: none !important; animation: none !important; }
}
@media (max-width: 620px) {
  .open-road-tracker .or-hero { padding: 1.25rem; }
  .open-road-tracker h1 { font-size: 24px; }
}
`;

const metrics = [
  { name: "Speed", desc: "vs. road limit", Icon: Clock, bg: "var(--or-purple-mid)", color: "var(--or-purple)" },
  { name: "Acceleration", desc: "smooth starts", Icon: ArrowRight, bg: "var(--or-coral-mid)", color: "var(--or-coral)" },
  { name: "Braking", desc: "controlled stops", Icon: ArrowLeft, bg: "var(--or-blue-mid)", color: "var(--or-blue)" },
  { name: "Cornering", desc: "smooth turns", Icon: RotateCw, bg: "var(--or-amber-mid)", color: "var(--or-amber)" },
  { name: "Route", desc: "precise path", Icon: MapPin, bg: "var(--or-teal-light)", color: "var(--or-teal)" },
];

const useCases = [
  { title: "Lower insurance premiums", desc: "Share verified safe-driving reports with participating insurers", Icon: Shield, bg: "var(--or-teal-tint)", color: "var(--or-teal)" },
  { title: "Evidence for DVLA licence reviews", desc: "Show objective data during medical reassessments", Icon: FileText, bg: "var(--or-blue-tint)", color: "var(--or-blue)" },
  { title: "Peace of mind for family", desc: "Optional trip alerts to a chosen contact", Icon: Users, bg: "var(--or-pink-tint)", color: "var(--or-pink)" },
  { title: "Incident evidence if something goes wrong", desc: "Timestamped data to support your version of events", Icon: Info, bg: "var(--or-amber-tint)", color: "var(--or-amber)" },
];

export default function AccessibleTrackers() {
  return (
    <AccessibleLayout>
      <SEOHead
        title="In-car tracker for members — Open Road"
        description="An in-car vehicle tracker that gives members shareable, timestamped evidence of how well they drive."
      />
      <style>{styles}</style>

      <div className="open-road-tracker">
        <div className="or-wrap">
          {/* Section 1 — Hero */}
          <section className="or-hero" aria-labelledby="or-hero-h">
            <span className="or-hero-badge">New · Exclusive to members</span>
            <h1 id="or-hero-h">Prove you're a great driver. With data, not words.</h1>
            <p className="or-hero-sub">
              Our in-car tracker measures your location and driving behaviour with far greater accuracy than any phone app — built to give you evidence when you need it most.
            </p>
            <div className="or-hero-ctas">
              <a href="#request" className="or-btn or-btn-primary">Request a tracker</a>
              <a href="#how" className="or-btn or-btn-secondary">How it works</a>
            </div>
          </section>

          {/* Section 2 — Comparison */}
          <section id="how" className="or-compare" aria-label="Phone app versus Open Road tracker">
            <article className="or-card">
              <header className="or-card-head">
                <span className="or-card-label" style={{ color: "var(--or-grey)" }}>Typical phone app</span>
                <span className="or-pill" style={{ background: "var(--or-grey-tint)", color: "var(--or-grey)" }}>For comparison</span>
              </header>
              <div>
                <div className="or-stat" style={{ color: "var(--or-grey)" }}>5–10m</div>
                <div className="or-stat-label" style={{ color: "var(--or-grey)" }}>GPS accuracy</div>
              </div>
              <ul className="or-list">
                {[
                  "Drops signal in tunnels & cities",
                  "Depends on battery & background permissions",
                  "Can't distinguish driver from passenger",
                  "Not accepted as formal evidence",
                ].map((t) => (
                  <li key={t}><X size={16} className="or-list-icon" color="var(--or-grey)" aria-hidden /><span>{t}</span></li>
                ))}
              </ul>
            </article>

            <article className="or-card or-card-recommended">
              <header className="or-card-head">
                <span className="or-card-label" style={{ color: "var(--or-teal)" }}>Open Road tracker</span>
                <span className="or-pill" style={{ background: "var(--or-teal-tint)", color: "var(--or-teal)" }}>Recommended</span>
              </header>
              <div>
                <div className="or-stat" style={{ color: "var(--or-teal-dark)" }}>&lt;1m</div>
                <div className="or-stat-label" style={{ color: "var(--or-teal)" }}>GPS + dead reckoning</div>
              </div>
              <ul className="or-list">
                {[
                  "Hard-wired, always on, never drops out",
                  "Accelerometer & gyroscope for true driving data",
                  "Tied to your vehicle, not your phone",
                  "Timestamped reports you can share or download",
                ].map((t) => (
                  <li key={t}><Check size={16} className="or-list-icon" color="var(--or-teal)" aria-hidden /><span>{t}</span></li>
                ))}
              </ul>
            </article>
          </section>

          {/* Section 3 — What it measures */}
          <section className="or-card" aria-labelledby="or-measures-h">
            <h3 id="or-measures-h">What it measures</h3>
            <p style={{ color: "var(--or-grey)", fontSize: 14 }}>
              Every trip is scored across five factors and saved to your personal driving record.
            </p>
            <div className="or-metrics-grid">
              {metrics.map(({ name, desc, Icon, bg, color }) => (
                <div key={name} className="or-metric">
                  <div className="or-metric-icon" style={{ background: bg }}>
                    <Icon size={16} color={color} aria-hidden />
                  </div>
                  <div className="or-metric-name">{name}</div>
                  <div className="or-metric-desc">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — Use cases */}
          <section className="or-usecases" aria-labelledby="or-uses-h">
            <h3 id="or-uses-h">What members use it for</h3>
            <div className="or-usecase-list">
              {useCases.map(({ title, desc, Icon, bg, color }) => (
                <div key={title} className="or-usecase">
                  <div className="or-usecase-icon" style={{ background: bg }}>
                    <Icon size={16} color={color} aria-hidden />
                  </div>
                  <div>
                    <div className="or-usecase-title">{title}</div>
                    <div className="or-usecase-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 — Privacy */}
          <aside className="or-privacy" role="note">
            <Info size={16} color="var(--or-grey)" aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
            <p>
              Your data, your control. You choose what to share, with whom, and when. Nothing is sent to insurers, family, or anyone else without your explicit consent.
            </p>
          </aside>

          {/* Section 6 — Final CTA */}
          <section id="request" className="or-final" aria-labelledby="or-final-h">
            <h3 id="or-final-h">Ready to drive with the data on your side?</h3>
            <p>Trackers are fitted by our partner installers. Free for members during your first year.</p>
            <a href="mailto:hello@drive365accessible.co.uk?subject=Request%20a%20tracker" className="or-btn or-btn-primary">Request a tracker</a>
          </section>
        </div>
      </div>
    </AccessibleLayout>
  );
}
