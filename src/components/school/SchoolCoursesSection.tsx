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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, GraduationCap, Clock, PoundSterling, Loader2, Zap, Star,
  Upload, X, Video, FileText, Backpack, AlertCircle, CreditCard, ScrollText
} from "lucide-react";
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
  short_description: string;
  full_description: string;
  features: string[];
  what_to_bring: string[];
  prerequisites: string[];
  course_image_url: string | null;
  explainer_video_url: string | null;
  theory_test_details: string;
  driving_test_details: string;
  payment_terms: string;
  terms_conditions: string;
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
  short_description: "",
  full_description: "",
  features: [],
  what_to_bring: [],
  prerequisites: [],
  course_image_url: null,
  explainer_video_url: null,
  theory_test_details: "",
  driving_test_details: "",
  payment_terms: "",
  terms_conditions: "",
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
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const { data: instructors = [] } = useQuery({
    queryKey: ["school-instructors-for-courses", instructorIds],
    queryFn: async () => {
      if (isDemo) return demoSchoolInstructors.map(i => ({ id: i.instructor_id, name: i.instructors.name }));
      if (!instructorIds.length) return [];
      const { data } = await supabase.from("instructors").select("id, name").in("id", instructorIds);
      return data || [];
    },
  });

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
        short_description: f.short_description || null,
        full_description: f.full_description || null,
        features: f.features.filter(Boolean).length ? f.features.filter(Boolean) : null,
        what_to_bring: f.what_to_bring.filter(Boolean).length ? f.what_to_bring.filter(Boolean) : null,
        prerequisites: f.prerequisites.filter(Boolean).length ? f.prerequisites.filter(Boolean) : null,
        course_image_url: f.course_image_url,
        explainer_video_url: f.explainer_video_url || null,
        theory_test_details: f.theory_test_details || null,
        driving_test_details: f.driving_test_details || null,
        payment_terms: f.payment_terms || null,
        terms_conditions: f.terms_conditions || null,
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
      short_description: c.short_description || "",
      full_description: c.full_description || "",
      features: c.features || [],
      what_to_bring: c.what_to_bring || [],
      prerequisites: c.prerequisites || [],
      course_image_url: c.course_image_url || null,
      explainer_video_url: c.explainer_video_url || null,
      theory_test_details: c.theory_test_details || "",
      driving_test_details: c.driving_test_details || "",
      payment_terms: c.payment_terms || "",
      terms_conditions: c.terms_conditions || "",
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

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }

    const fileExt = file.name.split(".").pop();
    const fileName = `school-course-${schoolId}-${Date.now()}.${fileExt}`;
    const filePath = `school-courses/${fileName}`;

    const { error } = await supabase.storage.from("instructor-images").upload(filePath, file);
    if (error) { toast.error("Failed to upload image"); return; }

    const { data: urlData } = supabase.storage.from("instructor-images").getPublicUrl(filePath);
    setForm(f => ({ ...f, course_image_url: urlData.publicUrl }));
    toast.success("Image uploaded");
  };

  // Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error("Video must be less than 100MB"); return; }

    setUploadingVideo(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `school-explainer-${schoolId}-${Date.now()}.${fileExt}`;
    const filePath = `school-explainers/${fileName}`;

    const { error } = await supabase.storage.from("course-videos").upload(filePath, file);
    if (error) { toast.error("Failed to upload video"); setUploadingVideo(false); return; }

    const { data: urlData } = supabase.storage.from("course-videos").getPublicUrl(filePath);
    setForm(f => ({ ...f, explainer_video_url: urlData.publicUrl }));
    toast.success("Video uploaded");
    setUploadingVideo(false);
  };

  // Array field helpers
  const addArrayItem = (field: 'features' | 'what_to_bring' | 'prerequisites') => {
    setForm(f => ({ ...f, [field]: [...f[field], ""] }));
  };
  const updateArrayItem = (field: 'features' | 'what_to_bring' | 'prerequisites', index: number, value: string) => {
    setForm(f => {
      const arr = [...f[field]];
      arr[index] = value;
      return { ...f, [field]: arr };
    });
  };
  const removeArrayItem = (field: 'features' | 'what_to_bring' | 'prerequisites', index: number) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
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
          {courses.map((c: any) => {
            const imgUrl = c.course_image_url || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop";
            const hasDiscount = c.discounted_price && c.discounted_price < c.price;
            return (
              <Card key={c.id} className={`overflow-hidden group ${!c.is_active ? "opacity-60" : ""}`}>
                {/* Image header */}
                <div className="relative">
                  <img src={imgUrl} alt={c.course_name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                    <div className="text-white">
                      <div className="flex gap-1.5 mb-1">
                        {c.is_popular && <Badge className="bg-emerald-500/90 border-0 text-white text-[10px]">Popular</Badge>}
                        {c.is_intensive && <Badge className="bg-amber-500/90 border-0 text-white text-[10px]"><Zap className="h-3 w-3 mr-0.5" />Intensive</Badge>}
                        {hasDiscount && <Badge className="bg-red-500/90 border-0 text-white text-[10px]">Save £{(c.price - c.discounted_price).toFixed(0)}</Badge>}
                        {!c.is_active && <Badge className="bg-muted/80 border-0 text-white text-[10px]">Inactive</Badge>}
                      </div>
                      <h3 className="text-lg font-black">{c.course_name}</h3>
                    </div>
                  </div>
                  {/* Edit / Delete overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                {/* Info bar */}
                <div className="p-3 bg-primary text-primary-foreground">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 opacity-70" />{c.course_hours}hrs</span>
                    </div>
                    <div className="text-right">
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black">£{c.discounted_price}</span>
                          <span className="text-xs line-through opacity-50">£{c.price}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-black">£{c.price}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom content */}
                <CardContent className="p-3 space-y-2">
                  {(c.short_description || c.description) && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.short_description || c.description}</p>
                  )}
                  {(c.features || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(c.features as string[]).slice(0, 3).map((f: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                      ))}
                      {(c.features as string[]).length > 3 && <Badge variant="outline" className="text-[10px]">+{(c.features as string[]).length - 3} more</Badge>}
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><GraduationCap className="h-3 w-3" />Instructors</p>
                    <div className="flex flex-wrap gap-1">
                      {(c.assigned_instructor_ids || []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">None assigned</span>
                      ) : (
                        (c.assigned_instructor_ids || []).map((iid: string) => {
                          const inst = instructors.find((i: any) => i.id === iid);
                          return <Badge key={iid} variant="outline" className="text-[10px]">{inst?.name || "Unknown"}</Badge>;
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Course Editor Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Course" : "Create Course"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update this course's details and settings" : "Set up a new course for your school"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Course Image</Label>
              <div className="flex gap-4">
                <div className="relative aspect-video w-48 rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                  {form.course_image_url ? (
                    <>
                      <img src={form.course_image_url} alt="Course" className="h-full w-full object-cover" />
                      <Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => setForm(f => ({ ...f, course_image_url: null }))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">This image will be shown on course cards and the booking page.</p>
                </div>
              </div>
            </div>

            {/* Name & Hours */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Course Name</Label>
                <Input value={form.course_name} onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))} placeholder="e.g. 10 Hour Starter Course" />
              </div>
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input type="number" min={1} value={form.course_hours} onChange={e => setForm(f => ({ ...f, course_hours: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price (£)</Label>
                <Input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Discounted Price (£)</Label>
                <Input type="number" min={0} step={0.01} value={form.discounted_price ?? ""} onChange={e => setForm(f => ({ ...f, discounted_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Optional" />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Textarea value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Brief description shown on course cards" rows={2} />
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <Label>Full Description</Label>
              <Textarea value={form.full_description} onChange={e => setForm(f => ({ ...f, full_description: e.target.value }))} placeholder="Detailed description shown on booking page" rows={4} />
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features Included</Label>
              <div className="space-y-2">
                {form.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={feature} onChange={e => updateArrayItem('features', index, e.target.value)} placeholder="e.g., Pick-up from home" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('features', index)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('features')} className="gap-1"><Plus className="h-3 w-3" />Add Feature</Button>
              </div>
            </div>

            {/* What to Bring */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Backpack className="h-4 w-4" />What to Bring</Label>
              <div className="space-y-2">
                {form.what_to_bring.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={item} onChange={e => updateArrayItem('what_to_bring', index, e.target.value)} placeholder="e.g., Provisional driving licence" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('what_to_bring', index)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('what_to_bring')} className="gap-1"><Plus className="h-3 w-3" />Add Item</Button>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />Prerequisites</Label>
              <div className="space-y-2">
                {form.prerequisites.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={item} onChange={e => updateArrayItem('prerequisites', index, e.target.value)} placeholder="e.g., Must hold a valid provisional licence" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('prerequisites', index)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('prerequisites')} className="gap-1"><Plus className="h-3 w-3" />Add Prerequisite</Button>
              </div>
            </div>

            {/* Explainer Video */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Video className="h-4 w-4" />Explainer Video</Label>
              <div className="flex gap-4">
                <div className="relative aspect-video w-48 rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                  {form.explainer_video_url ? (
                    <>
                      <video src={form.explainer_video_url} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Video className="h-8 w-8 text-white" /></div>
                      <Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => setForm(f => ({ ...f, explainer_video_url: null }))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <label className={`flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4 ${uploadingVideo ? "pointer-events-none opacity-50" : ""}`}>
                      {uploadingVideo ? (
                        <><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="text-xs text-muted-foreground">Uploading...</span></>
                      ) : (
                        <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload video</span></>
                      )}
                      <input type="file" accept="video/*" className="hidden" disabled={uploadingVideo} onChange={handleVideoUpload} />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Upload an explainer video for this course. Max 100MB.</p>
                  {form.explainer_video_url && (
                    <a href={form.explainer_video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View video</a>
                  )}
                </div>
              </div>
            </div>

            {/* Theory Test Details */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />Theory Test Details</Label>
              <Textarea value={form.theory_test_details} onChange={e => setForm(f => ({ ...f, theory_test_details: e.target.value }))} placeholder="Information about theory test requirements..." rows={3} />
            </div>

            {/* Driving Test Details */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />Driving Test Details</Label>
              <Textarea value={form.driving_test_details} onChange={e => setForm(f => ({ ...f, driving_test_details: e.target.value }))} placeholder="Information about driving test booking..." rows={3} />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment Terms</Label>
              <Textarea value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} placeholder="Payment schedule, deposit requirements..." rows={3} />
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ScrollText className="h-4 w-4" />Terms & Conditions</Label>
              <Textarea value={form.terms_conditions} onChange={e => setForm(f => ({ ...f, terms_conditions: e.target.value }))} placeholder="Cancellation policy, lesson terms..." rows={4} />
            </div>

            {/* Toggles */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="sc-active">Active</Label>
                <Switch id="sc-active" checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="sc-intensive">Intensive</Label>
                <Switch id="sc-intensive" checked={form.is_intensive} onCheckedChange={v => setForm(f => ({ ...f, is_intensive: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="sc-popular">Popular</Label>
                <Switch id="sc-popular" checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} />
              </div>
            </div>

            {/* Assign Instructors */}
            <div className="space-y-2">
              <Label>Assign Instructors</Label>
              <div className="flex flex-wrap gap-2">
                {instructors.map((inst: any) => (
                  <Badge key={inst.id} variant={form.instructor_ids.includes(inst.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleInstructor(inst.id)}>
                    {inst.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t">
            {editingId && (
              <Button variant="destructive" onClick={() => { deleteMutation.mutate(editingId); setDialogOpen(false); }}>
                Delete Course
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                disabled={!form.course_name || !form.price || saveMutation.isPending}
                onClick={() => saveMutation.mutate({ ...form, id: editingId || undefined })}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? "Save Changes" : "Create Course"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
