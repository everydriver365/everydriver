import { useState, useEffect } from "react";
import { GripVertical, Plus, Trash2, Loader2, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BLOCK_TYPES = [
  { value: "text", label: "Text Block" },
  { value: "features", label: "Features List" },
  { value: "cta", label: "CTA Button" },
  { value: "faq", label: "FAQ Accordion" },
  { value: "video", label: "Video Embed" },
  { value: "stats", label: "Stats Counter" },
  { value: "testimonial", label: "Testimonial" },
  { value: "pricing", label: "Pricing Table" },
];

interface ContentBlock {
  type: string;
  title?: string;
  content?: string;
  items?: string[];
  url?: string;
  question?: string;
  answer?: string;
  stat?: string;
  label?: string;
  price?: string;
}

interface PageData {
  id: string;
  page_type: string;
  page_title: string;
  hero_heading: string | null;
  hero_subheading: string | null;
  content_blocks: ContentBlock[];
  meta_title: string | null;
  meta_description: string | null;
}

interface Props {
  instructorId: string;
}

export function WebsitePageEditor({ instructorId }: Props) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  useEffect(() => {
    fetchPages();
  }, [instructorId]);

  const fetchPages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("instructor_website_pages")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("display_order");
    const mapped = (data || []).map((p: any) => ({
      ...p,
      content_blocks: Array.isArray(p.content_blocks) ? p.content_blocks : [],
    }));
    setPages(mapped);
    if (mapped.length > 0 && !selectedPage) {
      selectPage(mapped[0]);
    }
    setLoading(false);
  };

  const selectPage = (page: PageData) => {
    setSelectedPage(page);
    setBlocks(Array.isArray(page.content_blocks) ? [...page.content_blocks] : []);
    setMetaTitle(page.meta_title || "");
    setMetaDesc(page.meta_description || "");
  };

  const addBlock = (type: string) => {
    const newBlock: ContentBlock = { type };
    if (type === "text") { newBlock.title = ""; newBlock.content = ""; }
    if (type === "features") { newBlock.title = ""; newBlock.items = [""]; }
    if (type === "cta") { newBlock.title = ""; newBlock.url = ""; }
    if (type === "faq") { newBlock.question = ""; newBlock.answer = ""; }
    if (type === "video") { newBlock.url = ""; newBlock.title = ""; }
    if (type === "stats") { newBlock.stat = ""; newBlock.label = ""; }
    if (type === "testimonial") { newBlock.content = ""; newBlock.title = ""; }
    if (type === "pricing") { newBlock.title = ""; newBlock.price = ""; newBlock.items = [""]; }
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index: number, field: string, value: any) => {
    const updated = [...blocks];
    (updated[index] as any)[field] = value;
    setBlocks(updated);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const updated = [...blocks];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setBlocks(updated);
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructor_website_pages")
        .update({
          content_blocks: blocks as any,
          meta_title: metaTitle || null,
          meta_description: metaDesc || null,
        })
        .eq("id", selectedPage.id);
      if (error) throw error;
      toast.success("Page saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    const typeLabel = BLOCK_TYPES.find(bt => bt.value === block.type)?.label || block.type;
    return (
      <Card key={index} className="border-l-4 border-l-primary/30">
        <CardContent className="pt-3 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button className="p-0.5 hover:bg-muted rounded" onClick={() => moveBlock(index, index - 1)}>▲</button>
              <button className="p-0.5 hover:bg-muted rounded" onClick={() => moveBlock(index, index + 1)}>▼</button>
            </div>
            <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeBlock(index)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>

          {(block.type === "text" || block.type === "testimonial") && (
            <>
              <Input placeholder="Title" value={block.title || ""} onChange={e => updateBlock(index, "title", e.target.value)} className="h-8 text-xs" />
              <Textarea placeholder="Content" value={block.content || ""} onChange={e => updateBlock(index, "content", e.target.value)} rows={3} className="text-xs" />
            </>
          )}
          {block.type === "features" && (
            <>
              <Input placeholder="Section title" value={block.title || ""} onChange={e => updateBlock(index, "title", e.target.value)} className="h-8 text-xs" />
              {(block.items || []).map((item, i) => (
                <Input key={i} placeholder={`Feature ${i + 1}`} value={item} onChange={e => {
                  const items = [...(block.items || [])];
                  items[i] = e.target.value;
                  updateBlock(index, "items", items);
                }} className="h-8 text-xs" />
              ))}
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => updateBlock(index, "items", [...(block.items || []), ""])}>+ Add Feature</Button>
            </>
          )}
          {block.type === "cta" && (
            <>
              <Input placeholder="Button text" value={block.title || ""} onChange={e => updateBlock(index, "title", e.target.value)} className="h-8 text-xs" />
              <Input placeholder="Link URL" value={block.url || ""} onChange={e => updateBlock(index, "url", e.target.value)} className="h-8 text-xs" />
            </>
          )}
          {block.type === "faq" && (
            <>
              <Input placeholder="Question" value={block.question || ""} onChange={e => updateBlock(index, "question", e.target.value)} className="h-8 text-xs" />
              <Textarea placeholder="Answer" value={block.answer || ""} onChange={e => updateBlock(index, "answer", e.target.value)} rows={2} className="text-xs" />
            </>
          )}
          {block.type === "video" && (
            <>
              <Input placeholder="Video title" value={block.title || ""} onChange={e => updateBlock(index, "title", e.target.value)} className="h-8 text-xs" />
              <Input placeholder="YouTube/Vimeo URL" value={block.url || ""} onChange={e => updateBlock(index, "url", e.target.value)} className="h-8 text-xs" />
            </>
          )}
          {block.type === "stats" && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Stat (e.g. 95%)" value={block.stat || ""} onChange={e => updateBlock(index, "stat", e.target.value)} className="h-8 text-xs" />
              <Input placeholder="Label" value={block.label || ""} onChange={e => updateBlock(index, "label", e.target.value)} className="h-8 text-xs" />
            </div>
          )}
          {block.type === "pricing" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Package name" value={block.title || ""} onChange={e => updateBlock(index, "title", e.target.value)} className="h-8 text-xs" />
                <Input placeholder="Price (£)" value={block.price || ""} onChange={e => updateBlock(index, "price", e.target.value)} className="h-8 text-xs" />
              </div>
              {(block.items || []).map((item, i) => (
                <Input key={i} placeholder={`Includes ${i + 1}`} value={item} onChange={e => {
                  const items = [...(block.items || [])];
                  items[i] = e.target.value;
                  updateBlock(index, "items", items);
                }} className="h-8 text-xs" />
              ))}
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => updateBlock(index, "items", [...(block.items || []), ""])}>+ Add Item</Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Page selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {pages.map(page => (
          <Button key={page.id} variant={selectedPage?.id === page.id ? "default" : "outline"} size="sm" className="text-xs shrink-0" onClick={() => selectPage(page)}>
            {page.page_title}
          </Button>
        ))}
      </div>

      {selectedPage && (
        <>
          {/* SEO & Hero settings */}
          <Card>
            <CardContent className="pt-3 pb-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hero Heading</Label>
                  <Input value={selectedPage.hero_heading || ""} onChange={e => setSelectedPage({...selectedPage, hero_heading: e.target.value})} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hero Subheading</Label>
                  <Input value={selectedPage.hero_subheading || ""} onChange={e => setSelectedPage({...selectedPage, hero_subheading: e.target.value})} className="h-8 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Meta Title (SEO)</Label>
                  <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Page title for search engines" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meta Description (SEO)</Label>
                  <Input value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Page description for search engines" className="h-8 text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content blocks */}
          <div className="space-y-2">
            {blocks.map((block, i) => renderBlockEditor(block, i))}
          </div>

          {/* Add block */}
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(bt => (
              <Button key={bt.value} variant="outline" size="sm" className="text-xs gap-1" onClick={() => addBlock(bt.value)}>
                <Plus className="h-3 w-3" /> {bt.label}
              </Button>
            ))}
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Page
          </Button>
        </>
      )}
    </div>
  );
}
