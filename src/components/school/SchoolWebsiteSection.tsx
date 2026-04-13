import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ExternalLink, Globe, Lock, Save, Sparkles, Copy } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import type { SchoolRecord } from "@/hooks/useSchoolData";

interface ContentBlock {
  type: "text" | "features";
  title?: string;
  content?: string;
  items?: string[];
}

interface WebsitePage {
  id: string;
  page_type: string;
  page_title: string;
  hero_heading: string | null;
  hero_subheading: string | null;
  content_blocks: ContentBlock[];
  is_published: boolean;
}

interface SchoolWebsiteSectionProps {
  school: SchoolRecord;
  onRefresh: () => void;
}

export default function SchoolWebsiteSection({ school, onRefresh }: SchoolWebsiteSectionProps) {
  const { isDemo } = useSchoolDemo();
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [brandColour, setBrandColour] = useState(school.brand_colour || "#3b82f6");
  const [buttonColor, setButtonColor] = useState((school as any).website_button_color || "");

  const isMultiPage = (school as any).website_tier === "multi_page";
  const siteUrl = `${window.location.origin}/school/${school.slug}`;

  useEffect(() => {
    if (isDemo) {
      setPages([
        { id: "demo-1", page_type: "home", page_title: "Home", hero_heading: "Welcome to " + school.name, hero_subheading: "Professional driving instruction", content_blocks: [], is_published: true },
        { id: "demo-2", page_type: "about", page_title: "About Us", hero_heading: "About " + school.name, hero_subheading: "Learn more", content_blocks: [], is_published: true },
        { id: "demo-3", page_type: "instructors", page_title: "Our Instructors", hero_heading: "Meet Our Team", hero_subheading: "Qualified professionals", content_blocks: [], is_published: true },
        { id: "demo-4", page_type: "contact", page_title: "Contact", hero_heading: "Get in Touch", hero_subheading: "Ready to learn?", content_blocks: [], is_published: true },
      ]);
      setHeroHeading("Welcome to " + school.name);
      setHeroSubheading("Professional driving instruction");
      setLoading(false);
      return;
    }
    fetchPages();
  }, [school.id]);

  const fetchPages = async () => {
    const { data } = await supabase
      .from("school_website_pages")
      .select("*")
      .eq("school_id", school.id)
      .order("display_order");
    if (data) {
      const mapped = data.map((p) => ({
        ...p,
        content_blocks: (p.content_blocks as unknown as ContentBlock[]) || [],
      }));
      setPages(mapped);
      const home = mapped.find((p) => p.page_type === "home");
      if (home) {
        setHeroHeading(home.hero_heading || "");
        setHeroSubheading(home.hero_subheading || "");
      }
    }
    setLoading(false);
  };

  const saveHomepage = async () => {
    if (isDemo) { toast.info("Demo mode — changes not saved"); return; }
    setSaving(true);
    const home = pages.find((p) => p.page_type === "home");
    if (home) {
      await supabase.from("school_website_pages").update({
        hero_heading: heroHeading,
        hero_subheading: heroSubheading,
      }).eq("id", home.id);
    }
    // Update school brand colours
    await supabase.from("schools").update({
      brand_colour: brandColour,
      website_button_color: buttonColor || null,
    }).eq("id", school.id);

    toast.success("Website settings saved");
    setSaving(false);
    onRefresh();
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(siteUrl);
    toast.success("Website URL copied");
  };

  return (
    <div className="space-y-6">
      {/* Tier banner */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  School Website
                  <Badge variant={isMultiPage ? "default" : "secondary"}>
                    {isMultiPage ? "Multi-Page" : "Single Page"}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isMultiPage ? "Full multi-page website with navigation" : "Single homepage with instructor cards and contact info"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="h-4 w-4 mr-1" /> Copy URL
              </Button>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm"><ExternalLink className="h-4 w-4 mr-1" /> Preview</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade prompt */}
      {!isMultiPage && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Upgrade to Multi-Page Website</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Unlock About, Instructors, and Contact pages with full navigation. Give your school a professional online presence.
              </p>
              <Button size="sm" disabled={isDemo}>
                <Lock className="h-4 w-4 mr-1" /> Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Homepage editor */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hero Heading</Label>
            <Input value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} placeholder="Welcome to your school" />
          </div>
          <div>
            <Label>Hero Subheading</Label>
            <Textarea value={heroSubheading} onChange={(e) => setHeroSubheading(e.target.value)} rows={2} placeholder="Professional driving instruction..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Brand Colour</Label>
              <div className="flex gap-2">
                <input type="color" value={brandColour} onChange={(e) => setBrandColour(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
                <Input value={brandColour} onChange={(e) => setBrandColour(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Button Colour (optional)</Label>
              <div className="flex gap-2">
                <input type="color" value={buttonColor || brandColour} onChange={(e) => setButtonColor(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
                <Input value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} placeholder="Uses brand colour" className="flex-1" />
              </div>
            </div>
          </div>
          <Button onClick={saveHomepage} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Pages list */}
      <Card>
        <CardHeader>
          <CardTitle>Website Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pages.map((page) => {
              const isLocked = !isMultiPage && page.page_type !== "home";
              return (
                <div key={page.id} className={`flex items-center justify-between p-3 rounded-lg border ${isLocked ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Badge variant={page.is_published ? "default" : "secondary"} className="text-xs">
                      {page.is_published ? "Live" : "Draft"}
                    </Badge>
                    <span className="font-medium">{page.page_title}</span>
                    <span className="text-xs text-muted-foreground">/{page.page_type === "home" ? "" : page.page_type}</span>
                  </div>
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <a href={`${siteUrl}${page.page_type === "home" ? "" : "/" + page.page_type}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom domain */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect a custom domain to your school website. Contact support or configure via your domain registrar.
          </p>
          {school.custom_domain ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{school.custom_domain}</Badge>
              <span className="text-xs text-green-600">Connected</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No custom domain configured. Your site is available at <code className="text-xs bg-muted px-1 py-0.5 rounded">{siteUrl}</code></p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
