import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SchoolSlugManagerProps {
  school: any;
  onUpdate: () => void;
}

export default function SchoolSlugManager({ school, onUpdate }: SchoolSlugManagerProps) {
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState(school.slug || "");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const bookingUrl = school.slug
    ? `${window.location.origin}/school/${school.slug}`
    : null;

  const handleCopy = () => {
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied!");
    }
  };

  const handleSave = async () => {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");
    if (!cleanSlug) { toast.error("Please enter a valid slug"); return; }

    setSaving(true);
    const { error } = await supabase
      .from("schools")
      .update({ slug: cleanSlug } as any)
      .eq("id", school.id);

    setSaving(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "This URL is already taken" : "Failed to update");
      return;
    }
    toast.success("Booking URL updated!");
    setEditing(false);
    onUpdate();
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Booking Page Link</span>
        </div>

        {bookingUrl && !editing ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded truncate">{bookingUrl}</code>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">/school/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-school"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              {school.slug && (
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setSlug(school.slug); }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
