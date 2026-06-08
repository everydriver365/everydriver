import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  Clock,
  CalendarDays,
  Users,
  CalendarRange,
  Bell,
  CreditCard,
} from "lucide-react";
import type { SettingsCategory } from "@/components/instructor/settings/SettingsLayout";

/**
 * Mobile-only redesigned layout for the Schedule settings category.
 *
 * Visual-only redesign: every existing editor (WorkingHoursEditor,
 * LessonLengthBufferEditor, PupilBookingSettingsEditor, IcsCalendarSync,
 * ReminderSettings) is reused unchanged — only the surrounding chrome
 * (page header, uppercase group labels, card headers, fixed save bar)
 * is new. All data/state/hooks live inside those editors.
 */

const NAVY = "#0F2044";
const MUTED = "#7A849A";
const BG = "#F2F4F8";
const CARD_BORDER = "#E0E4EE";
const FONT = '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type Group = {
  label: string;
  cards: Array<{
    sectionId: string;
    title: string;
    subtitle: string;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
  }>;
};

export function ScheduleMobileLayout({ category }: { category: SettingsCategory }) {
  const navigate = useNavigate();
  const byId = new Map(category.sections.map((s) => [s.id, s]));

  const groups: Group[] = [
    {
      label: "Working hours",
      cards: [
        {
          sectionId: "hours",
          title: "Working hours",
          subtitle: "Set the days, times and date overrides",
          icon: <Clock size={18} strokeWidth={2} />,
          iconBg: "#E6EFFF",
          iconColor: "#2D5BFF",
        },
      ],
    },
    {
      label: "Lesson settings",
      cards: [
        {
          sectionId: "lesson-length",
          title: "Lesson length & buffer",
          subtitle: "Duration options, gaps and bank holidays",
          icon: <Clock size={18} strokeWidth={2} />,
          iconBg: "#E6EFFF",
          iconColor: "#2D5BFF",
        },
      ],
    },
    {
      label: "Pupil booking",
      cards: [
        {
          sectionId: "self-service",
          title: "Self-service booking",
          subtitle: "Control what pupils can do via their portal",
          icon: <Users size={18} strokeWidth={2} />,
          iconBg: "#E6EFFF",
          iconColor: "#2D5BFF",
        },
      ],
    },
    {
      label: "Calendar sync",
      cards: [
        {
          sectionId: "calendar",
          title: "Google / Apple / Outlook",
          subtitle: "Two-way sync between lessons and your calendar",
          icon: <CalendarRange size={18} strokeWidth={2} />,
          iconBg: "#E6EFFF",
          iconColor: "#2D5BFF",
        },
      ],
    },
    {
      label: "Reminders",
      cards: [
        {
          sectionId: "reminders",
          title: "Lesson reminders",
          subtitle: "Automatic reminders and payment chasing",
          icon: <Bell size={18} strokeWidth={2} />,
          iconBg: "#E6EFFF",
          iconColor: "#2D5BFF",
        },
      ],
    },
  ];

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: FONT,
        color: NAVY,
        paddingBottom: 96,
      }}
    >
      {/* Page header */}
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${CARD_BORDER}`,
          padding: "12px 14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/instructor/settings")}
            aria-label="Back to settings"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#EEF1F6",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: NAVY,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>

          <span
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#E6EFFF",
              color: "#2D5BFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={20} strokeWidth={2} />
          </span>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1.15,
                color: NAVY,
                letterSpacing: "-0.005em",
              }}
            >
              Schedule
            </h1>
            <p
              style={{
                fontSize: 12,
                marginTop: 2,
                color: MUTED,
                lineHeight: 1.3,
              }}
            >
              Working hours, bookings, calendar and reminders
            </p>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div style={{ width: "100%", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 22 }}>
        {groups.map((g) => (
          <section key={g.label}>
            <SectionLabel>{g.label}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {g.cards.map((c) => {
                const section = byId.get(c.sectionId);
                if (!section) return null;
                return (
                  <Card key={c.sectionId}>
                    <CardHeader
                      icon={c.icon}
                      iconBg={c.iconBg}
                      iconColor={c.iconColor}
                      title={c.title}
                      subtitle={c.subtitle}
                    />
                    <div style={{ padding: "12px 14px" }} id={c.sectionId}>
                      {section.render()}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Fixed save bar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#fff",
          borderTop: `1px solid ${CARD_BORDER}`,
          padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
          zIndex: 40,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/instructor/settings")}
          style={{
            width: "100%",
            height: 46,
            borderRadius: 12,
            background: "#2D5BFF",
            color: "#fff",
            border: "none",
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "0 4px",
        marginBottom: 8,
        fontSize: 10.5,
        letterSpacing: "0.12em",
        fontWeight: 600,
        textTransform: "uppercase",
        color: MUTED,
        fontFamily: FONT,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: `1px solid ${CARD_BORDER}`,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderBottom: `1px solid ${CARD_BORDER}`,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: iconBg,
          color: iconColor,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.2, color: NAVY, fontFamily: FONT }}>
          {title}
        </div>
        <p
          style={{
            fontSize: 12,
            marginTop: 2,
            color: MUTED,
            lineHeight: 1.3,
            fontFamily: FONT,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
