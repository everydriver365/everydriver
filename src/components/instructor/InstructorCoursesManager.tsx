import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyDbError } from "@/lib/supabaseError";
import { CourseOfferDialog, type CourseOfferRow } from "@/components/courses/CourseOfferDialog";
import { computeOfferStatus } from "@/lib/courseOffer";

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

export function InstructorCoursesManager({ instructorId }: InstructorCoursesManagerProps) {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingHours, setPendingHours] = useState<number | null>(null);
  const [offerCourseId, setOfferCourseId] = useState<string | null>(null);

  const COURSE_SELECT =
    "id, course_hours, course_name, course_image_url, is_active, offer_active, offer_label, offer_percent_off, offer_starts_at, offer_ends_at, discounted_price";

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [coursesRes, templatesRes, instructorRes] = await Promise.all([
          supabase
            .from("instructor_courses")
            .select(COURSE_SELECT)
            .eq("instructor_id", instructorId),
          supabase
            .from("course_templates")
            .select("id, course_hours, course_name, short_description, default_image_url, is_intensive")
            .eq("is_active", true)
            .order("course_hours"),
          supabase
            .from("instructors")
            .select("hourly_rate")
            .eq("id", instructorId)
            .maybeSingle(),
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
    const existing = courses.find(c => c.course_hours === template.course_hours);

    // Optimistic update
    if (existing) {
      setCourses(prev => prev.map(c => c.id === existing.id ? { ...c, is_active: nextActive } : c));
    } else if (nextActive) {
      setCourses(prev => [...prev, {
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
      }]);
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
        setCourses(prev => prev.map(c =>
          c.id === `tmp-${template.course_hours}` ? (data as InstructorCourse) : c
        ));
      }
      toast.success(
        nextActive
          ? `${template.course_name} enabled — pupils can now book it`
          : `${template.course_name} disabled — hidden from pupil search`
      );
    } catch (error) {
      console.error("Error toggling course:", error);
      toast.error(friendlyDbError(error as any, { table: "instructor_courses", operation: "update" }));
      // Revert
      if (existing) {
        setCourses(prev => prev.map(c => c.id === existing.id ? { ...c, is_active: !nextActive } : c));
      } else {
        setCourses(prev => prev.filter(c => c.id !== `tmp-${template.course_hours}`));
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

  const activeCount = courses.filter(c => c.is_active).length;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/40 p-3">
        <p className="text-sm font-medium">
          You currently offer {activeCount} course{activeCount === 1 ? "" : "s"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pupils searching your area will only see courses you've enabled below.
        </p>
      </div>
      <div className="space-y-2">
        {templates.map(template => {
          const existing = courses.find(c => c.course_hours === template.course_hours);
          const isOn = !!existing?.is_active;
          const isPending = pendingHours === template.course_hours;
          const offer = existing
            ? computeOfferStatus((hourlyRate ?? 0) * template.course_hours, existing)
            : null;
          const isPersisted = !!existing && !existing.id.startsWith("tmp-");

          return (
            <Card key={template.id} className={!isOn ? "opacity-70" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{template.course_name}</span>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {template.course_hours}h
                      </Badge>
                      {template.is_intensive && (
                        <Badge variant="outline" className="flex-shrink-0">Intensive</Badge>
                      )}
                      {offer?.isLive && (
                        <Badge className="flex-shrink-0 border-0 bg-amber-500 text-white gap-1">
                          <Sparkles className="h-3 w-3" />
                          {offer.label || `${offer.percentOff}% off`}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isOn ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {isOn ? "Visible to pupils" : "Hidden from pupils"}
                      {offer?.isLive && (
                        <span className="ml-2 text-muted-foreground">
                          · Was £{offer.basePrice.toFixed(0)} → £{offer.finalPrice.toFixed(0)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {isOn && isPersisted && (
                      <Button
                        size="sm"
                        variant={offer?.isLive ? "default" : "outline"}
                        className={offer?.isLive ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                        onClick={() => setOfferCourseId(existing!.id)}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        {offer?.isLive ? "Edit offer" : "Add offer"}
                      </Button>
                    )}
                    <Switch
                      checked={isOn}
                      disabled={isPending}
                      onCheckedChange={(checked) => handleToggle(template, checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {offerCourseId && (() => {
        const c = courses.find(x => x.id === offerCourseId);
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
              setCourses(prev => prev.map(p => p.id === next.id ? { ...p, ...next } as InstructorCourse : p));
            }}
          />
        );
      })()}
    </div>
  );
}

