import { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Crop, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseImage {
  courseHours: number;
  imageUrl: string | null;
  file: File | null;
  preview: string | null;
}

interface CourseImageEditorProps {
  instructorId: string;
  selectedCourses: number[];
}

const COURSE_LABELS: Record<number, string> = {
  8: "8 Hour Course",
  10: "10 Hour Course",
  12: "12 Hour Course",
  16: "16 Hour Course",
  20: "20 Hour Course",
  24: "24 Hour Course",
  28: "Test in a Week (28h)",
  30: "30 Hour Course",
  32: "32 Hour Course",
  40: "40 Hour Course",
  48: "48 Hour Course",
};

export function CourseImageEditor({ instructorId, selectedCourses }: CourseImageEditorProps) {
  const [courseImages, setCourseImages] = useState<CourseImage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourseImages();
  }, [instructorId, selectedCourses]);

  const fetchCourseImages = async () => {
    if (!instructorId) {
      // Initialize with empty images for new instructors
      setCourseImages(
        selectedCourses.map((hours) => ({
          courseHours: hours,
          imageUrl: null,
          file: null,
          preview: null,
        }))
      );
      return;
    }

    const { data } = await supabase
      .from("instructor_courses")
      .select("course_hours, course_image_url")
      .eq("instructor_id", instructorId)
      .eq("is_active", true);

    const images: CourseImage[] = selectedCourses.map((hours) => {
      const existing = data?.find((c) => c.course_hours === hours);
      return {
        courseHours: hours,
        imageUrl: existing?.course_image_url || null,
        file: null,
        preview: existing?.course_image_url || null,
      };
    });

    setCourseImages(images);
  };

  const handleImageChange = (courseHours: number, e: React.ChangeEvent<HTMLInputElement>) => {
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

    const preview = URL.createObjectURL(file);
    
    setCourseImages((prev) =>
      prev.map((img) =>
        img.courseHours === courseHours
          ? { ...img, file, preview }
          : img
      )
    );
  };

  const removeImage = (courseHours: number) => {
    setCourseImages((prev) =>
      prev.map((img) =>
        img.courseHours === courseHours
          ? { ...img, file: null, preview: null, imageUrl: null }
          : img
      )
    );
  };

  const uploadImage = async (file: File, courseHours: number): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `course-${instructorId}-${courseHours}-${Date.now()}.${fileExt}`;
    const filePath = `courses/${fileName}`;

    const { error } = await supabase.storage
      .from("instructor-images")
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("instructor-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const saveImages = async () => {
    if (!instructorId) {
      toast.error("Please save the instructor first");
      return;
    }

    setSaving(true);
    try {
      for (const img of courseImages) {
        let imageUrl = img.imageUrl;

        // Upload new image if selected
        if (img.file) {
          const url = await uploadImage(img.file, img.courseHours);
          if (url) imageUrl = url;
        }

        // Update the course record
        await supabase
          .from("instructor_courses")
          .update({ course_image_url: imageUrl })
          .eq("instructor_id", instructorId)
          .eq("course_hours", img.courseHours);
      }

      toast.success("Course images saved");
      fetchCourseImages();
    } catch (error) {
      console.error("Error saving images:", error);
      toast.error("Failed to save images");
    } finally {
      setSaving(false);
    }
  };

  if (selectedCourses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Select courses above to add images
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courseImages.map((img) => (
          <div key={img.courseHours} className="space-y-2">
            <Label className="text-sm font-medium">
              {COURSE_LABELS[img.courseHours] || `${img.courseHours}h Course`}
            </Label>

            {img.preview ? (
              <div className="space-y-2">
                {/* Cropped 4:3 preview — exactly how the card will display it */}
                <div className="relative aspect-[4/3] rounded-lg border bg-muted overflow-hidden">
                  <img
                    src={img.preview}
                    alt={`${img.courseHours}h cropped preview`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm">
                    <Crop className="h-3 w-3" /> Card preview · 4:3
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => removeImage(img.courseHours)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Full image with the 4:3 crop window overlaid so the user can see what's cut */}
                <div className="relative rounded-md border border-dashed bg-muted/40 p-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Full image · grey areas will be cropped
                  </p>
                  <div className="relative mx-auto max-h-40 w-fit">
                    <img
                      src={img.preview}
                      alt={`${img.courseHours}h original`}
                      className="block max-h-40 w-auto opacity-50"
                    />
                    {/* 4:3 visible window overlay */}
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0)] outline outline-1 outline-primary/40"
                      style={{
                        aspectRatio: "4 / 3",
                        width: "min(100%, calc((100% / var(--src-ar, 1.5)) * (4 / 3)))",
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                    />
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 text-[11px] text-primary hover:underline">
                    <RefreshCw className="h-3 w-3" /> Replace image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(img.courseHours, e)}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 overflow-hidden">
                <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">
                    Click to upload (4:3 recommended)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(img.courseHours, e)}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {instructorId && courseImages.some((img) => img.file) && (
        <Button
          type="button"
          onClick={saveImages}
          disabled={saving}
          className="mt-4"
        >
          {saving ? "Saving..." : "Save Course Images"}
        </Button>
      )}
    </div>
  );
}
