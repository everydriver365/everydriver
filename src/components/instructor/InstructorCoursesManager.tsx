import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstructorCourse {
  id: string;
  course_hours: number;
  course_name: string;
  course_image_url: string | null;
  is_active: boolean;
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
  const [loading, setLoading] = useState(true);
  const [pendingHours, setPendingHours] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [coursesRes, templatesRes] = await Promise.all([
          supabase
            .from("instructor_courses")
            .select("id, course_hours, course_name, course_image_url, is_active")
            .eq("instructor_id", instructorId),
          supabase
            .from("course_templates")
            .select("id, course_hours, course_name, short_description, default_image_url, is_intensive")
            .eq("is_active", true)
            .order("course_hours"),
        ]);

        if (coursesRes.error) throw coursesRes.error;
        setCourses(coursesRes.data || []);
        setTemplates(templatesRes.data || []);
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
          .select("id, course_hours, course_name, course_image_url, is_active")
          .single();
        if (error) throw error;
        setCourses(prev => prev.map(c =>
          c.id === `tmp-${template.course_hours}` ? data : c
        ));
      }
      toast.success(
        nextActive
          ? `${template.course_name} enabled — pupils can now book it`
          : `${template.course_name} disabled — hidden from pupil search`
      );
    } catch (error) {
      console.error("Error toggling course:", error);
      toast.error("Failed to update course");
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
                    </div>
                    <p className={`text-xs mt-1 ${isOn ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {isOn ? "Visible to pupils" : "Hidden from pupils"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
    </div>
  );
}
