import {
  // Set A — SF Filled (current)
  Home, CalendarDays, Crosshair, User, MoreHorizontal,
  Briefcase, MessageSquare, ClipboardCheck, CalendarPlus, Activity,
  // Set B — Rounded Friendly
  House, CalendarCheck, Navigation, Users, Grid3X3,
  BriefcaseBusiness, MessagesSquare, ListChecks, CalendarClock, Radio,
  // Set C — Minimal Clean
  Calendar, MapPin, UserRound, Menu,
  Package, Mail, CheckSquare, CalendarRange, Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface IconSet {
  label: string;
  description: string;
  tab: { Home: LucideIcon; Schedule: LucideIcon; Track: LucideIcon; Pupils: LucideIcon; More: LucideIcon };
  cards: { Jobs: LucideIcon; Messages: LucideIcon; Tests: LucideIcon; Gaps: LucideIcon };
  telematics: LucideIcon;
}

const SETS: IconSet[] = [
  {
    label: "Set A — SF Filled (current)",
    description: "Geometric, Apple-style filled icons",
    tab: { Home, Schedule: CalendarDays, Track: Crosshair, Pupils: User, More: MoreHorizontal },
    cards: { Jobs: Briefcase, Messages: MessageSquare, Tests: ClipboardCheck, Gaps: CalendarPlus },
    telematics: Activity,
  },
  {
    label: "Set B — Rounded Friendly",
    description: "Softer shapes, more approachable",
    tab: { Home: House, Schedule: CalendarCheck, Track: Navigation, Pupils: Users, More: Grid3X3 },
    cards: { Jobs: BriefcaseBusiness, Messages: MessagesSquare, Tests: ListChecks, Gaps: CalendarClock },
    telematics: Radio,
  },
  {
    label: "Set C — Minimal Clean",
    description: "Thin stroke, lightweight modern",
    tab: { Home: House, Schedule: Calendar, Track: MapPin, Pupils: UserRound, More: Menu },
    cards: { Jobs: Package, Messages: Mail, Tests: CheckSquare, Gaps: CalendarRange },
    telematics: Waves,
  },
];

const cardTints = [
  { bg: "hsl(var(--dsm-tint-red-bg))", fg: "hsl(var(--dsm-tint-red-fg))", title: "Job offers" },
  { bg: "hsl(var(--dsm-tint-blue-bg))", fg: "hsl(var(--dsm-tint-blue-fg))", title: "Messages" },
  { bg: "hsl(var(--dsm-tint-green-bg))", fg: "hsl(var(--dsm-tint-green-fg))", title: "Tests" },
  { bg: "hsl(var(--dsm-tint-orange-bg))", fg: "hsl(var(--dsm-tint-orange-fg))", title: "Fill gaps" },
];

export default function IconPreviewPage() {
  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--dsm-bg))", padding: "16px 0 80px" }}>
      <div style={{ padding: "0 16px 16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "hsl(var(--dsm-text))", margin: 0 }}>
          Icon style preview
        </h1>
        <p style={{ fontSize: 13, color: "hsl(var(--dsm-text-secondary))", marginTop: 4 }}>
          Pick A, B, or C — reply in chat with your choice.
        </p>
      </div>

      {SETS.map((set, idx) => {
        const cardIcons = [set.cards.Jobs, set.cards.Messages, set.cards.Tests, set.cards.Gaps];
        const tabItems = [
          { label: "Home", Icon: set.tab.Home },
          { label: "Schedule", Icon: set.tab.Schedule },
          { label: "Track", Icon: set.tab.Track },
          { label: "Pupils", Icon: set.tab.Pupils },
          { label: "More", Icon: set.tab.More },
        ];
        const Tele = set.telematics;

        return (
          <section key={idx} style={{ marginBottom: 28 }}>
            <div style={{ padding: "0 16px 10px" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--dsm-text))", margin: 0 }}>
                {set.label}
              </p>
              <p style={{ fontSize: 12, color: "hsl(var(--dsm-text-secondary))", marginTop: 2 }}>
                {set.description}
              </p>
            </div>

            {/* Mini cards */}
            <div style={{ padding: "0 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {cardIcons.map((Icon, i) => {
                  const tint = cardTints[i];
                  return (
                    <div
                      key={i}
                      style={{
                        background: "hsl(var(--dsm-card))",
                        border: "0.5px solid hsl(var(--dsm-border))",
                        borderRadius: 12,
                        padding: 14,
                        height: 88,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          width: 36, height: 36, borderRadius: 12,
                          background: tint.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Icon size={18} strokeWidth={1.4} color={tint.fg} fill={tint.fg} style={{ strokeLinecap: "round", strokeLinejoin: "round" }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--dsm-text))", margin: 0 }}>
                        {tint.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Telematics tile */}
            <div style={{ padding: "10px 16px 0" }}>
              <div
                style={{
                  background: "hsl(var(--dsm-card))",
                  border: "0.5px solid hsl(var(--dsm-border))",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: "hsl(var(--dsm-tint-purple-bg, 270 60% 95%))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Tele size={18} strokeWidth={1.4} color="hsl(var(--dsm-tint-purple-fg, 270 60% 45%))" fill="hsl(var(--dsm-tint-purple-fg, 270 60% 45%))" style={{ strokeLinecap: "round", strokeLinejoin: "round" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--dsm-text))", margin: 0 }}>Telematics</p>
                  <p style={{ fontSize: 11, color: "hsl(var(--dsm-text-secondary))", margin: 0 }}>Live signal</p>
                </div>
              </div>
            </div>

            {/* Tab bar mock */}
            <div style={{ padding: "12px 16px 0" }}>
              <div
                style={{
                  background: "hsl(var(--dsm-card))",
                  borderRadius: 20,
                  border: "0.5px solid hsl(var(--dsm-border))",
                  padding: "10px 8px 12px",
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "flex-start",
                }}
              >
                {tabItems.map(({ label, Icon }, i) => {
                  const isActive = i === 0;
                  const activeColor = "hsl(var(--dsm-accent-blue))";
                  const inactiveColor = "hsl(var(--dsm-text-secondary))";
                  return (
                    <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56 }}>
                      <div
                        style={{
                          width: 44, height: 28, borderRadius: 14,
                          background: isActive ? "hsl(var(--dsm-accent-blue) / 0.12)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Icon
                          size={22}
                          strokeWidth={1.2}
                          color={isActive ? activeColor : inactiveColor}
                          fill={isActive ? activeColor : inactiveColor}
                          style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
                        />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? activeColor : inactiveColor }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
