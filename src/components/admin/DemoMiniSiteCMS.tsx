import { useState, useEffect } from "react";
import { Globe, Edit2, Eye, EyeOff, Save, Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentBlock {
  type: "text" | "features" | "image" | "gallery";
  title?: string;
  content?: string;
  items?: string[];
  image_url?: string;
  images?: string[];
}

interface DemoPage {
  id: string;
  page_type: string;
  page_title: string;
  hero_heading: string | null;
  hero_subheading: string | null;
  hero_image_url: string | null;
  content_blocks: ContentBlock[];
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  display_order: number;
}

export function DemoMiniSiteCMS() {
  const [pages, setPages] = useState<DemoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<DemoPage | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("demo_mini_website")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setPages(
        (data || []).map((p) => ({
          ...p,
          content_blocks: (p.content_blocks as unknown as ContentBlock[]) || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching demo pages:", error);
      toast.error("Failed to load demo pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSave = async () => {
    if (!editingPage) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentBlocksJson = editingPage.content_blocks as any;
      const { error } = await supabase
        .from("demo_mini_website")
        .update({
          hero_heading: editingPage.hero_heading,
          hero_subheading: editingPage.hero_subheading,
          hero_image_url: editingPage.hero_image_url,
          content_blocks: contentBlocksJson,
          is_published: editingPage.is_published,
          meta_title: editingPage.meta_title,
          meta_description: editingPage.meta_description,
        })
        .eq("id", editingPage.id);

      if (error) throw error;
      toast.success("Page saved successfully");
      setEditingPage(null);
      fetchPages();
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const updateContentBlock = (index: number, updates: Partial<ContentBlock>) => {
    if (!editingPage) return;
    const newBlocks = [...editingPage.content_blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setEditingPage({ ...editingPage, content_blocks: newBlocks });
  };

  const addContentBlock = (type: ContentBlock["type"]) => {
    if (!editingPage) return;
    const newBlock: ContentBlock = { type };
    if (type === "text") {
      newBlock.title = "New Section";
      newBlock.content = "";
    } else if (type === "features") {
      newBlock.title = "Features";
      newBlock.items = ["Item 1"];
    } else if (type === "image") {
      newBlock.title = "";
      newBlock.image_url = "";
    } else if (type === "gallery") {
      newBlock.title = "Gallery";
      newBlock.images = [];
    }
    setEditingPage({
      ...editingPage,
      content_blocks: [...editingPage.content_blocks, newBlock],
    });
  };

  const removeContentBlock = (index: number) => {
    if (!editingPage) return;
    const newBlocks = editingPage.content_blocks.filter((_, i) => i !== index);
    setEditingPage({ ...editingPage, content_blocks: newBlocks });
  };

  const addFeatureItem = (blockIndex: number) => {
    if (!editingPage) return;
    const newBlocks = [...editingPage.content_blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "features") {
      block.items = [...(block.items || []), "New item"];
      setEditingPage({ ...editingPage, content_blocks: newBlocks });
    }
  };

  const updateFeatureItem = (blockIndex: number, itemIndex: number, value: string) => {
    if (!editingPage) return;
    const newBlocks = [...editingPage.content_blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "features" && block.items) {
      block.items[itemIndex] = value;
      setEditingPage({ ...editingPage, content_blocks: newBlocks });
    }
  };

  const removeFeatureItem = (blockIndex: number, itemIndex: number) => {
    if (!editingPage) return;
    const newBlocks = [...editingPage.content_blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "features" && block.items) {
      block.items = block.items.filter((_, i) => i !== itemIndex);
      setEditingPage({ ...editingPage, content_blocks: newBlocks });
    }
  };

  const addGalleryImage = (blockIndex: number) => {
    if (!editingPage) return;
    const newBlocks = [...editingPage.content_blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "gallery") {
      block.images = [...(block.images || []), ""];
      setEditingPage({ ...editingPage, content_blocks: newBlocks });
    }
  };

  const updateGalleryImage = (blockIndex: number, imageIndex: number, value: string) => {
    if (!editingPage) return;
    const newBlocks = [...editingPage.content_blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "gallery" && block.images) {
      block.images[imageIndex] = value;
      setEditingPage({ ...editingPage, content_blocks: newBlocks });
    }
  };

  const removeGalleryImage = (blockIndex: number, imageIndex: number) => {
    if (!editingPage) return;
    const newBlocks = [...editingPage.content_blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "gallery" && block.images) {
      block.images = block.images.filter((_, i) => i !== imageIndex);
      setEditingPage({ ...editingPage, content_blocks: newBlocks });
    }
  };

  const getPageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      home: "🏠 Home",
      about: "👤 About",
      services: "🎯 Services",
      reviews: "⭐ Reviews",
      contact: "📞 Contact",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Demo Mini Site Pages</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {pages.length} pages
        </Badge>
      </div>

      <div className="grid gap-3">
        {pages.map((page) => (
          <Card
            key={page.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setEditingPage(page)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {page.is_published ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{getPageTypeLabel(page.page_type)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {page.hero_heading || "No heading set"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {page.content_blocks.length} blocks
                </Badge>
                <Button variant="ghost" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit {editingPage && getPageTypeLabel(editingPage.page_type)} Page
            </DialogTitle>
          </DialogHeader>

          {editingPage && (
            <div className="space-y-6">
              {/* Published Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Label className="font-medium">Published</Label>
                <Switch
                  checked={editingPage.is_published}
                  onCheckedChange={(checked) =>
                    setEditingPage({ ...editingPage, is_published: checked })
                  }
                />
              </div>

              {/* Hero Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Hero Section
                </h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Hero Heading</Label>
                    <Input
                      value={editingPage.hero_heading || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, hero_heading: e.target.value })
                      }
                      placeholder="Main heading text"
                    />
                  </div>
                  <div>
                    <Label>Hero Subheading</Label>
                    <Textarea
                      value={editingPage.hero_subheading || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, hero_subheading: e.target.value })
                      }
                      placeholder="Supporting text below the heading"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Hero Image URL</Label>
                    <Input
                      value={editingPage.hero_image_url || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, hero_image_url: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                    {editingPage.hero_image_url && (
                      <img
                        src={editingPage.hero_image_url}
                        alt="Hero preview"
                        className="mt-2 h-24 w-full object-cover rounded-lg border"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Content Blocks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Content Blocks
                  </h3>
                  <Select onValueChange={(type) => addContentBlock(type as ContentBlock["type"])}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Add block..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Block</SelectItem>
                      <SelectItem value="features">Features List</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Accordion type="multiple" className="space-y-2">
                  {editingPage.content_blocks.map((block, index) => (
                    <AccordionItem
                      key={index}
                      value={`block-${index}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs capitalize">
                            {block.type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {block.title || `Block ${index + 1}`}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {/* Title field for all block types */}
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={block.title || ""}
                            onChange={(e) =>
                              updateContentBlock(index, { title: e.target.value })
                            }
                            placeholder="Block title"
                          />
                        </div>

                        {/* Text block */}
                        {block.type === "text" && (
                          <div>
                            <Label>Content</Label>
                            <Textarea
                              value={block.content || ""}
                              onChange={(e) =>
                                updateContentBlock(index, { content: e.target.value })
                              }
                              placeholder="Enter text content..."
                              rows={4}
                            />
                          </div>
                        )}

                        {/* Features block */}
                        {block.type === "features" && (
                          <div className="space-y-2">
                            <Label>Items</Label>
                            {(block.items || []).map((item, itemIndex) => (
                              <div key={itemIndex} className="flex gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) =>
                                    updateFeatureItem(index, itemIndex, e.target.value)
                                  }
                                  placeholder="Feature item"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFeatureItem(index, itemIndex)}
                                  className="shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addFeatureItem(index)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Item
                            </Button>
                          </div>
                        )}

                        {/* Image block */}
                        {block.type === "image" && (
                          <div>
                            <Label>Image URL</Label>
                            <Input
                              value={block.image_url || ""}
                              onChange={(e) =>
                                updateContentBlock(index, { image_url: e.target.value })
                              }
                              placeholder="https://example.com/image.jpg"
                            />
                            {block.image_url && (
                              <img
                                src={block.image_url}
                                alt="Preview"
                                className="mt-2 h-32 w-full object-cover rounded-lg border"
                              />
                            )}
                          </div>
                        )}

                        {/* Gallery block */}
                        {block.type === "gallery" && (
                          <div className="space-y-2">
                            <Label>Images</Label>
                            {(block.images || []).map((img, imgIndex) => (
                              <div key={imgIndex} className="flex gap-2">
                                <Input
                                  value={img}
                                  onChange={(e) =>
                                    updateGalleryImage(index, imgIndex, e.target.value)
                                  }
                                  placeholder="Image URL"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeGalleryImage(index, imgIndex)}
                                  className="shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addGalleryImage(index)}
                              className="w-full"
                            >
                              <ImageIcon className="h-4 w-4 mr-1" /> Add Image
                            </Button>
                          </div>
                        )}

                        {/* Remove block button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeContentBlock(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove Block
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {editingPage.content_blocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No content blocks yet. Add one using the dropdown above.
                  </div>
                )}
              </div>

              {/* SEO Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  SEO Settings
                </h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Meta Title</Label>
                    <Input
                      value={editingPage.meta_title || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, meta_title: e.target.value })
                      }
                      placeholder="Page title for search engines"
                    />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={editingPage.meta_description || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, meta_description: e.target.value })
                      }
                      placeholder="Brief description for search results"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditingPage(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
