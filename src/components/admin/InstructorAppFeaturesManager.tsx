import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Upload, Image as ImageIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { InstructorAppFeature } from "@/hooks/useInstructorAppContent";

interface InstructorAppFeaturesManagerProps {
  features: InstructorAppFeature[];
  onRefetch: () => void;
}

const ICON_OPTIONS = [
  "Calendar", "CreditCard", "Users", "BarChart3", "Globe", "Shield", 
  "MapPin", "Smartphone", "Megaphone", "Palette", "Layout", "CalendarClock",
  "ClipboardCheck", "FileText", "Star", "Heart", "Zap", "Award"
];

export function InstructorAppFeaturesManager({ features, onRefetch }: InstructorAppFeaturesManagerProps) {
  const [editingFeature, setEditingFeature] = useState<InstructorAppFeature | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    detailed_content: "",
    icon_name: "Star",
    image_url: "",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      detailed_content: "",
      icon_name: "Star",
      image_url: "",
      is_active: true,
    });
  };

  const handleEdit = (feature: InstructorAppFeature) => {
    setEditingFeature(feature);
    setFormData({
      title: feature.title,
      description: feature.description,
      detailed_content: feature.detailed_content || "",
      icon_name: feature.icon_name,
      image_url: feature.image_url || "",
      is_active: feature.is_active,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `feature-${Date.now()}.${fileExt}`;
      const filePath = `features/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      if (editingFeature) {
        const { error } = await supabase
          .from("instructor_app_features")
          .update({
            title: formData.title,
            description: formData.description,
            detailed_content: formData.detailed_content || null,
            icon_name: formData.icon_name,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
          })
          .eq("id", editingFeature.id);

        if (error) throw error;
        toast.success("Feature updated");
        setEditingFeature(null);
      } else {
        const maxOrder = Math.max(...features.map(f => f.display_order), 0);
        const { error } = await supabase
          .from("instructor_app_features")
          .insert({
            title: formData.title,
            description: formData.description,
            detailed_content: formData.detailed_content || null,
            icon_name: formData.icon_name,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Feature added");
        setIsAddOpen(false);
      }

      resetForm();
      onRefetch();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save feature");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feature?")) return;

    try {
      const { error } = await supabase
        .from("instructor_app_features")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Feature deleted");
      onRefetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete feature");
    }
  };

  const getIconComponent = (name: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = icons[name] || LucideIcons.Star;
    return <IconComponent className="h-5 w-5" />;
  };

  const FeatureForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Feature title"
          />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
          <select
            value={formData.icon_name}
            onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
          >
            {ICON_OPTIONS.map(icon => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Short Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description shown on the tile"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Detailed Content (Modal)</Label>
        <Textarea
          value={formData.detailed_content}
          onChange={(e) => setFormData(prev => ({ ...prev, detailed_content: e.target.value }))}
          placeholder="Full description shown when user clicks the tile"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Feature Image</Label>
        <div className="flex items-center gap-4">
          {formData.image_url ? (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
              <img
                src={formData.image_url}
                alt="Feature"
                className="w-full h-full object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
              >
                ×
              </Button>
            </div>
          ) : (
            <div className="w-32 h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-1">Or paste URL:</p>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label>Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => {
          setEditingFeature(null);
          setIsAddOpen(false);
          resetForm();
        }}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={uploading}>
          {editingFeature ? "Update" : "Add"} Feature
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Feature Tiles</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Feature</DialogTitle>
            </DialogHeader>
            <FeatureForm />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              
              {feature.image_url ? (
                <img
                  src={feature.image_url}
                  alt={feature.title}
                  className="w-16 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                  {getIconComponent(feature.icon_name)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{feature.title}</span>
                  {!feature.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {feature.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Dialog open={editingFeature?.id === feature.id} onOpenChange={(open) => {
                  if (!open) {
                    setEditingFeature(null);
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(feature)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Feature</DialogTitle>
                    </DialogHeader>
                    <FeatureForm />
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(feature.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {features.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No features added yet. Click "Add Feature" to create one.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
