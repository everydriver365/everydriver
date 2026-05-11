import { mockHome } from "../mockData";
import {
  Phone,
  Bell,
  Plus,
  MapPin,
  TrendingUp,
  Home as HomeIcon,
  Calendar,
  Activity,
  Users,
} from "lucide-react";

const PRIMARY = "#3D55A1";
const TINT = "#EDF2FE";
const BG = "#F4F7F6";
const TEXT = "#0F172A";
const MUTED = "#94A3B8";

function HeaderIcon({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: 38,
        height: 38,
        borderRadius: 999,
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: PRIMARY,
        boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
      }}
    >
      {children}
      {badge && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 999,
            background: "#EF4444",
            color: "white",
            fontSize: 9,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function Eyebrow({ children, color = MUTED }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 800,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function KpiTile({
  eyebrow,
  value,
  sub,
  filled = false,
  accent,
  children,
}: {
  eyebrow: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  filled?: boolean;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: filled ? PRIMARY : "white",
        color: filled ? "white" : TEXT,
        borderRadius: 12,
        padding: 14,
        border: filled ? "none" : "1px solid #E2E8F0",
        boxShadow: filled ? "0 8px 20px -8px rgba(61,85,161,0.45)" : "0 1px 2px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 96,
      }}
    >
      <Eyebrow color={filled ? "rgba(255,255,255,0.6)" : MUTED}>{eyebrow}</Eyebrow>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: filled ? "white" : accent ?? TEXT,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, opacity: filled ? 0.85 : 1 }}>
            {sub}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function V7Cockpit() {
  const m = mockHome;

  return (
    <div
      style={{
        background: BG,
        minHeight: "100%",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif",
        color: TEXT,
        paddingBottom: 110,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px 8px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: PRIMARY,
            color: "white",
            fontSize: 11,
            fontWeight: 800,
            fontStyle: "italic",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "-0.02em",
          }}
        >
          DSM
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <HeaderIcon>
            <Phone size={16} strokeWidth={2.2} />
          </HeaderIcon>
          <HeaderIcon badge="9+">
            <Bell size={16} strokeWidth={2.2} />
          </HeaderIcon>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: PRIMARY,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px -2px rgba(61,85,161,0.5)",
            }}
          >
            <Plus size={18} strokeWidth={2.4} />
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: "12px 20px 20px" }}>
        <Eyebrow>{m.dateLabel}</Eyebrow>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: PRIMARY,
            letterSpacing: "-0.02em",
            margin: "4px 0 0",
          }}
        >
          {m.greeting}, {m.instructorName}.
        </h1>
      </div>

      {/* Up Next widget */}
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: PRIMARY,
                background: TINT,
                padding: "5px 10px",
                borderRadius: 999,
                letterSpacing: "0.08em",
              }}
            >
              UP NEXT · {m.nextLesson.timeLabel}
            </span>
            <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
              In {Math.round(m.nextLesson.startsInMinutes / 60) || 1}h
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: m.nextLesson.avatarTone,
                color: m.nextLesson.avatarFg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                border: "2px solid white",
                boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
              }}
            >
              {m.nextLesson.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: TEXT }}>
                {m.nextLesson.pupilName}
              </h3>
              <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
                {m.nextLesson.lessonType} · {m.nextLesson.durationMinutes}m
              </p>
            </div>
          </div>

          <div
            style={{
              background: BG,
              borderRadius: 12,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "white",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: PRIMARY,
                  flexShrink: 0,
                }}
              >
                <MapPin size={16} strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: TEXT,
                    margin: 0,
                  }}
                >
                  {m.nextLesson.pickup}
                </p>
                <p style={{ fontSize: 10, color: MUTED, margin: "2px 0 0" }}>
                  {m.nextLesson.distanceMiles} mi · {m.nextLesson.etaMinutes} min ETA
                </p>
              </div>
            </div>
            <button
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                color: PRIMARY,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.06em",
                padding: "8px 14px",
                borderRadius: 10,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Navigate
            </button>
          </div>
        </div>
      </div>

      {/* KPI mosaic */}
      <div
        style={{
          padding: "14px 20px 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <KpiTile
          eyebrow="Earnings"
          value={`£${m.weekStats.earnings.value.toLocaleString()}`}
          accent={PRIMARY}
          sub={
            <span style={{ color: "#10B981", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <TrendingUp size={11} strokeWidth={3} /> +12% vs last wk
            </span>
          }
        />
        <KpiTile
          eyebrow="Streak"
          value={`14 Days`}
          filled
          sub={
            <div
              style={{
                marginTop: 8,
                width: "100%",
                height: 4,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div style={{ width: "75%", height: "100%", background: "white" }} />
            </div>
          }
        />
        <KpiTile
          eyebrow="Pupils owing"
          value={<span style={{ color: "#EF4444" }}>{m.alerts.pendingJobs}</span>}
          sub="Tap to chase"
        >
          <div style={{ display: "flex", marginTop: 6 }}>
            {["#FCE7F3", "#DBEAFE"].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: c,
                  border: "2px solid white",
                  marginLeft: i === 0 ? 0 : -8,
                }}
              />
            ))}
          </div>
        </KpiTile>
        <KpiTile
          eyebrow="Schedule"
          value={`${m.weekStats.lessons.value}/${m.weekStats.lessons.goal}`}
          sub="Done this week"
        >
          <div
            style={{
              marginTop: 8,
              width: "100%",
              height: 4,
              background: "#E2E8F0",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(m.weekStats.lessons.value / m.weekStats.lessons.goal) * 100}%`,
                height: "100%",
                background: PRIMARY,
              }}
            />
          </div>
        </KpiTile>
      </div>

      {/* Status row */}
      <div style={{ padding: "16px 20px 0" }}>
        <div
          style={{
            background: TINT,
            border: "1px solid #DBEAFE",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ position: "relative", width: 8, height: 8 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                background: PRIMARY,
                opacity: 0.4,
                animation: "v7pulse 1.6s ease-out infinite",
              }}
            />
            <span
              style={{
                position: "absolute",
                inset: 1,
                borderRadius: 999,
                background: PRIMARY,
              }}
            />
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: PRIMARY,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Call divert active at 16:25
          </span>
        </div>
      </div>

      {/* Today preview list */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Eyebrow>Today</Eyebrow>
          <span style={{ fontSize: 11, fontWeight: 800, color: PRIMARY }}>Diary →</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {m.todayLessons.slice(0, 3).map((l) => (
            <div
              key={l.id}
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: MUTED,
                  width: 38,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {l.time}
              </span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: TINT,
                  color: PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {l.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{l.pupil}</p>
                <p style={{ fontSize: 10, color: MUTED, margin: "1px 0 0" }}>
                  {l.type} · {l.location}
                </p>
              </div>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: l.paid ? "#10B981" : "#F59E0B",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          height: 64,
          background: "white",
          borderRadius: 22,
          boxShadow: "0 12px 30px -8px rgba(15,23,42,0.18)",
          border: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
        }}
      >
        {[
          { Icon: HomeIcon, label: "Home", active: true },
          { Icon: Calendar, label: "Diary" },
          null,
          { Icon: Activity, label: "Track" },
          { Icon: Users, label: "Pupils" },
        ].map((item, i) =>
          item ? (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: item.active ? PRIMARY : "#CBD5E1",
              }}
            >
              <item.Icon size={20} strokeWidth={item.active ? 2.6 : 2} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.04em" }}>
                {item.label.toUpperCase()}
              </span>
            </div>
          ) : (
            <div
              key={i}
              style={{
                marginTop: -28,
                width: 60,
                height: 38,
                background: PRIMARY,
                borderRadius: 999,
                border: "4px solid #F4F7F6",
                boxShadow: "0 8px 16px -4px rgba(61,85,161,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 22, height: 3, background: "rgba(255,255,255,0.5)", borderRadius: 999 }} />
            </div>
          ),
        )}
      </div>

      <style>{`
        @keyframes v7pulse {
          0% { transform: scale(1); opacity: 0.5; }
          80%, 100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
