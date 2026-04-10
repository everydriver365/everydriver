import { useState, useRef } from "react";
import { Globe, Edit2, Eye, EyeOff, ExternalLink, Save, Upload, Loader2, Palette, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstructorWebsitePages, WebsitePage } from "@/hooks/useInstructorWebsitePages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MiniWebsiteCMSProps {
  instructorId: string;
  instructorSlug: string;
  customDomain?: string | null;
}

export function MiniWebsiteCMS({ instructorId, instructorSlug, customDomain }: MiniWebsiteCMSProps) {
  const { pages, loading, updatePage } = useInstructorWebsitePages(instructorId);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom domain if available, otherwise fall back to path-based URL
  const siteBaseUrl = customDomain ? `https://${customDomain}` : `${window.location.origin}/i/${instructorSlug}`;
  const getPageUrl = (pageType: string) => {
    if (customDomain) {
      return pageType === "home" ? `https://${customDomain}` : `https://${customDomain}/${pageType}`;
    }
    return pageType === "home" ? `${window.location.origin}/i/${instructorSlug}` : `${window.location.origin}/i/${instructorSlug}/${pageType}`;
  };
  const getPagePath = (pageType: string) => {
    if (customDomain) {
      return pageType === "home" ? customDomain : `${customDomain}/${pageType}`;
    }
    return `/i/${instructorSlug}${pageType !== "home" ? `/${pageType}` : ""}`;
  };

  const handleSave = async () => {
    if (!editingPage) return;
    setSaving(true);
    const result = await updatePage(editingPage.id, {
      hero_heading: editingPage.hero_heading,
      hero_subheading: editingPage.hero_subheading,
      hero_image_url: editingPage.hero_image_url,
      is_published: editingPage.is_published,
      meta_title: editingPage.meta_title,
      meta_description: editingPage.meta_description,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Page saved");
      setEditingPage(null);
    } else {
      toast.error("Failed to save");
    }
  };

  const handleEditClick = (e: React.MouseEvent, page: WebsitePage) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPage(page);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPage) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/hero-${editingPage.page_type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setEditingPage({ ...editingPage, hero_image_url: urlWithCacheBuster });
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-none" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Globe className="h-4 w-4" />
        <span>Your website:</span>
        <a
          href={siteBaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {customDomain || `${window.location.origin}/i/${instructorSlug}`}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-2">
        {pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center justify-between p-3 border rounded-none bg-background"
          >
            <div className="flex items-center gap-3">
              {page.is_published ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{page.page_title}</p>
                <p className="text-xs text-muted-foreground">
                  {getPagePath(page.page_type)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={getPageUrl(page.page_type)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm" type="button">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => handleEditClick(e, page)}
                type="button"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingPage?.page_title} Page</DialogTitle>
          </DialogHeader>
          {editingPage && (
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                {/* Published Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-none">
                  <Label className="font-medium">Published</Label>
                  <Switch
                    checked={editingPage.is_published}
                    onCheckedChange={(checked) =>
                      setEditingPage({ ...editingPage, is_published: checked })
                    }
                  />
                </div>

                {/* Hero Heading */}
                <div>
                  <Label>Hero Heading</Label>
                  <Input
                    value={editingPage.hero_heading || ""}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, hero_heading: e.target.value })
                    }
                    placeholder="Welcome to my driving school"
                  />
                </div>

                {/* Hero Subheading */}
                <div>
                  <Label>Hero Subheading</Label>
                  <Textarea
                    value={editingPage.hero_subheading || ""}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, hero_subheading: e.target.value })
                    }
                    placeholder="Professional driving instruction tailored to your needs"
                    rows={3}
                  />
                </div>

                {/* Hero Image Upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Hero Image
                  </Label>
                  
                  {/* Current Image Preview */}
                  {editingPage.hero_image_url && (
                    <div className="relative">
                      <img
                        src={editingPage.hero_image_url}
                        alt="Hero preview"
                        className="w-full h-40 object-cover rounded-none border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setEditingPage({ ...editingPage, hero_image_url: null })}
                      >
                        Remove
                      </Button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Or enter URL manually */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or enter URL</span>
                    </div>
                  </div>
                  <Input
                    value={editingPage.hero_image_url || ""}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, hero_image_url: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={editingPage.meta_title || ""}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, meta_title: e.target.value })
                    }
                    placeholder="Page title for search engines"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 50-60 characters
                  </p>
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={editingPage.meta_description || ""}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, meta_description: e.target.value })
                    }
                    placeholder="Brief description for search results"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 150-160 characters
                  </p>
                </div>
              </TabsContent>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingPage(null)} className="flex-1" type="button">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || uploading} className="flex-1" type="button">
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
