import { ReactNode } from "react";
import { Calendar, Clock, BookOpen, Users, RefreshCw, Bell, CreditCard } from "lucide-react";
import { useAreaSections, type AreaItem } from "./areas";

/**
 * Bespoke layout for the "Schedule" (working-hours) settings area.
 *
 * Visual-only redesign: keeps every existing editor and its logic intact, but
 * presents them inside the labelled card structure described in the brief.
 *
 *   - Custom page header (calendar tile + Schedule + subtitle)
 *   - Small uppercase muted labels above each card
 *   - White cards, hairline 0.5px border, 16px radius
 *
 * Section -> editor mapping (existing components are reused verbatim):
 *   Working hours              -> hours        (WorkingHoursEditor)
 *   Lesson settings            -> lesson-length(LessonLengthBufferEditor)
 *   Pupil booking              -> self-service (PupilBookingSettingsEditor)
 *   Calendar sync              -> calendar     (IcsCalendarSync)
 *   Reminders & notifications  -> reminders    (ReminderSettings — includes
 *                                               instructor features + payment
 *                                               chasing controls)
 */
export function ScheduleAreaLayout({ item }: { item: AreaItem }) {
  const sections = useAreaSections(item);
  const byId = new Map(sections.map(s => [s.id, s]));

  const groups: Array<{
    label: string;
    sectionId: string;
    icon: typeof Clock;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
  }> = [
    {
      label: "Working hours",
      sectionId: "hours",
      icon: Clock,
      iconBg: "#DBEAFE",
      iconColor: "#1E40AF",
      title: "Weekly schedule",
      subtitle: "Presets, day-by-day hours and one-off date overrides",
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
      sectionId: "reminders", // payment chasing lives inside ReminderSettings
      icon: CreditCard,
      iconBg: "#FEE2E2",
      iconColor: "#B91C1C",
      title: "Payment chasing",
      subtitle: "Automatically remind pupils about outstanding payments",
      hideBody: true,
    } as any,
  ];

  return (
    <>
      {/* Page header */}
      <header className="mb-5 flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center shrink-0"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#DBEAFE",
            color: "#1E40AF",
          }}
        >
          <Calendar className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Working hours, bookings, calendar and reminders
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {groups.map((g, idx) => {
          const section = byId.get(g.sectionId);
          if (!section) return null;
          const Icon = g.icon;
          const hideBody = (g as any).hideBody;
          // For the Payments group, we render the label + a soft pointer card
          // that explains the controls live inside the Reminders card above —
          // we do not duplicate the editor (avoids double-mounting state).
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
                {hideBody ? (
                  <div className="px-5 pb-5 -mt-1 text-sm text-muted-foreground">
                    Auto-chase, frequency and stop-after limits are configured in the
                    <span className="font-medium text-foreground"> Reminders</span> card above.
                  </div>
                ) : (
                  <div className="px-5 pb-5 -mt-1">{section.render()}</div>
                )}
              </Card>
            </section>
          );
        })}
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-1 mb-2"
      style={{
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
      className="bg-card"
      style={{
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
    <div className="flex items-start gap-3 p-5 pb-4">
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold leading-tight">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
