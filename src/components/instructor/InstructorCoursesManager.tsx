import { useState, useEffect } from "react";
import { Loader2, Sparkles, Pencil, CheckCircle2, Plus, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyDbError } from "@/lib/supabaseError";
import { CourseOfferDialog } from "@/components/courses/CourseOfferDialog";
import { computeOfferStatus } from "@/lib/courseOffer";
import { BespokeCourseDialog, type BespokeCourse } from "@/components/instructor/BespokeCourseDialog";

interface InstructorCourse {
  id: string;
  course_hours: number;
  course_name: string;
  course_image_url: string | null;
  is_active: boolean;
  offer_active: boolean | null;
  offer_label: string | null;
  offer_percent_off: number | null;
  offer_starts_at: string | null;
  offer_ends_at: string | null;
  discounted_price: number | null;
  is_bespoke?: boolean | null;
}

interface CourseTemplate {
  id: string;
  course_hours: number;
  course_name: string;
  short_description: string | null;
  default_image_url: string | null;
  is_intensive: boolean;
}

interface InstructorCoursesManagerProps {
  instructorId: string;
}

const T = {
  navy: "#0F2044",
  blue: "#1A52A0",
  blueLight: "#E6F1FB",
  red: "#CC2229",
  redLight: "#FBEAEA",
  green: "#1D9E75",
  greenLight: "#E1F5EE",
  mid: "#6B7280",
  muted: "#9CA3AF",
  disabled: "#C4C9D4",
  surface: "#F2F4F8",
  white: "#FFFFFF",
  border: "#DDE3ED",
  purple: "#6E3FD9",
  purpleLight: "#F1ECFB",
};

const COURSE_SELECT =
  "id, course_hours, course_name, course_image_url, is_active, offer_active, offer_label, offer_percent_off, offer_starts_at, offer_ends_at, discounted_price, is_bespoke";

const BESPOKE_SELECT =
  "id, instructor_id, course_name, short_description, course_hours, duration_days, is_intensive, is_active, is_bespoke, price_mode, flat_price, hourly_rate_override, available_weekdays, available_from, available_to";

const WEEKDAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function summariseWeekdays(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return "Any day";
  if (days.length === 7) return "Any day";
  const sorted = [...days].sort();
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  if (sorted.length === 5 && weekdays.every((d) => sorted.includes(d))) return "Weekdays";
  if (sorted.length === 2 && weekend.every((d) => sorted.includes(d))) return "Weekends";
  return sorted.map((d) => WEEKDAY_LABEL[d]).join(", ");
}

function HoursBadge({ hours }: { hours: number | null }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", height: 22,
        padding: "0 8px", borderRadius: 6,
        background: T.blueLight, color: T.blue,
        fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
      }}
    >
      {hours ? `${hours}h` : "—"}
    </span>
  );
}

function TypeBadge({ intensive }: { intensive: boolean }) {
  if (!intensive) return null;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", height: 22,
        padding: "0 8px", borderRadius: 6,
        background: T.redLight, color: T.red,
        fontSize: 11, fontWeight: 600,
      }}
    >
      Intensive
    </span>
  );
}

function OfferButton({
  active, disabled, onClick,
}: { active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        border: `1.5px solid ${active ? "#F5B400" : T.border}`,
        background: active ? "#FFF8E1" : T.white,
        color: active ? "#8A6500" : T.mid,
        fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, fontFamily: "inherit",
      }}
    >
      <Sparkles size={13} />
      {active ? "Edit offer" : "Add offer"}
    </button>
  );
}

function CourseToggle({
  value, disabled, onChange,
}: { value: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: value ? T.blue : T.disabled,
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s", flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          position: "absolute", top: 3, left: value ? 21 : 3,
          width: 18, height: 18, borderRadius: 9,
          background: T.white, boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

function DragHandle() {
  return (
    <div
      aria-hidden
      title="Drag to reorder (coming soon)"
      style={{ display: "flex", flexDirection: "column", gap: 3, cursor: "grab", padding: "0 4px" }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 16, height: 2, background: T.disabled, borderRadius: 1 }} />
      ))}
    </div>
  );
}

