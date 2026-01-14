import { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, QrCode, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MiniWebsiteShareProps {
  instructorId: string;
}

export function MiniWebsiteShare({ instructorId }: MiniWebsiteShareProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    fetchSlug();
  }, [instructorId]);

  const fetchSlug = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("app_slug, name")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      setSlug(data.app_slug);
      setName(data.name);
      setNewSlug(data.app_slug || generateSlug(data.name));
    } catch (error) {
      console.error("Error fetching slug:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const miniWebsiteUrl = slug 
    ? `${window.location.origin}/i/${slug}`
    : null;

  const handleCopy = async () => {
    if (!miniWebsiteUrl) return;
    
    try {
      await navigator.clipboard.writeText(miniWebsiteUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share it with potential pupils" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Copy failed", description: "Please copy the link manually", variant: "destructive" });
    }
  };

  const handleSaveSlug = async () => {
    if (!newSlug.trim()) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL slug", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Check if slug is already taken
      const { data: existing } = await supabase
        .from("instructors")
        .select("id")
        .eq("app_slug", newSlug)
        .neq("id", instructorId)
        .single();

      if (existing) {
        toast({ 
          title: "URL already taken", 
          description: "Please choose a different URL", 
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("instructors")
        .update({ app_slug: newSlug })
        .eq("id", instructorId);

      if (error) throw error;

      setSlug(newSlug);
      setEditingSlug(false);
      toast({ title: "URL updated", description: "Your mini-website URL has been changed" });
    } catch (error) {
      console.error("Error saving slug:", error);
      toast({ title: "Error", description: "Failed to update URL", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // QR Code using Google Charts API (simple, no library needed)
  const qrCodeUrl = miniWebsiteUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(miniWebsiteUrl)}`
    : null;

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* URL Display/Edit */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Your Mini-Website URL
        </Label>
        
        {editingSlug ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center rounded-md border bg-muted/50">
                <span className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap border-r bg-muted">
                  {window.location.origin}/i/
                </span>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="border-0 bg-transparent focus-visible:ring-0"
                  placeholder="your-url"
                />
              </div>
            </div>
            <Button onClick={handleSaveSlug} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setEditingSlug(false);
                setNewSlug(slug || generateSlug(name));
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={miniWebsiteUrl || "No URL set"}
              readOnly
              className="bg-muted/50 text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!miniWebsiteUrl}
              title="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {!editingSlug && (
          <Button 
            variant="link" 
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => setEditingSlug(true)}
          >
            Change URL
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => miniWebsiteUrl && window.open(miniWebsiteUrl, '_blank')}
          disabled={!miniWebsiteUrl}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Preview Site
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQR(!showQR)}
          disabled={!miniWebsiteUrl}
        >
          <QrCode className="h-4 w-4 mr-2" />
          {showQR ? "Hide QR Code" : "Show QR Code"}
        </Button>
      </div>

      {/* QR Code Display */}
      {showQR && qrCodeUrl && (
        <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
          <img 
            src={qrCodeUrl} 
            alt="QR Code for mini-website"
            className="w-40 h-40"
          />
          <p className="text-xs text-muted-foreground text-center">
            Scan to visit your mini-website
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrCodeUrl;
              link.download = `qr-code-${slug}.png`;
              link.click();
            }}
          >
            Download QR Code
          </Button>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Share your mini-website on social media, business cards, or anywhere you promote your services. Pupils can view your profile, courses, and book directly.
        </p>
      </div>
    </div>
  );
}
