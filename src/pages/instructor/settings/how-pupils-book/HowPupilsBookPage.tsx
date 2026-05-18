import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyDbError } from "@/lib/supabaseError";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import {
  BackLink, Breadcrumb, PageHeaderCard, AddButton, SaveButton,
} from "@/components/settings/courses/PageChrome";
import { CoursesSection } from "@/components/settings/courses/CoursesSection";
import { tokens, type CourseRow } from "@/components/settings/courses/tokens";
import { BespokeCourseDialog, type BespokeCourse } from "@/components/instructor/BespokeCourseDialog";

const COURSE_SELECT =
  "id, course_hours, course_name, short_description, duration_days, available_weekdays, available_from, available_to, is_active, offer_active, discounted_price, is_bespoke, is_intensive, price_mode, flat_price, hourly_rate_override, display_order, created_at";

interface InstructorCourseRow {
  id: string;
  course_hours: number;
  course_name: string;
  short_description: string | null;
  duration_days: number | null;
  available_weekdays: number[] | null;
  available_from: string | null;
  available_to: string | null;
  is_active: boolean;
  offer_active: boolean | null;
  discounted_price: number | null;
  is_bespoke: boolean | null;
  is_intensive: boolean | null;
  price_mode: string | null;
  flat_price: number | null;
  hourly_rate_override: number | null;
  display_order: number | null;
  created_at: string;
}

interface TemplateRow {
  course_hours: number;
  is_intensive: boolean;
}

function classifyType(hours: number, intensive: boolean): CourseRow["type"] {
  if (intensive) return "intensive";
  if (hours >= 10) return "semi_intensive";
  return "weekly";
}

function priceFor(c: InstructorCourseRow, hourlyRate: number | null): number | null {
  if (c.is_bespoke) {
    if (c.price_mode === "flat" && c.flat_price != null) return Math.round(c.flat_price);
    const rate = c.hourly_rate_override ?? hourlyRate;
    if (rate != null) return Math.round(rate * c.course_hours);
    return null;
  }
  if (c.discounted_price != null && c.offer_active) return Math.round(c.discounted_price);
  if (hourlyRate != null) return Math.round(hourlyRate * c.course_hours);
  return null;
}

