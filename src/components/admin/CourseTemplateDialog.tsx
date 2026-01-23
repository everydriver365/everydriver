import { useState } from "react";
import { Upload, X, Plus, Video, FileText, Backpack, AlertCircle, CreditCard, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseTemplate {
  id: string;
  course_hours: number;
  course_name: string;
  short_description: string | null;
  full_description: string | null;
  features: string[];
  default_image_url: string | null;
  is_intensive: boolean;
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  what_to_bring: string[];
  prerequisites: string[];
  theory_test_details: string | null;
  driving_test_details: string | null;
  payment_terms: string | null;
  terms_conditions: string | null;
  explainer_video_url: string | null;
}

interface CourseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CourseTemplate | null;
  isCreating: boolean;
  onSaved: () => void;
}

export function CourseTemplateDialog({
  open,
  onOpenChange,
  template,
  isCreating,
  onSaved,
}: CourseTemplateDialogProps) {
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | null>(template);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Update internal state when template prop changes
  useState(() => {
    setEditingTemplate(template);
  });

  // Reset state when dialog opens with new template
  if (template !== editingTemplate && template !== null) {
    setEditingTemplate(template);
  }

  const handleSave = async () => {
    if (!editingTemplate) return;

    if (isCreating) {
      const { error } = await supabase
        .from("course_templates")
        .insert({
          course_hours: editingTemplate.course_hours,
          course_name: editingTemplate.course_name,
          short_description: editingTemplate.short_description,
          full_description: editingTemplate.full_description,
          features: editingTemplate.features,
          default_image_url: editingTemplate.default_image_url,
          is_intensive: editingTemplate.is_intensive,
          is_popular: editingTemplate.is_popular,
          display_order: editingTemplate.display_order,
          is_active: editingTemplate.is_active,
          what_to_bring: editingTemplate.what_to_bring,
          prerequisites: editingTemplate.prerequisites,
          theory_test_details: editingTemplate.theory_test_details,
          driving_test_details: editingTemplate.driving_test_details,
          payment_terms: editingTemplate.payment_terms,
          terms_conditions: editingTemplate.terms_conditions,
          explainer_video_url: editingTemplate.explainer_video_url,
        });

      if (error) {
        toast.error("Failed to create template");
      } else {
        toast.success("Course template created");
        onOpenChange(false);
        onSaved();
      }
    } else {
      const { error } = await supabase
        .from("course_templates")
        .update({
          course_hours: editingTemplate.course_hours,
          course_name: editingTemplate.course_name,
          short_description: editingTemplate.short_description,
          full_description: editingTemplate.full_description,
          features: editingTemplate.features,
          default_image_url: editingTemplate.default_image_url,
          is_intensive: editingTemplate.is_intensive,
          is_popular: editingTemplate.is_popular,
          is_active: editingTemplate.is_active,
          what_to_bring: editingTemplate.what_to_bring,
          prerequisites: editingTemplate.prerequisites,
          theory_test_details: editingTemplate.theory_test_details,
          driving_test_details: editingTemplate.driving_test_details,
          payment_terms: editingTemplate.payment_terms,
          terms_conditions: editingTemplate.terms_conditions,
          explainer_video_url: editingTemplate.explainer_video_url,
        })
        .eq("id", editingTemplate.id);

      if (error) {
        toast.error("Failed to save template");
      } else {
        toast.success("Course template saved");
        onOpenChange(false);
        onSaved();
      }
    }
  };

  const handleDelete = async () => {
    if (!editingTemplate || !editingTemplate.id) return;
    
    const { error } = await supabase
      .from("course_templates")
      .delete()
      .eq("id", editingTemplate.id);

    if (error) {
      toast.error("Failed to delete template");
    } else {
      toast.success("Template deleted");
      onOpenChange(false);
      onSaved();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTemplate) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `course-template-${editingTemplate.course_hours}-${Date.now()}.${fileExt}`;
    const filePath = `templates/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("instructor-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("instructor-images")
      .getPublicUrl(filePath);

    setEditingTemplate({
      ...editingTemplate,
      default_image_url: urlData.publicUrl,
    });
    toast.success("Image uploaded");
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTemplate) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be less than 100MB");
      return;
    }

    setUploadingVideo(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `explainer-${editingTemplate.course_hours}-${Date.now()}.${fileExt}`;
    const filePath = `explainers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course-videos")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload video");
      setUploadingVideo(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("course-videos")
      .getPublicUrl(filePath);

    setEditingTemplate({
      ...editingTemplate,
      explainer_video_url: urlData.publicUrl,
    });
    toast.success("Video uploaded");
    setUploadingVideo(false);
  };

  // Array field helpers
  const addFeature = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      features: [...editingTemplate.features, ""],
    });
  };

  const updateFeature = (index: number, value: string) => {
    if (!editingTemplate) return;
    const newFeatures = [...editingTemplate.features];
    newFeatures[index] = value;
    setEditingTemplate({ ...editingTemplate, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      features: editingTemplate.features.filter((_, i) => i !== index),
    });
  };

  const addWhatToBring = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      what_to_bring: [...(editingTemplate.what_to_bring || []), ""],
    });
  };

  const updateWhatToBring = (index: number, value: string) => {
    if (!editingTemplate) return;
    const items = [...(editingTemplate.what_to_bring || [])];
    items[index] = value;
    setEditingTemplate({ ...editingTemplate, what_to_bring: items });
  };

  const removeWhatToBring = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      what_to_bring: (editingTemplate.what_to_bring || []).filter((_, i) => i !== index),
    });
  };

  const addPrerequisite = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      prerequisites: [...(editingTemplate.prerequisites || []), ""],
    });
  };

  const updatePrerequisite = (index: number, value: string) => {
    if (!editingTemplate) return;
    const items = [...(editingTemplate.prerequisites || [])];
    items[index] = value;
    setEditingTemplate({ ...editingTemplate, prerequisites: items });
  };

  const removePrerequisite = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      prerequisites: (editingTemplate.prerequisites || []).filter((_, i) => i !== index),
    });
  };

  if (!editingTemplate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreating ? "Create Course Template" : "Edit Course Template"}</DialogTitle>
          <DialogDescription>
            {isCreating ? "Set up a new course type with default details" : "Update the default details for this course type"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Course Image</Label>
            <div className="flex gap-4">
              <div className="relative aspect-video w-48 rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                {editingTemplate.default_image_url ? (
                  <>
                    <img
                      src={editingTemplate.default_image_url}
                      alt="Course"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={() =>
                        setEditingTemplate({
                          ...editingTemplate,
                          default_image_url: null,
                        })
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  This image will be used as the default for all {editingTemplate.course_hours}h
                  courses unless the instructor uploads their own.
                </p>
              </div>
            </div>
          </div>

          {/* Course Hours - only editable when creating */}
          {isCreating && (
            <div className="space-y-2">
              <Label>Course Hours</Label>
              <Input
                type="number"
                min={1}
                value={editingTemplate.course_hours}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    course_hours: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          )}

          {/* Course Name */}
          <div className="space-y-2">
            <Label>Course Name</Label>
            <Input
              value={editingTemplate.course_name}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  course_name: e.target.value,
                })
              }
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label>Short Description</Label>
            <Textarea
              value={editingTemplate.short_description || ""}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  short_description: e.target.value,
                })
              }
              placeholder="Brief description shown on course cards"
              rows={2}
            />
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <Label>Full Description</Label>
            <Textarea
              value={editingTemplate.full_description || ""}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  full_description: e.target.value,
                })
              }
              placeholder="Detailed description shown on booking page"
              rows={4}
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Features Included</Label>
            <div className="space-y-2">
              {editingTemplate.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="e.g., Pick-up from home"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Feature
              </Button>
            </div>
          </div>

          {/* What to Bring */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Backpack className="h-4 w-4" />
              What to Bring
            </Label>
            <div className="space-y-2">
              {(editingTemplate.what_to_bring || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateWhatToBring(index, e.target.value)}
                    placeholder="e.g., Provisional driving licence"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWhatToBring(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWhatToBring}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Prerequisites
            </Label>
            <div className="space-y-2">
              {(editingTemplate.prerequisites || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updatePrerequisite(index, e.target.value)}
                    placeholder="e.g., Must hold a valid provisional licence"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrerequisite(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPrerequisite}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Prerequisite
              </Button>
            </div>
          </div>

          {/* Explainer Video Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Explainer Video
            </Label>
            <div className="flex gap-4">
              <div className="relative aspect-video w-48 rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                {editingTemplate.explainer_video_url ? (
                  <>
                    <video
                      src={editingTemplate.explainer_video_url}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Video className="h-8 w-8 text-white" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={() =>
                        setEditingTemplate({
                          ...editingTemplate,
                          explainer_video_url: null,
                        })
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <label className={`flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4 ${uploadingVideo ? "pointer-events-none opacity-50" : ""}`}>
                    {uploadingVideo ? (
                      <>
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-xs text-muted-foreground">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload video</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploadingVideo}
                      onChange={handleVideoUpload}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload an explainer video for this course type. Max 100MB.
                </p>
                {editingTemplate.explainer_video_url && (
                  <a 
                    href={editingTemplate.explainer_video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View video in new tab
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Theory Test Details */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Theory Test Details
            </Label>
            <Textarea
              value={editingTemplate.theory_test_details || ""}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  theory_test_details: e.target.value || null,
                })
              }
              placeholder="Information about theory test requirements..."
              rows={3}
            />
          </div>

          {/* Driving Test Details */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Driving Test Details
            </Label>
            <Textarea
              value={editingTemplate.driving_test_details || ""}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  driving_test_details: e.target.value || null,
                })
              }
              placeholder="Information about driving test booking, what to expect..."
              rows={3}
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Terms
            </Label>
            <Textarea
              value={editingTemplate.payment_terms || ""}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  payment_terms: e.target.value || null,
                })
              }
              placeholder="Payment schedule, deposit requirements, refund policy..."
              rows={3}
            />
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Terms & Conditions
            </Label>
            <Textarea
              value={editingTemplate.terms_conditions || ""}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  terms_conditions: e.target.value || null,
                })
              }
              placeholder="Cancellation policy, lesson terms, liability..."
              rows={4}
            />
          </div>

          {/* Toggles */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="is-active">Active</Label>
              <Switch
                id="is-active"
                checked={editingTemplate.is_active}
                onCheckedChange={(checked) =>
                  setEditingTemplate({ ...editingTemplate, is_active: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="is-intensive">Intensive</Label>
              <Switch
                id="is-intensive"
                checked={editingTemplate.is_intensive}
                onCheckedChange={(checked) =>
                  setEditingTemplate({ ...editingTemplate, is_intensive: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="is-popular">Popular</Label>
              <Switch
                id="is-popular"
                checked={editingTemplate.is_popular}
                onCheckedChange={(checked) =>
                  setEditingTemplate({ ...editingTemplate, is_popular: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          {!isCreating && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete Template
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isCreating ? "Create Template" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
