import { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface SiteImage {
  id: string;
  image_key: string;
  image_url: string;
  alt_text: string | null;
  description: string | null;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

const CATEGORIES = [
  { value: "hero", label: "Hero Section" },
  { value: "testimonials", label: "Testimonials" },
  { value: "features", label: "Features" },
  { value: "courses", label: "Courses" },
  { value: "video", label: "Video" },
  { value: "general", label: "General" },
];

export function SiteImageManager() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<SiteImage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_images")
      .select("*")
      .order("category")
      .order("display_order");

    if (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load site images");
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (image: SiteImage) => {
    setEditingImage({ ...image });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingImage) return;

    const { error } = await supabase
      .from("site_images")
      .update({
        image_url: editingImage.image_url,
        alt_text: editingImage.alt_text,
        description: editingImage.description,
        category: editingImage.category,
        is_active: editingImage.is_active,
      })
      .eq("id", editingImage.id);

    if (error) {
      console.error("Error saving image:", error);
      toast.error("Failed to save image");
    } else {
      toast.success("Image saved successfully");
      setDialogOpen(false);
      fetchImages();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingImage) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `site-${editingImage.image_key}-${Date.now()}.${fileExt}`;
    const filePath = `site-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("instructor-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Failed to upload image");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("instructor-images")
      .getPublicUrl(filePath);

    setEditingImage({
      ...editingImage,
      image_url: urlData.publicUrl,
    });
    toast.success("Image uploaded");
    setUploading(false);
  };

  const handleAddNew = async () => {
    const newKey = `custom_image_${Date.now()}`;
    const { data, error } = await supabase
      .from("site_images")
      .insert({
        image_key: newKey,
        image_url: "",
        alt_text: "New Image",
        description: "Custom site image",
        category: "general",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding image:", error);
      toast.error("Failed to add new image");
    } else if (data) {
      toast.success("New image slot created");
      setEditingImage(data);
      setDialogOpen(true);
      fetchImages();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("site_images")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    } else {
      toast.success("Image deleted");
      setDialogOpen(false);
      fetchImages();
    }
  };

  const filteredImages = filterCategory === "all" 
    ? images 
    : images.filter(img => img.category === filterCategory);

  const groupedImages = filteredImages.reduce((acc, img) => {
    const cat = img.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(img);
    return acc;
  }, {} as Record<string, SiteImage[]>);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Site Images</h2>
          <p className="text-sm text-muted-foreground">
            Manage dynamic images across the website
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew}>Add Image</Button>
        </div>
      </div>

      {Object.entries(groupedImages).map(([category, categoryImages]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-md font-medium capitalize border-b pb-2">
            {CATEGORIES.find(c => c.value === category)?.label || category}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryImages.map((image) => (
              <Card
                key={image.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  !image.is_active ? "opacity-50" : ""
                }`}
                onClick={() => handleEdit(image)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">{image.image_key.replace(/_/g, " ")}</CardTitle>
                      <CardDescription className="text-xs">{image.description}</CardDescription>
                    </div>
                    {!image.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {image.image_url ? (
                    <div className="aspect-video rounded-md overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || ""}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                        <span className="text-xs text-muted-foreground mt-1 block">No image uploaded</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Site Image</DialogTitle>
            <DialogDescription>
              Upload or update this image used on the website
            </DialogDescription>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="relative aspect-video rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                  {editingImage.image_url ? (
                    <>
                      <img
                        src={editingImage.image_url}
                        alt={editingImage.alt_text || ""}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8"
                        onClick={() =>
                          setEditingImage({
                            ...editingImage,
                            image_url: "",
                          })
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploading ? "Uploading..." : "Click to upload"}
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

              {/* Alt Text */}
              <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                  value={editingImage.alt_text || ""}
                  onChange={(e) =>
                    setEditingImage({
                      ...editingImage,
                      alt_text: e.target.value,
                    })
                  }
                  placeholder="Describe the image for accessibility"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingImage.description || ""}
                  onChange={(e) =>
                    setEditingImage({
                      ...editingImage,
                      description: e.target.value,
                    })
                  }
                  placeholder="Internal description of where this image is used"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={editingImage.category || "general"} 
                  onValueChange={(value) => setEditingImage({ ...editingImage, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                {editingImage.image_key.startsWith("custom_") && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(editingImage.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
