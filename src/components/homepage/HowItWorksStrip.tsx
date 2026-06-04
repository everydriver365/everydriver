import { Search, CalendarCheck, Car } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Search your postcode",
    body: "See every DVSA-approved instructor in your area with live availability.",
    barColor: "#0A2B6B",
    iconBg: "#EFF6FF",
    iconColor: "#0A2B6B",
  },
  {
    n: "02",
    icon: CalendarCheck,
    title: "Book in seconds",
    body: "Pick a course, pay your way — card, Klarna or Clearpay. No phone calls.",
    barColor: "#E8641A",
    iconBg: "#FFF7ED",
    iconColor: "#E8641A",
  },
  {
    n: "03",
    icon: Car,
    title: "Start driving",
    body: "Your instructor picks you up. Free re-test if you don't pass first time.",
    barColor: "#059669",
    iconBg: "#F0FDF4",
    iconColor: "#059669",
  },
];

export function HowItWorksStrip() {
  return (
    <section style={{ background: "#FFFFFF", padding: "56px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#E8641A",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            How it works
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#0A1628",
              letterSpacing: -0.5,
              margin: 0,
            }}
          >
            Find an instructor in 3 steps
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {steps.map(({ n, icon: Icon, title, body, barColor, iconBg, iconColor }) => (
            <div
              key={n}
              className="hiw-card"
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                overflow: "hidden",
                background: "#FFFFFF",
                transition: "box-shadow 150ms ease",
              }}
            >
              <div style={{ height: 5, width: "100%", background: barColor }} />
              <div style={{ padding: "20px 18px" }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#E5E7EB",
                    letterSpacing: -1,
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Icon style={{ width: 20, height: 20, color: iconColor }} strokeWidth={2} />
                </div>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0A1628",
                    margin: 0,
                    marginBottom: 5,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: 11,
                    color: "#6B7280",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .hiw-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      `}</style>
    </section>
  );
}
