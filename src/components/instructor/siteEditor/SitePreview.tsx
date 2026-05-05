import { SiteState } from "@/context/SiteEditorContext";

interface Props { site: SiteState }

export function SitePreview({ site }: Props) {
  const { brand, hero, services, reviews } = site;
  const initials = brand.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ fontFamily: `'${brand.font}', system-ui, sans-serif`, color: "#0F172A" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between"
        style={{ padding: 10, borderBottom: "0.5px solid #E2E8F0" }}
      >
        <div className="flex items-center gap-1.5">
          {brand.logo ? (
            <img src={brand.logo} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
          ) : (
            <div className="flex items-center gap-0.5">
              <span style={{ width: 6, height: 6, background: brand.primary, borderRadius: 1, transform: "skewY(-8deg)" }} />
              <span style={{ width: 6, height: 6, background: brand.accent, borderRadius: 1, transform: "skewY(-8deg)" }} />
              <span style={{ width: 6, height: 6, background: "#1F2937", borderRadius: 1, transform: "skewY(-8deg)" }} />
            </div>
          )}
          <span style={{ fontSize: 10, fontWeight: 600 }}>{brand.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 8, color: "#64748B" }}>About</span>
          <span style={{ fontSize: 8, color: "#64748B" }}>Lessons</span>
          <span style={{ fontSize: 8, color: "#64748B" }}>Reviews</span>
          <button
            style={{
              fontSize: 8, fontWeight: 600, color: "#fff",
              background: brand.primary, padding: "3px 6px", borderRadius: 4,
            }}
          >
            Book now
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="flex flex-col items-center text-center"
        style={{
          padding: "22px 16px",
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: brand.photo ? `url(${brand.photo}) center/cover` : brand.primary + "22",
            color: brand.primary, fontSize: 14, fontWeight: 600, marginBottom: 10,
          }}
        >
          {!brand.photo && initials}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{hero.headline}</div>
        <div style={{ fontSize: 10, color: "#64748B", marginTop: 4, maxWidth: 260 }}>{hero.subheadline}</div>
        <button
          style={{
            marginTop: 10, fontSize: 9, fontWeight: 600, color: "#fff",
            background: brand.primary, padding: "5px 10px", borderRadius: 5,
          }}
        >
          {hero.cta}
        </button>
      </section>

      {/* Lessons */}
      <section style={{ padding: "12px 16px", borderTop: "0.5px solid #E2E8F0" }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
          Lessons
        </div>
        <div className="grid grid-cols-2" style={{ gap: 6 }}>
          {services.slice(0, 4).map(s => (
            <div key={s.name} style={{ background: "#F8FAFC", borderRadius: 4, padding: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 9, color: "#64748B" }}>£{s.price}{s.unit === "hr" ? "/hr" : ""}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section style={{ padding: "12px 16px", borderTop: "0.5px solid #E2E8F0" }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
          Reviews
        </div>
        {reviews[0] && (
          <div style={{ background: "#F8FAFC", borderRadius: 4, padding: 8 }}>
            <div style={{ fontSize: 9, color: "#F59E0B", letterSpacing: 1 }}>★★★★★</div>
            <div style={{ fontSize: 9, marginTop: 3, lineHeight: 1.4 }}>"{reviews[0].quote}"</div>
            <div style={{ fontSize: 8, color: "#64748B", marginTop: 4 }}>— {reviews[0].name}</div>
          </div>
        )}
      </section>
    </div>
  );
}
