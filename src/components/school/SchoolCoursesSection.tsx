import { useState } from "react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, GraduationCap, Clock, PoundSterling, Loader2, Zap, Star } from "lucide-react";
import { toast } from "sonner";
import { demoSchoolCourses, demoSchoolInstructors } from "@/data/demoSchoolData";

interface SchoolCoursesSectionProps {
  schoolId: string;
  instructorIds: string[];
}

interface CourseForm {
  course_name: string;
  course_hours: number;
  price: number;
  discounted_price: number | null;
  description: string;
  features: string;
  is_intensive: boolean;
  is_popular: boolean;
  is_active: boolean;
  instructor_ids: string[];
}

const emptyForm: CourseForm = {
  course_name: "",
  course_hours: 10,
  price: 0,
  discounted_price: null,
  description: "",
  features: "",
  is_intensive: false,
  is_popular: false,
  is_active: true,
  instructor_ids: [],
};

export default function SchoolCoursesSection({ schoolId, instructorIds }: SchoolCoursesSectionProps) {
  const { isDemo } = useSchoolDemo();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyForm);

  // Fetch instructors for assignment
  const { data: instructors = [] } = useQuery({
    queryKey: ["school-instructors-for-courses", instructorIds],
    queryFn: async () => {
      if (isDemo) return demoSchoolInstructors.map(i => ({ id: i.instructor_id, name: i.instructors.name }));
      if (!instructorIds.length) return [];
      const { data } = await supabase.from("instructors").select("id, name").in("id", instructorIds);
      return data || [];
    },
  });

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["school-courses", schoolId],
    queryFn: async () => {
      if (isDemo) return demoSchoolCourses;
      const { data } = await supabase
        .from("school_courses")
        .select("*, school_course_instructors(instructor_id)")
        .eq("school_id", schoolId)
        .order("display_order");
      return (data || []).map((c: any) => ({
        ...c,
        assigned_instructor_ids: (c.school_course_instructors || []).map((sci: any) => sci.instructor_id),
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: CourseForm & { id?: string }) => {
      if (isDemo) { toast.info("Demo mode – changes not saved"); return; }
      const courseData = {
        school_id: schoolId,
        course_name: f.course_name,
        course_hours: f.course_hours,
        price: f.price,
        discounted_price: f.discounted_price,
        description: f.description || null,
        features: f.features ? f.features.split("\n").map(s => s.trim()).filter(Boolean) : null,
        is_intensive: f.is_intensive,
        is_popular: f.is_popular,
        is_active: f.is_active,
      };

      let courseId = f.id;
      if (courseId) {
        await supabase.from("school_courses").update(courseData).eq("id", courseId);
      } else {
        const { data } = await supabase.from("school_courses").insert(courseData).select("id").single();
        courseId = data?.id;
      }
      if (!courseId) throw new Error("Failed to save course");

      // Sync instructors
      await supabase.from("school_course_instructors").delete().eq("school_course_id", courseId);
      if (f.instructor_ids.length) {
        await supabase.from("school_course_instructors").insert(
          f.instructor_ids.map(iid => ({ school_course_id: courseId!, instructor_id: iid }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-courses"] });
      setDialogOpen(false);
      toast.success(editingId ? "Course updated" : "Course created");
    },
    onError: () => toast.error("Failed to save course"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) { toast.info("Demo mode"); return; }
      await supabase.from("school_courses").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-courses"] });
      toast.success("Course deleted");
    },
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      course_name: c.course_name,
      course_hours: c.course_hours,
      price: c.price,
      discounted_price: c.discounted_price,
      description: c.description || "",
      features: (c.features || []).join("\n"),
      is_intensive: c.is_intensive,
      is_popular: c.is_popular,
      is_active: c.is_active,
      instructor_ids: c.assigned_instructor_ids || [],
    });
    setDialogOpen(true);
  };

  const toggleInstructor = (id: string) => {
    setForm(f => ({
      ...f,
      instructor_ids: f.instructor_ids.includes(id)
        ? f.instructor_ids.filter(x => x !== id)
        : [...f.instructor_ids, id],
    }));
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Courses</h2>
          <p className="text-sm text-muted-foreground">Manage your school's course catalog</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Course</Button>
      </div>

      {courses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No courses yet. Create your first course to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c: any) => (
            <Card key={c.id} className={`relative ${!c.is_active ? "opacity-60" : ""}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{c.course_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{c.course_hours}h</span>
                      <span className="flex items-center gap-1">
                        <PoundSterling className="h-3.5 w-3.5" />
                        {c.discounted_price ? (
                          <><s className="text-muted-foreground/60">£{c.price}</s> £{c.discounted_price}</>
                        ) : `£${c.price}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {c.is_intensive && <Badge variant="secondary" className="text-xs"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
                  {c.is_popular && <Badge variant="secondary" className="text-xs"><Star className="h-3 w-3 mr-1" />Popular</Badge>}
                  {!c.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                </div>

                {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}

                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><GraduationCap className="h-3 w-3" />Assigned Instructors</p>
                  <div className="flex flex-wrap gap-1">
                    {(c.assigned_instructor_ids || []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">None assigned</span>
                    ) : (
                      (c.assigned_instructor_ids || []).map((iid: string) => {
                        const inst = instructors.find((i: any) => i.id === iid);
                        return <Badge key={iid} variant="outline" className="text-xs">{inst?.name || "Unknown"}</Badge>;
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Course Name</Label>
              <Input value={form.course_name} onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))} placeholder="e.g. 10 Hour Course" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hours</Label>
                <Input type="number" min={1} value={form.course_hours} onChange={e => setForm(f => ({ ...f, course_hours: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Price (£)</Label>
                <Input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Discounted Price (£) — optional</Label>
              <Input type="number" min={0} step={0.01} value={form.discounted_price ?? ""} onChange={e => setForm(f => ({ ...f, discounted_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Leave blank for no discount" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <Textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} rows={3} placeholder="Free re-test if you fail&#10;Theory test access included" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_intensive} onCheckedChange={v => setForm(f => ({ ...f, is_intensive: v }))} />Intensive</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} />Popular</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />Active</label>
            </div>
            <div className="space-y-1.5">
              <Label>Assign Instructors</Label>
              <div className="flex flex-wrap gap-2">
                {instructors.map((inst: any) => (
                  <Badge
                    key={inst.id}
                    variant={form.instructor_ids.includes(inst.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleInstructor(inst.id)}
                  >
                    {inst.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.course_name || !form.price || saveMutation.isPending}
              onClick={() => saveMutation.mutate({ ...form, id: editingId || undefined })}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingId ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
