import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Globe, Edit2, Eye, EyeOff, Save, Plus, Trash2, GripVertical, Image as ImageIcon, ExternalLink, User, Phone, MapPin, Star, Award } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // Hero section
  badge_text: string | null;
  headline_line1: string | null;
  headline_line2: string | null;
  headline_highlight: string | null;
  headline_line3: string | null;
  hero_heading: string | null;
  hero_subheading: string | null;
  hero_image_url: string | null;
  search_placeholder: string | null;
  search_button_text: string | null;
  rating_value: string | null;
  show_finance_badges: boolean | null;
  // Instructor details
  instructor_grade: string | null;
  instructor_name: string | null;
  instructor_phone: string | null;
  instructor_postcode: string | null;
  cpd_certified: boolean | null;
  // CTA section
  cta_heading: string | null;
  cta_subtext: string | null;
  cta_button_text: string | null;
  cta_phone_text: string | null;
  // Content & SEO
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
          // Hero section
          badge_text: editingPage.badge_text,
          headline_line1: editingPage.headline_line1,
          headline_line2: editingPage.headline_line2,
          headline_highlight: editingPage.headline_highlight,
          headline_line3: editingPage.headline_line3,
          hero_heading: editingPage.hero_heading,
          hero_subheading: editingPage.hero_subheading,
          hero_image_url: editingPage.hero_image_url,
          search_placeholder: editingPage.search_placeholder,
          search_button_text: editingPage.search_button_text,
          rating_value: editingPage.rating_value,
          show_finance_badges: editingPage.show_finance_badges,
          // Instructor details
          instructor_grade: editingPage.instructor_grade,
          instructor_name: editingPage.instructor_name,
          instructor_phone: editingPage.instructor_phone,
          instructor_postcode: editingPage.instructor_postcode,
          cpd_certified: editingPage.cpd_certified,
          // CTA section
          cta_heading: editingPage.cta_heading,
          cta_subtext: editingPage.cta_subtext,
          cta_button_text: editingPage.cta_button_text,
          cta_phone_text: editingPage.cta_phone_text,
          // Content & SEO
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
          <Badge variant="outline" className="text-xs">
            {pages.length} pages
          </Badge>
        </div>
        <Link to="/demo-mini-site" target="_blank">
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
            Preview Site
          </Button>
        </Link>
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
                  {page.headline_line1 || page.hero_heading || "No heading set"}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit {editingPage && getPageTypeLabel(editingPage.page_type)} Page
            </DialogTitle>
          </DialogHeader>

          {editingPage && (
            <Tabs defaultValue="hero" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="cta">CTA</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              {/* Hero Tab */}
              <TabsContent value="hero" className="space-y-4">
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

                <div className="grid gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Award className="h-4 w-4" /> Badge Text
                    </Label>
                    <Input
                      value={editingPage.badge_text || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, badge_text: e.target.value })
                      }
                      placeholder="e.g., DVSA Approved, Grade A Instructor"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Headline Line 1</Label>
                      <Input
                        value={editingPage.headline_line1 || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, headline_line1: e.target.value })
                        }
                        placeholder="Your Driving"
                      />
                    </div>
                    <div>
                      <Label>Headline Line 2</Label>
                      <Input
                        value={editingPage.headline_line2 || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, headline_line2: e.target.value })
                        }
                        placeholder="Success"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-emerald-600">Highlight Word (Emerald)</Label>
                      <Input
                        value={editingPage.headline_highlight || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, headline_highlight: e.target.value })
                        }
                        placeholder="Story"
                        className="border-emerald-300 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <Label>Headline Line 3</Label>
                      <Input
                        value={editingPage.headline_line3 || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, headline_line3: e.target.value })
                        }
                        placeholder="Starts Here"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Subheading</Label>
                    <Textarea
                      value={editingPage.hero_subheading || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, hero_subheading: e.target.value })
                      }
                      placeholder="Supporting text below the headline"
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
                        className="mt-2 h-32 w-full object-cover rounded-lg border"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Search Placeholder</Label>
                      <Input
                        value={editingPage.search_placeholder || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, search_placeholder: e.target.value })
                        }
                        placeholder="Enter postcode..."
                      />
                    </div>
                    <div>
                      <Label>Search Button Text</Label>
                      <Input
                        value={editingPage.search_button_text || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, search_button_text: e.target.value })
                        }
                        placeholder="Find Lessons"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-400" /> Rating Value
                      </Label>
                      <Input
                        value={editingPage.rating_value || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, rating_value: e.target.value })
                        }
                        placeholder="4.9"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <Label>Show Finance Badges</Label>
                      <Switch
                        checked={editingPage.show_finance_badges ?? true}
                        onCheckedChange={(checked) =>
                          setEditingPage({ ...editingPage, show_finance_badges: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Instructor Tab */}
              <TabsContent value="instructor" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Instructor/School Name
                    </Label>
                    <Input
                      value={editingPage.instructor_name || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, instructor_name: e.target.value })
                      }
                      placeholder="Demo Driving School"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone Number
                      </Label>
                      <Input
                        value={editingPage.instructor_phone || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, instructor_phone: e.target.value })
                        }
                        placeholder="07700 900123"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Postcode
                      </Label>
                      <Input
                        value={editingPage.instructor_postcode || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, instructor_postcode: e.target.value })
                        }
                        placeholder="SW1A 1AA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Instructor Grade</Label>
                      <Select
                        value={editingPage.instructor_grade || "A"}
                        onValueChange={(value) =>
                          setEditingPage({ ...editingPage, instructor_grade: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Grade A</SelectItem>
                          <SelectItem value="B">Grade B</SelectItem>
                          <SelectItem value="Trainee">Trainee (Pink Badge)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <Label>CPD Certified</Label>
                      <Switch
                        checked={editingPage.cpd_certified ?? true}
                        onCheckedChange={(checked) =>
                          setEditingPage({ ...editingPage, cpd_certified: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
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
              </TabsContent>

              {/* CTA Tab */}
              <TabsContent value="cta" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>CTA Heading</Label>
                    <Input
                      value={editingPage.cta_heading || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, cta_heading: e.target.value })
                      }
                      placeholder="Ready to Start Your Driving Journey?"
                    />
                  </div>

                  <div>
                    <Label>CTA Subtext</Label>
                    <Textarea
                      value={editingPage.cta_subtext || ""}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, cta_subtext: e.target.value })
                      }
                      placeholder="Book your first lesson today..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Button Text</Label>
                      <Input
                        value={editingPage.cta_button_text || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, cta_button_text: e.target.value })
                        }
                        placeholder="Book a Lesson"
                      />
                    </div>
                    <div>
                      <Label>Phone Button Text</Label>
                      <Input
                        value={editingPage.cta_phone_text || ""}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, cta_phone_text: e.target.value })
                        }
                        placeholder="Call Now"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4">
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
              </TabsContent>

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
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
