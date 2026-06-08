import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  BookOpen,
  Users,
  RefreshCw,
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
 * (page header, uppercase group labels, card styling) is new.
 *
 * The Payments group uses the same `reminders` section as the Reminders
 * group because payment-chasing controls live inside ReminderSettings;
 * we surface a pointer rather than double-mounting that editor's state.
 */
export function ScheduleMobileLayout({ category }: { category: SettingsCategory }) {
  const navigate = useNavigate();
  const byId = new Map(category.sections.map((s) => [s.id, s]));

  type Group = {
    label: string;
    sectionId: string;
    icon: typeof Clock;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
    pointer?: boolean;
  };

  const groups: Group[] = [
    {
      label: "Working hours",
      sectionId: "hours",
      icon: Clock,
      iconBg: "#DBEAFE",
      iconColor: "#1E40AF",
      title: "Weekly schedule",
      subtitle: "Presets, day-by-day hours and date overrides",
    },
    {
      label: "Lesson settings",
      sectionId: "lesson-length",
      icon: BookOpen,
      iconBg: "#E0F2FE",
      iconColor: "#0369A1",
      title: "Lessons you offer",
      subtitle: "Lengths, default duration, buffer and bank holidays",
    },
    {
      label: "Pupil booking",
      sectionId: "self-service",
      icon: Users,
      iconBg: "#ECFDF5",
      iconColor: "#059669",
      title: "Self-service booking",
      subtitle: "What pupils can do without contacting you",
    },
    {
      label: "Calendar sync",
      sectionId: "calendar",
      icon: RefreshCw,
      iconBg: "#EDF2FE",
      iconColor: "#1A52A0",
      title: "Calendars",
      subtitle: "Subscribe in Google / Apple / Outlook and block from personal calendars",
    },
    {
      label: "Reminders & notifications",
      sectionId: "reminders",
      icon: Bell,
      iconBg: "#FEF3C7",
      iconColor: "#92400E",
      title: "Reminders",
      subtitle: "Email, SMS and push reminders for pupils",
    },
    {
      label: "Payments",
      sectionId: "reminders",
      icon: CreditCard,
      iconBg: "#FEE2E2",
      iconColor: "#B91C1C",
      title: "Payment chasing",
      subtitle: "Automatically remind pupils about outstanding payments",
      pointer: true,
    },
  ];

  return (
    <div className="pb-24" style={{ paddingTop: 4 }}>
      {/* Back chevron */}
      <button
        type="button"
        onClick={() => navigate("/instructor/settings")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        style={{ marginBottom: 12 }}
      >
        <ChevronLeft className="h-4 w-4" /> Settings
      </button>

      {/* Page header */}
      <header
        style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#DBEAFE",
            color: "#1E40AF",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Calendar className="h-5 w-5" />
        </span>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.15,
              color: "var(--foreground, #1a1a1f)",
            }}
          >
            Schedule
          </h1>
          <p
            style={{
              fontSize: 13,
              marginTop: 2,
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Working hours, bookings, calendar and reminders
          </p>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {groups.map((g, idx) => {
          const section = byId.get(g.sectionId);
          if (!section) return null;
          const Icon = g.icon;
          return (
            <section key={`${g.label}-${idx}`}>
              <SectionLabel>{g.label}</SectionLabel>
              <Card>
                <CardHeader
                  icon={<Icon className="h-4 w-4" />}
                  iconBg={g.iconBg}
                  iconColor={g.iconColor}
                  title={g.title}
                  subtitle={g.subtitle}
                />
                {g.pointer ? (
                  <div
                    style={{
                      padding: "0 16px 16px",
                      marginTop: -4,
                      fontSize: 13,
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    Auto-chase, frequency and stop-after limits are configured in the
                    <span style={{ fontWeight: 600, color: "var(--foreground, #1a1a1f)" }}>
                      {" "}Reminders{" "}
                    </span>
                    card above.
                  </div>
                ) : (
                  <div style={{ padding: "0 16px 16px", marginTop: -4 }}>
                    {section.render()}
                  </div>
                )}
              </Card>
            </section>
          );
        })}
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
        fontSize: 11,
        letterSpacing: "0.08em",
        fontWeight: 700,
        textTransform: "uppercase",
        color: "hsl(var(--muted-foreground))",
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
        borderRadius: 16,
        border: "0.5px solid hsl(var(--border) / 0.7)",
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
        alignItems: "flex-start",
        gap: 12,
        padding: "16px 16px 12px",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
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
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.15 }}>{title}</div>
        <p
          style={{
            fontSize: 12,
            marginTop: 2,
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