export function InstructorCoursesManager({ instructorId }: InstructorCoursesManagerProps) {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingHours, setPendingHours] = useState<number | null>(null);
  const [offerCourseId, setOfferCourseId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [coursesRes, templatesRes, instructorRes] = await Promise.all([
          supabase.from("instructor_courses").select(COURSE_SELECT).eq("instructor_id", instructorId),
          supabase
            .from("course_templates")
            .select("id, course_hours, course_name, short_description, default_image_url, is_intensive")
            .eq("is_active", true)
            .order("course_hours"),
          supabase.from("instructors").select("hourly_rate").eq("id", instructorId).maybeSingle(),
        ]);

        if (coursesRes.error) throw coursesRes.error;
        setCourses((coursesRes.data || []) as InstructorCourse[]);
        setTemplates(templatesRes.data || []);
        setHourlyRate(instructorRes.data?.hourly_rate ?? null);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    })();
  }, [instructorId]);

  const handleToggle = async (template: CourseTemplate, nextActive: boolean) => {
    setPendingHours(template.course_hours);
    const existing = courses.find((c) => c.course_hours === template.course_hours);

    if (existing) {
      setCourses((prev) => prev.map((c) => (c.id === existing.id ? { ...c, is_active: nextActive } : c)));
    } else if (nextActive) {
      setCourses((prev) => [
        ...prev,
        {
          id: `tmp-${template.course_hours}`,
          course_hours: template.course_hours,
          course_name: template.course_name,
          course_image_url: template.default_image_url,
          is_active: true,
          offer_active: false,
          offer_label: null,
          offer_percent_off: null,
          offer_starts_at: null,
          offer_ends_at: null,
          discounted_price: null,
        },
      ]);
    }

    try {
      if (existing) {
        const { error } = await supabase
          .from("instructor_courses")
          .update({ is_active: nextActive })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("instructor_courses")
          .insert({
            instructor_id: instructorId,
            course_hours: template.course_hours,
            course_name: template.course_name,
            is_active: nextActive,
            course_image_url: template.default_image_url,
          })
          .select(COURSE_SELECT)
          .single();
        if (error) throw error;
        setCourses((prev) =>
          prev.map((c) => (c.id === `tmp-${template.course_hours}` ? (data as InstructorCourse) : c))
        );
      }
      toast.success(
        nextActive
          ? `${template.course_name} enabled — pupils can now book it`
          : `${template.course_name} disabled — hidden from pupil search`
      );
    } catch (error) {
      console.error("Error toggling course:", error);
      toast.error(friendlyDbError(error as any, { table: "instructor_courses", operation: "update" }));
      if (existing) {
        setCourses((prev) => prev.map((c) => (c.id === existing.id ? { ...c, is_active: !nextActive } : c)));
      } else {
        setCourses((prev) => prev.filter((c) => c.id !== `tmp-${template.course_hours}`));
      }
    } finally {
      setPendingHours(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No course templates available yet.
      </div>
    );
  }

  const activeCount = courses.filter((c) => c.is_active).length;

  // TODO: add drag-and-drop (no DnD library available in project)
  return (
    <div style={{ fontFamily: "Poppins, inherit" }}>
      {/* Summary banner */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 10,
          background: T.blueLight, marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: T.blue, color: T.white,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <CheckCircle2 size={16} />
        </div>
        <div style={{ fontSize: 13, color: T.navy, lineHeight: 1.4 }}>
          You currently offer{" "}
          <strong style={{ color: T.blue }}>
            {activeCount} active course{activeCount !== 1 ? "s" : ""}
          </strong>{" "}
          — pupils searching your area will only see courses you've enabled.
        </div>
      </div>

      {/* Course list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {templates.map((template) => {
          const existing = courses.find((c) => c.course_hours === template.course_hours);
          const isOn = !!existing?.is_active;
          const isPending = pendingHours === template.course_hours;
          const offer = existing
            ? computeOfferStatus((hourlyRate ?? 0) * template.course_hours, existing)
            : null;
          const isPersisted = !!existing && !existing.id.startsWith("tmp-");
          const basePrice = (hourlyRate ?? 0) * template.course_hours;
          const finalPrice = offer?.isLive ? offer.finalPrice : basePrice;

          const accent = !isOn
            ? T.border
            : template.is_intensive
              ? T.red
              : T.blue;

          return (
            <div
              key={template.id}
              style={{
                position: "relative",
                borderRadius: 12,
                background: T.white,
                border: `1px solid ${T.border}`,
                overflow: "hidden",
                opacity: isOn ? 1 : 0.6,
              }}
            >
              {/* Accent band */}
              <div style={{ height: 3, background: accent }} />

              <div
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                }}
              >
                <DragHandle />

                {/* Course info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 14, fontWeight: 600, color: T.navy,
                        overflow: "hidden", textOverflow: "ellipsis",
                      }}
                    >
                      {template.course_name}
                    </span>
                    <HoursBadge hours={template.course_hours} />
                    <TypeBadge intensive={template.is_intensive} />
                    {offer?.isLive && (
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          height: 22, padding: "0 8px", borderRadius: 6,
                          background: "#FFF4D6", color: "#8A6500",
                          fontSize: 11, fontWeight: 600,
                        }}
                      >
                        <Sparkles size={11} />
                        {offer.label || `${offer.percentOff}% off`}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      marginTop: 4, fontSize: 12,
                      color: isOn ? T.green : T.muted,
                    }}
                  >
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: isOn ? T.green : T.disabled,
                      }}
                    />
                    {isOn ? "Visible to pupils" : "Hidden from pupils"}
                  </div>
                </div>

                {/* Price */}
                {basePrice > 0 && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>
                      £{Math.round(finalPrice).toLocaleString()}
                    </div>
                    {offer?.isLive && (
                      <div style={{ fontSize: 11, color: T.muted, textDecoration: "line-through" }}>
                        £{Math.round(basePrice).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {isPending && <Loader2 size={14} className="animate-spin" style={{ color: T.muted }} />}
                  {isOn && isPersisted && (
                    <OfferButton
                      active={!!offer?.isLive}
                      disabled={!isOn}
                      onClick={() => setOfferCourseId(existing!.id)}
                    />
                  )}
                  {isOn && isPersisted && (
                    <button
                      type="button"
                      aria-label="Edit course"
                      onClick={() => setOfferCourseId(existing!.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 7,
                        border: `1.5px solid ${T.border}`, background: T.white,
                        color: T.muted, display: "inline-flex",
                        alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <CourseToggle
                    value={isOn}
                    disabled={isPending}
                    onChange={(v) => handleToggle(template, v)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {offerCourseId && (() => {
        const c = courses.find((x) => x.id === offerCourseId);
        if (!c) return null;
        return (
          <CourseOfferDialog
            open={!!offerCourseId}
            onOpenChange={(o) => { if (!o) setOfferCourseId(null); }}
            course={{
              id: c.id,
              course_name: c.course_name,
              course_hours: c.course_hours,
              offer_active: c.offer_active,
              offer_label: c.offer_label,
              offer_percent_off: c.offer_percent_off,
              offer_starts_at: c.offer_starts_at,
              offer_ends_at: c.offer_ends_at,
              discounted_price: c.discounted_price,
            }}
            hourlyRate={hourlyRate}
            onSaved={(next) => {
              setCourses((prev) =>
                prev.map((p) => (p.id === next.id ? { ...p, ...next } as InstructorCourse : p))
              );
            }}
          />
        );
      })()}
    </div>
  );
}
