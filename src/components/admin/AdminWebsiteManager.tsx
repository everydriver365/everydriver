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

interface AdminWebsiteManagerProps {
  instructorId: string;
  instructorSlug: string;
  instructorName: string;
}

export function AdminWebsiteManager({ instructorId, instructorSlug, instructorName }: AdminWebsiteManagerProps) {
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
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Mini Website - {instructorName}
        </h3>
        <a
          href={`${baseUrl}/i/${instructorSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View Site <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-2">
        {pages.map((page) => (
          <div key={page.id} className="flex items-center justify-between p-2 border rounded text-sm bg-background">
            <div className="flex items-center gap-2">
              {page.is_published ? (
                <Eye className="h-3 w-3 text-green-500" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
              <span>{page.page_title}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => handleEditClick(e, page)}
              type="button"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingPage?.page_title}</DialogTitle>
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
