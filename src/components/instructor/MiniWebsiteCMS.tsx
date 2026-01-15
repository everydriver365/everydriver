import { useState } from "react";
import { Globe, Edit2, Eye, EyeOff, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstructorWebsitePages, WebsitePage } from "@/hooks/useInstructorWebsitePages";
import { toast } from "sonner";

interface MiniWebsiteCMSProps {
  instructorId: string;
  instructorSlug: string;
}

export function MiniWebsiteCMS({ instructorId, instructorSlug }: MiniWebsiteCMSProps) {
  const { pages, loading, updatePage } = useInstructorWebsitePages(instructorId);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [saving, setSaving] = useState(false);

  const baseUrl = window.location.origin;

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

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Globe className="h-4 w-4" />
        <span>Your website:</span>
        <a
          href={`${baseUrl}/i/${instructorSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {baseUrl}/i/{instructorSlug}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-2">
        {pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-background"
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
                  /i/{instructorSlug}{page.page_type !== "home" ? `/${page.page_type}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`${baseUrl}/i/${instructorSlug}${page.page_type !== "home" ? `/${page.page_type}` : ""}`}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingPage?.page_title} Page</DialogTitle>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Published</Label>
                <Switch
                  checked={editingPage.is_published}
                  onCheckedChange={(checked) =>
                    setEditingPage({ ...editingPage, is_published: checked })
                  }
                />
              </div>
              <div>
                <Label>Hero Heading</Label>
                <Input
                  value={editingPage.hero_heading || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, hero_heading: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Hero Subheading</Label>
                <Textarea
                  value={editingPage.hero_subheading || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, hero_subheading: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Hero Image URL</Label>
                <Input
                  value={editingPage.hero_image_url || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, hero_image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Meta Title (SEO)</Label>
                <Input
                  value={editingPage.meta_title || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, meta_title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Meta Description (SEO)</Label>
                <Textarea
                  value={editingPage.meta_description || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, meta_description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingPage(null)} className="flex-1" type="button">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1" type="button">
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
