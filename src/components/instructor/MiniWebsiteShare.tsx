import { useState, useEffect } from "react";
import { 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode, 
  Link as LinkIcon, 
  Share2, 
  Globe, 
  Mail,
  MessageCircle,
  Facebook,
  Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MiniWebsiteShareProps {
  instructorId: string;
}

export function MiniWebsiteShare({ instructorId }: MiniWebsiteShareProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [customDomain, setCustomDomain] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [editingDomain, setEditingDomain] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    fetchSlug();
  }, [instructorId]);

  const fetchSlug = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("app_slug, name, personal_website_url")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      setSlug(data.app_slug);
      setName(data.name);
      setCustomDomain(data.personal_website_url || "");
      setNewSlug(data.app_slug || generateSlug(data.name));
      setNewDomain(data.personal_website_url || "");
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

  const displayUrl = customDomain || miniWebsiteUrl;

  const handleCopy = async () => {
    if (!displayUrl) return;
    
    try {
      await navigator.clipboard.writeText(displayUrl);
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

  const handleSaveDomain = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ personal_website_url: newDomain || null })
        .eq("id", instructorId);

      if (error) throw error;

      setCustomDomain(newDomain);
      setEditingDomain(false);
      toast({ 
        title: newDomain ? "Custom domain saved" : "Custom domain removed", 
        description: newDomain 
          ? "Remember to set up DNS to point to your mini-website" 
          : "Your mini-website will use the default URL"
      });
    } catch (error) {
      console.error("Error saving domain:", error);
      toast({ title: "Error", description: "Failed to save domain", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Share functions
  const shareOnWhatsApp = () => {
    if (!displayUrl) return;
    const text = `Check out my driving instructor profile: ${displayUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnFacebook = () => {
    if (!displayUrl) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(displayUrl)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (!displayUrl) return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(displayUrl)}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!displayUrl) return;
    const subject = `Check out ${name}'s Driving Lessons`;
    const body = `Hi,\n\nI wanted to share my driving instructor profile with you:\n\n${displayUrl}\n\nBook your lessons today!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareNative = async () => {
    if (!displayUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: `${name} - Driving Instructor`,
        text: 'Check out my driving instructor profile',
        url: displayUrl,
      });
    } catch (error) {
      // User cancelled or share failed
    }
  };

  // QR Code using Google Charts API (simple, no library needed)
  const qrCodeUrl = displayUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(displayUrl)}`
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
    <div className="space-y-6">
      {/* URL Display/Edit */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Your Mini-Website URL
        </Label>
        
        {editingSlug ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center rounded-2xl border bg-muted/50">
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
              disabled={!displayUrl}
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

      <Separator />

      {/* Custom Domain Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Custom Domain (Optional)
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Connect your own domain (e.g., www.johnsdrivingschool.com) to your mini-website
        </p>

        {editingDomain ? (
          <div className="space-y-3">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="https://www.yourdomain.com"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveDomain} disabled={saving} size="sm">
                {saving ? "Saving..." : "Save Domain"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditingDomain(false);
                  setNewDomain(customDomain);
                }}
              >
                Cancel
              </Button>
            </div>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 mt-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> After saving your domain, you'll need to set up DNS records with your domain provider. 
                Point your domain to this app's URL or contact support for help with DNS configuration.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={customDomain || "No custom domain set"}
              readOnly
              className="bg-muted/50 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingDomain(true)}
            >
              {customDomain ? "Edit" : "Add Domain"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Share Buttons */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Your Website
        </Label>
        
        <div className="flex flex-wrap gap-2">
          {typeof navigator.share === 'function' && (
            <Button
              variant="outline"
              size="sm"
              onClick={shareNative}
              disabled={!displayUrl}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={shareOnWhatsApp}
            disabled={!displayUrl}
            className="text-green-600 hover:text-green-700"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareOnFacebook}
            disabled={!displayUrl}
            className="text-[#0075c9] hover:text-[#005a9e]"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareOnLinkedIn}
            disabled={!displayUrl}
            className="text-sky-600 hover:text-sky-700"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareViaEmail}
            disabled={!displayUrl}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => displayUrl && window.open(displayUrl, '_blank')}
          disabled={!displayUrl}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Preview Site
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQR(!showQR)}
          disabled={!displayUrl}
        >
          <QrCode className="h-4 w-4 mr-2" />
          {showQR ? "Hide QR Code" : "Show QR Code"}
        </Button>
      </div>

      {/* QR Code Display */}
      {showQR && qrCodeUrl && (
        <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border">
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
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Share your mini-website on social media, business cards, or anywhere you promote your services. Pupils can view your profile, courses, and book directly.
        </p>
      </div>
    </div>
  );
}
