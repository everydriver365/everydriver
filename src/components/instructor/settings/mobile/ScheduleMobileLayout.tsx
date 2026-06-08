import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calendar } from "lucide-react";
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
    pointer?: boolean;
  };

  const groups: Group[] = [
    { label: "Working hours", sectionId: "hours" },
    { label: "Lesson settings", sectionId: "lesson-length" },
    { label: "Pupil booking", sectionId: "self-service" },
    { label: "Calendar sync", sectionId: "calendar" },
    { label: "Reminders & notifications", sectionId: "reminders" },
  ];


  return (
    <div
      className="px-1.5 pb-24"
      style={{
        background: "#F4F7F6",
        paddingTop: 8,
        paddingBottom: 96,
        minHeight: "calc(100vh - 56px)",
      }}
    >
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
        style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#DBEAFE",
            color: "#1E40AF",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Calendar className="h-6 w-6" />
        </span>
        <div style={{ minWidth: 0, paddingTop: 2 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "#0F172A",
            }}
          >
            Schedule
          </h1>
          <p
            style={{
              fontSize: 13,
              marginTop: 3,
              color: "#6B7280",
            }}
          >
            Working hours, bookings, calendar and reminders
          </p>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {groups.map((g, idx) => {
          if (g.pointer) return null;
          const section = byId.get(g.sectionId);
          if (!section) return null;
          return (
            <section key={`${g.label}-${idx}`}>
              <SectionLabel>{g.label}</SectionLabel>
              <Card>
                <div style={{ padding: "12px 10px" }} id={g.sectionId}>
                  {section.render()}
                </div>
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
        marginBottom: 10,
        fontSize: 11,
        letterSpacing: "0.1em",
        fontWeight: 700,
        textTransform: "uppercase",
        color: "#6B7280",
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
        border: "0.5px solid rgba(15,23,42,0.08)",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
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
        padding: "14px 16px",
        borderBottom: "0.5px solid rgba(15,23,42,0.06)",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
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
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2, color: "#0F172A" }}>
          {title}
        </div>
        <p
          style={{
            fontSize: 12,
            marginTop: 2,
            color: "#6B7280",
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
