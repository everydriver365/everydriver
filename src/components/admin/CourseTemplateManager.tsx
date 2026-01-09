import { useState, useEffect } from "react";
import { Upload, X, Plus, Save, Image as ImageIcon, Video, FileText, Backpack, AlertCircle, CreditCard, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  // New fields
  what_to_bring: string[];
  prerequisites: string[];
  theory_test_details: string | null;
  driving_test_details: string | null;
  payment_terms: string | null;
  terms_conditions: string | null;
  explainer_video_url: string | null;
}

export function CourseTemplateManager() {
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_templates")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load course templates");
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (template: CourseTemplate) => {
    setEditingTemplate({ ...template });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    const { error } = await supabase
      .from("course_templates")
      .update({
        course_name: editingTemplate.course_name,
        short_description: editingTemplate.short_description,
        full_description: editingTemplate.full_description,
        features: editingTemplate.features,
        default_image_url: editingTemplate.default_image_url,
        is_intensive: editingTemplate.is_intensive,
        is_popular: editingTemplate.is_popular,
        is_active: editingTemplate.is_active,
        // New fields
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
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } else {
      toast.success("Course template saved");
      setDialogOpen(false);
      fetchTemplates();
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
      console.error("Upload error:", uploadError);
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
    setEditingTemplate({
      ...editingTemplate,
      features: newFeatures,
    });
  };

  const removeFeature = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      features: editingTemplate.features.filter((_, i) => i !== index),
    });
  };

  // What to Bring helpers
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

  // Prerequisites helpers
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

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Course Templates</h2>
          <p className="text-sm text-muted-foreground">
            Manage default course details, descriptions, and images
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-shadow hover:shadow-md ${
              !template.is_active ? "opacity-50" : ""
            }`}
            onClick={() => handleEdit(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{template.course_name}</CardTitle>
                  <CardDescription>{template.course_hours} hours</CardDescription>
                </div>
                <div className="flex gap-1">
                  {template.is_popular && (
                    <Badge variant="default" className="text-xs">Popular</Badge>
                  )}
                  {template.is_intensive && (
                    <Badge variant="secondary" className="text-xs">Intensive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {template.default_image_url ? (
                <div className="aspect-video rounded-md overflow-hidden mb-3">
                  <img
                    src={template.default_image_url}
                    alt={template.course_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-3">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.short_description || "No description set"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {template.features.slice(0, 3).map((feature, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {template.features.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.features.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course Template</DialogTitle>
            <DialogDescription>
              Update the default details for this course type
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
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
                          onChange={async (e) => {
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
                              console.error("Upload error:", uploadError);
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
                          }}
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
                      setEditingTemplate({
                        ...editingTemplate,
                        is_active: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="is-popular">Popular Badge</Label>
                  <Switch
                    id="is-popular"
                    checked={editingTemplate.is_popular}
                    onCheckedChange={(checked) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        is_popular: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="is-intensive">Intensive Badge</Label>
                  <Switch
                    id="is-intensive"
                    checked={editingTemplate.is_intensive}
                    onCheckedChange={(checked) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        is_intensive: checked,
                      })
                    }
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
