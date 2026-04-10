import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon, X, Check, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstructorCourse {
  id: string;
  course_hours: number;
  course_name: string;
  discounted_price: number | null;
  custom_features: string[] | null;
  course_image_url: string | null;
  is_active: boolean;
}

interface CourseTemplate {
  id: string;
  course_hours: number;
  course_name: string;
  short_description: string | null;
  features: string[];
  default_image_url: string | null;
  is_intensive: boolean;
}

interface InstructorCoursesManagerProps {
  instructorId: string;
}

const COURSE_HOURS = [8, 10, 12, 16, 20, 24, 28, 30, 32, 40, 48];

export function InstructorCoursesManager({ instructorId }: InstructorCoursesManagerProps) {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCourse, setEditingCourse] = useState<InstructorCourse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch instructor's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("instructor_courses")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("course_hours");

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Fetch course templates for reference
      const { data: templatesData } = await supabase
        .from("course_templates")
        .select("id, course_hours, course_name, short_description, features, default_image_url, is_intensive")
        .eq("is_active", true)
        .order("course_hours");

      setTemplates(templatesData || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (hours: number) => {
    const template = templates.find(t => t.course_hours === hours);
    const courseName = template?.course_name || `${hours} Hour Course`;

    try {
      const { data, error } = await supabase
        .from("instructor_courses")
        .insert({
          instructor_id: instructorId,
          course_hours: hours,
          course_name: courseName,
          is_active: true,
          course_image_url: template?.default_image_url || null,
          custom_features: template?.features || null,
        })
        .select()
        .single();

      if (error) throw error;
      setCourses([...courses, data]);
      toast.success(`${courseName} added`);
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error("Failed to add course");
    }
  };

  const handleToggleActive = async (course: InstructorCourse) => {
    try {
      const { error } = await supabase
        .from("instructor_courses")
        .update({ is_active: !course.is_active })
        .eq("id", course.id);

      if (error) throw error;
      setCourses(courses.map(c => 
        c.id === course.id ? { ...c, is_active: !c.is_active } : c
      ));
      toast.success(course.is_active ? "Course hidden" : "Course visible");
    } catch (error) {
      console.error("Error toggling course:", error);
      toast.error("Failed to update course");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to remove this course?")) return;
    
    try {
      const { error } = await supabase
        .from("instructor_courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;
      setCourses(courses.filter(c => c.id !== courseId));
      toast.success("Course removed");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const handleEditCourse = (course: InstructorCourse) => {
    setEditingCourse({ ...course });
    setDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!editingCourse) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("instructor_courses")
        .update({
          course_name: editingCourse.course_name,
          discounted_price: editingCourse.discounted_price,
          custom_features: editingCourse.custom_features,
          course_image_url: editingCourse.course_image_url,
        })
        .eq("id", editingCourse.id);

      if (error) throw error;
      
      setCourses(courses.map(c => 
        c.id === editingCourse.id ? editingCourse : c
      ));
      setDialogOpen(false);
      toast.success("Course updated");
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCourse) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `courses/${instructorId}/${editingCourse.course_hours}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(fileName);

      setEditingCourse({ ...editingCourse, course_image_url: publicUrl });
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addFeature = () => {
    if (!editingCourse || !newFeature.trim()) return;
    const features = editingCourse.custom_features || [];
    setEditingCourse({
      ...editingCourse,
      custom_features: [...features, newFeature.trim()]
    });
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    if (!editingCourse) return;
    const features = [...(editingCourse.custom_features || [])];
    features.splice(index, 1);
    setEditingCourse({ ...editingCourse, custom_features: features });
  };

  const availableHours = COURSE_HOURS.filter(
    h => !courses.some(c => c.course_hours === h)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Courses */}
      {courses.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No courses added yet. Add your first course below.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map(course => (
            <Card key={course.id} className={!course.is_active ? "opacity-60" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {course.course_image_url ? (
                      <img 
                        src={course.course_image_url} 
                        alt={course.course_name}
                        className="h-12 w-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{course.course_name}</span>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {course.course_hours}h
                        </Badge>
                      </div>
                      {course.discounted_price && (
                        <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                          <PoundSterling className="h-3 w-3" />
                          {course.discounted_price}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={course.is_active}
                      onCheckedChange={() => handleToggleActive(course)}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditCourse(course)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Course */}
      {availableHours.length > 0 && (
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => handleAddCourse(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add a course..." />
            </SelectTrigger>
            <SelectContent>
              {availableHours.map(hours => {
                const template = templates.find(t => t.course_hours === hours);
                return (
                  <SelectItem key={hours} value={hours.toString()}>
                    {template?.course_name || `${hours} Hour Course`}
                    {template?.is_intensive && (
                      <Badge variant="secondary" className="ml-2">Intensive</Badge>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Customise your {editingCourse?.course_hours} hour course
            </DialogDescription>
          </DialogHeader>

          {editingCourse && (
            <div className="space-y-4">
              {/* Course Image */}
              <div className="space-y-2">
                <Label>Course Image</Label>
                <div className="relative aspect-video rounded-none border-2 border-dashed border-muted-foreground/25 bg-muted/50 overflow-hidden">
                  {editingCourse.course_image_url ? (
                    <>
                      <img
                        src={editingCourse.course_image_url}
                        alt="Course"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => setEditingCourse({ ...editingCourse, course_image_url: null })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        Click to upload
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Course Name */}
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input
                  value={editingCourse.course_name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, course_name: e.target.value })}
                />
              </div>

              {/* Discounted Price */}
              <div className="space-y-2">
                <Label>Your Price (£)</Label>
                <Input
                  type="number"
                  placeholder="Leave blank to use default pricing"
                  value={editingCourse.discounted_price || ""}
                  onChange={(e) => setEditingCourse({ 
                    ...editingCourse, 
                    discounted_price: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Set your own price for this course, or leave blank to use the default
                </p>
              </div>

              {/* Custom Features */}
              <div className="space-y-2">
                <Label>Course Features</Label>
                <div className="space-y-2">
                  {(editingCourse.custom_features || []).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1 p-2 bg-muted rounded">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveCourse} 
                disabled={saving}
                className="w-full"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