export default function HowPupilsBookPage() {
  const navigate = useNavigate();
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [rawCourses, setRawCourses] = useState<InstructorCourseRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BespokeCourse | null>(null);

  const loadCourses = useCallback(async (iid: string, rate: number | null) => {
    const [coursesRes, templatesRes] = await Promise.all([
      supabase.from("instructor_courses").select(COURSE_SELECT).eq("instructor_id", iid),
      supabase.from("course_templates").select("course_hours, is_intensive").eq("is_active", true),
    ]);
    if (coursesRes.error) throw coursesRes.error;

    const tplByHours = new Map<number, TemplateRow>();
    (templatesRes.data || []).forEach((t) => tplByHours.set(t.course_hours, t));

    const raw = (coursesRes.data || []) as InstructorCourseRow[];
    setRawCourses(raw);

    const rows = raw
      .map((c, idx) => {
        const intensive = c.is_bespoke
          ? !!c.is_intensive
          : !!tplByHours.get(c.course_hours)?.is_intensive;
        return {
          id: c.id,
          name: c.course_name,
          hours: c.course_hours,
          type: classifyType(c.course_hours, intensive),
          transmission: null,
          price: priceFor(c, rate),
          priceSubLabel: null,
          visible: c.is_active,
          hasOffer: !!c.offer_active,
          order: c.display_order ?? idx,
        } as CourseRow;
      })
      .sort((a, b) => a.order - b.order)
      .map((c, i) => ({ ...c, order: i }));

    setCourses(rows);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Not signed in"); return; }
        const { data: idRow } = await supabase.rpc("get_instructor_id_for_user", { p_user_id: user.id });
        const iid = idRow as unknown as string | null;
        if (!iid) { setError("Instructor profile not found"); return; }
        setInstructorId(iid);

        const instructorRes = await supabase.from("instructors").select("hourly_rate").eq("id", iid).maybeSingle();
        const rate = instructorRes.data?.hourly_rate ?? null;
        setHourlyRate(rate);

        await loadCourses(iid, rate);
      } catch (e: any) {
        console.error(e);
        setError(friendlyDbError(e, { table: "instructor_courses", operation: "select" }));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadCourses]);

  const activeCount = useMemo(() => courses.filter((c) => c.visible).length, [courses]);

  const handleToggle = (id: string) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
    setIsDirty(true);
  };

  const handleReorder = (next: CourseRow[]) => {
    setCourses(next);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!instructorId) return;
    setSaving(true);
    try {
      // Send the full array — one update per course with new visible + order.
      const updates = courses.map((c) =>
        supabase
          .from("instructor_courses")
          .update({ is_active: c.visible, display_order: c.order })
          .eq("id", c.id)
          .eq("instructor_id", instructorId)
      );
      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
      toast.success("Course settings saved");
      setIsDirty(false);
    } catch (e: any) {
      toast.error(friendlyDbError(e, { table: "instructor_courses", operation: "update" }));
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/instructor" },
    { label: "Settings", href: "/instructor/settings" },
    { label: "Pupils & bookings", href: "/instructor/settings" },
    { label: "How pupils book", active: true },
  ];

  return (
    <InstructorPortalLayout>
      <div style={{ padding: "32px 40px", fontFamily: "Poppins, inherit", maxWidth: 1100, margin: "0 auto" }}>
        <BackLink onPress={() => navigate("/instructor/settings")} />
        <Breadcrumb items={breadcrumbItems} onNavigate={(href) => navigate(href)} />

        <PageHeaderCard
          title="How pupils book"
          subtitle="Choose the courses, prices and rules pupils see when booking with you."
          actions={
            <>
              <AddButton onPress={() => { setEditing(null); setDialogOpen(true); }} />
              <SaveButton isDirty={isDirty} saving={saving} onPress={handleSave} />
            </>
          }
        />

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 className="animate-spin" style={{ color: tokens.muted }} />
          </div>
        ) : error ? (
          <div
            style={{
              marginTop: 24, padding: 16, borderRadius: 12,
              background: tokens.redLight, color: tokens.red, fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : (
          <CoursesSection
            courses={courses}
            activeCount={activeCount}
            onToggle={handleToggle}
            onReorder={handleReorder}
            onEdit={(id) => {
              const raw = rawCourses.find((c) => c.id === id);
              if (!raw || !instructorId) return;
              setEditing({
                id: raw.id,
                instructor_id: instructorId,
                course_name: raw.course_name,
                short_description: raw.short_description,
                course_hours: raw.course_hours,
                duration_days: raw.duration_days,
                is_intensive: !!raw.is_intensive,
                is_active: raw.is_active,
                is_bespoke: !!raw.is_bespoke,
                price_mode: (raw.price_mode as "flat" | "hourly" | "template") ?? "template",
                flat_price: raw.flat_price,
                hourly_rate_override: raw.hourly_rate_override,
                available_weekdays: raw.available_weekdays,
                available_from: raw.available_from,
                available_to: raw.available_to,
              });
              setDialogOpen(true);
            }}
            onOffer={(id) => { /* offer flow: open edit for now */
              const raw = rawCourses.find((c) => c.id === id);
              if (!raw || !instructorId) return;
              setEditing({
                id: raw.id,
                instructor_id: instructorId,
                course_name: raw.course_name,
                short_description: raw.short_description,
                course_hours: raw.course_hours,
                duration_days: raw.duration_days,
                is_intensive: !!raw.is_intensive,
                is_active: raw.is_active,
                is_bespoke: !!raw.is_bespoke,
                price_mode: (raw.price_mode as "flat" | "hourly" | "template") ?? "template",
                flat_price: raw.flat_price,
                hourly_rate_override: raw.hourly_rate_override,
                available_weekdays: raw.available_weekdays,
                available_from: raw.available_from,
                available_to: raw.available_to,
              });
              setDialogOpen(true);
            }}
          />
        )}

        {instructorId && (
          <BespokeCourseDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            instructorId={instructorId}
            hourlyRate={hourlyRate}
            initial={editing}
            onSaved={async () => { if (instructorId) await loadCourses(instructorId, hourlyRate); }}
            onDeleted={async () => { if (instructorId) await loadCourses(instructorId, hourlyRate); }}
          />
          />
        )}
      </div>
    </InstructorPortalLayout>
  );
}
