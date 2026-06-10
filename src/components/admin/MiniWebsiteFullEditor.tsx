import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Loader2,
  Palette,
  Type,
  Layout,
  Globe,
  Image as ImageIcon,
  FileText,
  Settings,
  ExternalLink,
  Upload,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Link2,
  Phone,
  Mail,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstructorWebsitePages, WebsitePage } from "@/hooks/useInstructorWebsitePages";

interface MiniWebsite {
  id: string;
  name: string;
  email: string | null;
  app_slug: string | null;
  website_theme: string | null;
  website_font?: string | null;
  website_header_style?: string | null;
  website_header_bg?: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  is_active: boolean;
  brand_colour: string | null;
  secondary_colour: string | null;
  website_button_color: string | null;
  website_footer_bg: string | null;
  website_text_color?: string | null;
  website_heading_color?: string | null;
  website_menu_text_color?: string | null;
  hero_overlay_color?: string | null;
  hero_overlay_opacity?: number | null;
  hero_show_logo?: boolean | null;
  logo_url: string | null;
  hero_image_url?: string | null;
  bio: string | null;
  phone?: string | null;
  mini_website_domain_id: string | null;
}

interface DomainOrder {
  id: string;
  domain_name: string;
  status: string;
  mini_website_linked: boolean;
}

interface MiniWebsiteFullEditorProps {
  website: MiniWebsite;
  domains: DomainOrder[];
  onClose: () => void;
  onSave: () => void;
}

const presetThemes = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional",
    preview: { primary: "#1e3a5f", secondary: "#3b82f6", button: "#3b82f6", footer: "#111827", font: "Inter", headerStyle: "solid" },
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless elegance",
    preview: { primary: "#1f2937", secondary: "#d4a574", button: "#d4a574", footer: "#1f2937", font: "Playfair Display", headerStyle: "solid" },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Eye-catching and vibrant",
    preview: { primary: "#dc2626", secondary: "#fbbf24", button: "#dc2626", footer: "#18181b", font: "Montserrat", headerStyle: "solid" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and clean",
    preview: { primary: "#ffffff", secondary: "#000000", button: "#000000", footer: "#fafafa", font: "Inter", headerStyle: "transparent" },
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated style",
    preview: { primary: "#0f172a", secondary: "#a855f7", button: "#a855f7", footer: "#020617", font: "Playfair Display", headerStyle: "gradient" },
  },
  {
    id: "nature",
    name: "Nature",
    description: "Earthy and calming",
    preview: { primary: "#166534", secondary: "#84cc16", button: "#22c55e", footer: "#14532d", font: "Poppins", headerStyle: "solid" },
  },
];

const fonts = [
  { id: "Inter", name: "Inter", sample: "Modern & Clean" },
  { id: "Poppins", name: "Poppins", sample: "Friendly & Approachable" },
  { id: "Playfair Display", name: "Playfair Display", sample: "Elegant & Refined" },
  { id: "Montserrat", name: "Montserrat", sample: "Bold & Contemporary" },
  { id: "Roboto", name: "Roboto", sample: "Professional & Reliable" },
];

const headerStyles = [
  { id: "solid", name: "Solid", description: "Solid color background" },
  { id: "transparent", name: "Transparent", description: "See-through header" },
  { id: "gradient", name: "Gradient", description: "Color gradient effect" },
];

export function MiniWebsiteFullEditor({ website, domains, onClose, onSave }: MiniWebsiteFullEditorProps) {
  const [editData, setEditData] = useState<MiniWebsite>({ ...website });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Sync editData when website prop changes (e.g., after parent refetch)
  // Only update fields that weren't locally modified (i.e., from uploads)
  useEffect(() => {
    setEditData(prev => ({
      ...website,
      // Preserve locally uploaded images if they exist and differ from the website prop
      logo_url: prev.logo_url !== website.logo_url && prev.logo_url?.includes('?t=') 
        ? prev.logo_url 
        : website.logo_url,
      hero_image_url: prev.hero_image_url !== website.hero_image_url && prev.hero_image_url?.includes('?t=') 
        ? prev.hero_image_url 
        : website.hero_image_url,
    }));
  }, [website]);

  // Fetch website pages for this instructor
  const { pages, loading: pagesLoading, updatePage } = useInstructorWebsitePages(website.id);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [seoEdits, setSeoEdits] = useState<Record<string, { meta_title?: string | null; meta_description?: string | null }>>({});
  const [savingSEO, setSavingSEO] = useState(false);

  const getSeoValue = (pageId: string, field: "meta_title" | "meta_description", original: string | null) => {
    if (seoEdits[pageId] && field in seoEdits[pageId]) return seoEdits[pageId][field] || "";
    return original || "";
  };

  const handleSeoChange = (pageId: string, field: "meta_title" | "meta_description", value: string) => {
    setSeoEdits(prev => ({
      ...prev,
      [pageId]: { ...prev[pageId], [field]: value || null },
    }));
  };

  const handleSaveAllSEO = async () => {
    setSavingSEO(true);
    try {
      const entries = Object.entries(seoEdits);
      for (const [pageId, updates] of entries) {
        await updatePage(pageId, updates);
      }
      setSeoEdits({});
      toast.success("SEO settings saved");
    } catch {
      toast.error("Failed to save SEO settings");
    } finally {
      setSavingSEO(false);
    }
  };

  // Available domains (not linked or linked to this website)
  // Also include domains owned by this instructor that aren't linked elsewhere
  const instructorDomains = domains.filter(d => !d.mini_website_linked || d.id === website.mini_website_domain_id);
  
  // Find if this instructor has any purchased domains (for auto-prefill)
  const ownedDomain = domains.find(d => d.id === website.mini_website_domain_id);
  const firstAvailableDomain = instructorDomains.find(d => !d.mini_website_linked);
  
  // Initialize domain state based on existing data or auto-prefill
  const [selectedDomainId, setSelectedDomainId] = useState<string>(() => {
    // If already linked to a purchased domain, use that
    if (website.mini_website_domain_id) return website.mini_website_domain_id;
    // Auto-prefill with first available purchased domain
    if (firstAvailableDomain) return firstAvailableDomain.id;
    return "";
  });
  
  const [manualDomain, setManualDomain] = useState<string>(website.custom_domain || "");
  
  const [domainMode, setDomainMode] = useState<"none" | "manual" | "purchased" | "wildcard">(() => {
    // If linked to purchased domain, show purchased mode
    if (website.mini_website_domain_id) return "purchased";
    // If custom domain set manually, show manual mode
    if (website.custom_domain) return "manual";
    // If there's a purchased domain available, auto-select it
    if (firstAvailableDomain) return "purchased";
    // Default to wildcard subdomain
    return "wildcard";
  });
  
  // Generate the wildcard subdomain URL (everydriver.co.uk for instructor mini-websites)
  const wildcardSubdomain = editData.app_slug ? `${editData.app_slug}.everydriver.co.uk` : null;

  const handleApplyPreset = (preset: typeof presetThemes[0]) => {
    setEditData({
      ...editData,
      website_theme: preset.id,
      website_font: preset.preview.font,
      website_header_style: preset.preview.headerStyle,
      brand_colour: preset.preview.primary,
      secondary_colour: preset.preview.secondary,
      website_button_color: preset.preview.button,
      website_footer_bg: preset.preview.footer,
    });
  };

  const handleImageUpload = async (
    file: File,
    type: "logo" | "hero",
    setUploading: (v: boolean) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${editData.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(fileName);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      
      if (type === "logo") {
        setEditData({ ...editData, logo_url: urlWithCacheBuster });
      } else {
        setEditData({ ...editData, hero_image_url: urlWithCacheBuster });
      }
      toast.success(`${type === "logo" ? "Logo" : "Hero image"} uploaded!`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determine custom domain based on mode
      let finalCustomDomain: string | null = null;
      let finalDomainId: string | null = null;

      if (domainMode === "wildcard" && editData.app_slug) {
        // Use the auto-generated drive365 subdomain
        finalCustomDomain = `${editData.app_slug}.everydriver.co.uk`;
      } else if (domainMode === "manual" && manualDomain.trim()) {
        // Clean domain: remove protocol and trailing slashes
        finalCustomDomain = manualDomain
          .trim()
          .replace(/^https?:\/\//, "")
          .replace(/\/+$/, "")
          .toLowerCase();
      } else if (domainMode === "purchased" && selectedDomainId) {
        const selectedDomain = domains.find(d => d.id === selectedDomainId);
        finalCustomDomain = selectedDomain?.domain_name || null;
        finalDomainId = selectedDomainId;
      }
      
      const updatePayload = {
        app_slug: editData.app_slug,
        website_theme: editData.website_theme,
        website_font: editData.website_font,
        website_header_style: editData.website_header_style,
        website_header_bg: editData.website_header_bg,
        brand_colour: editData.brand_colour,
        secondary_colour: editData.secondary_colour,
        website_button_color: editData.website_button_color,
        website_footer_bg: editData.website_footer_bg,
        website_text_color: editData.website_text_color,
        website_heading_color: editData.website_heading_color,
        website_menu_text_color: editData.website_menu_text_color,
        hero_overlay_color: editData.hero_overlay_color,
        hero_overlay_opacity: editData.hero_overlay_opacity,
        hero_show_logo: editData.hero_show_logo,
        logo_url: editData.logo_url,
        hero_image_url: editData.hero_image_url,
        bio: editData.bio,
        phone: editData.phone,
        is_active: editData.is_active,
        custom_domain: finalCustomDomain,
        custom_domain_verified: domainMode === "wildcard" ? true : false,
        mini_website_domain_id: finalDomainId,
      };
      
      const { error } = await supabase
        .from("instructors")
        .update(updatePayload)
        .eq("id", editData.id);

      if (error) throw error;

      // Update domain_orders table for purchased domains
      if (finalDomainId && finalDomainId !== website.mini_website_domain_id) {
        await supabase.from("domain_orders").update({ mini_website_linked: true }).eq("id", finalDomainId);
      }
      if (website.mini_website_domain_id && website.mini_website_domain_id !== finalDomainId) {
        await supabase.from("domain_orders").update({ mini_website_linked: false }).eq("id", website.mini_website_domain_id);
      }

      toast.success("Website saved successfully");
      
      // Refresh parent data silently so next open has latest data, but don't close editor
      // We do this asynchronously to not block the UI
      onSave();
    } catch (error) {
      console.error("Error saving website:", error);
      toast.error("Failed to save website");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePage = async () => {
    if (!editingPage) return;
    setSavingPage(true);
    const result = await updatePage(editingPage.id, {
      hero_heading: editingPage.hero_heading,
      hero_subheading: editingPage.hero_subheading,
      hero_image_url: editingPage.hero_image_url,
      is_published: editingPage.is_published,
      meta_title: editingPage.meta_title,
      meta_description: editingPage.meta_description,
    });
    setSavingPage(false);
    if (result.success) {
      toast.success("Page saved");
      setEditingPage(null);
    } else {
      toast.error("Failed to save page");
    }
  };

  const getWebsiteUrl = () => {
    if (editData.custom_domain && !editData.custom_domain.endsWith('.everydriver.co.uk')) return `https://${editData.custom_domain}`;
    if (editData.app_slug) return `https://${editData.app_slug}.everydriver.co.uk`;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{editData.name}</h1>
            <p className="text-sm text-muted-foreground">Mini Website Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getWebsiteUrl() && (
            <Button variant="outline" size="sm" asChild>
              <a href={getWebsiteUrl()!} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="design" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
              <TabsTrigger value="design" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Design</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="pages" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">SEO</span>
              </TabsTrigger>
              <TabsTrigger value="domain" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Domain</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-2">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Design Tab */}
            <TabsContent value="design" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Theme Presets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Theme Presets
                    </CardTitle>
                    <CardDescription>Quick-apply a complete design theme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {presetThemes.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className={cn(
                            "relative p-3 rounded-lg border-2 transition-all text-left",
                            editData.website_theme === preset.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {editData.website_theme === preset.id && (
                            <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                          <div className="mb-2 rounded overflow-hidden border">
                            <div className="h-5" style={{ backgroundColor: preset.preview.primary }} />
                            <div className="h-6 bg-gray-100 flex items-center justify-center">
                              <div className="w-8 h-2 rounded-sm" style={{ backgroundColor: preset.preview.button }} />
                            </div>
                            <div className="h-3" style={{ backgroundColor: preset.preview.footer }} />
                          </div>
                          <p className="font-medium text-sm">{preset.name}</p>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Custom Colors
                    </CardTitle>
                    <CardDescription>Fine-tune your brand colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.brand_colour || "#1e3a5f"}
                            onChange={(e) => setEditData({ ...editData, brand_colour: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.brand_colour || "#1e3a5f"}
                            onChange={(e) => setEditData({ ...editData, brand_colour: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Header / Nav Bar</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.website_header_bg || editData.brand_colour || "#1e3a5f"}
                            onChange={(e) => setEditData({ ...editData, website_header_bg: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.website_header_bg || editData.brand_colour || "#1e3a5f"}
                            onChange={(e) => setEditData({ ...editData, website_header_bg: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary / Accent</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.secondary_colour || "#3b82f6"}
                            onChange={(e) => setEditData({ ...editData, secondary_colour: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.secondary_colour || "#3b82f6"}
                            onChange={(e) => setEditData({ ...editData, secondary_colour: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Button Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.website_button_color || "#3b82f6"}
                            onChange={(e) => setEditData({ ...editData, website_button_color: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.website_button_color || "#3b82f6"}
                            onChange={(e) => setEditData({ ...editData, website_button_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Footer Background</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.website_footer_bg || "#111827"}
                            onChange={(e) => setEditData({ ...editData, website_footer_bg: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.website_footer_bg || "#111827"}
                            onChange={(e) => setEditData({ ...editData, website_footer_bg: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Heading Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.website_heading_color || "#ffffff"}
                            onChange={(e) => setEditData({ ...editData, website_heading_color: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.website_heading_color || "#ffffff"}
                            onChange={(e) => setEditData({ ...editData, website_heading_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Body Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.website_text_color || "#ffffff"}
                            onChange={(e) => setEditData({ ...editData, website_text_color: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.website_text_color || "#ffffff"}
                            onChange={(e) => setEditData({ ...editData, website_text_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Menu Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.website_menu_text_color || "#ffffff"}
                            onChange={(e) => setEditData({ ...editData, website_menu_text_color: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.website_menu_text_color || "#ffffff"}
                            onChange={(e) => setEditData({ ...editData, website_menu_text_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Hero Overlay Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.hero_overlay_color || "#000000"}
                            onChange={(e) => setEditData({ ...editData, hero_overlay_color: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editData.hero_overlay_color || "#000000"}
                            onChange={(e) => setEditData({ ...editData, hero_overlay_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Hero Overlay Opacity: {Math.round((editData.hero_overlay_opacity ?? 0.2) * 100)}%</Label>
                        <Input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={editData.hero_overlay_opacity ?? 0.2}
                          onChange={(e) => setEditData({ ...editData, hero_overlay_opacity: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center justify-between col-span-2">
                        <Label htmlFor="hero-show-logo">Show Logo in Hero</Label>
                        <Switch
                          id="hero-show-logo"
                          checked={editData.hero_show_logo ?? true}
                          onCheckedChange={(checked) => setEditData({ ...editData, hero_show_logo: checked })}
                        />
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="mt-4 rounded-lg overflow-hidden border">
                      <div
                        className="h-10 flex items-center justify-between px-4"
                        style={{ backgroundColor: editData.website_header_bg || editData.brand_colour || "#1e3a5f" }}
                      >
                        <div 
                          className="text-sm font-medium"
                          style={{ color: editData.website_heading_color || "#ffffff" }}
                        >
                          {editData.name}
                        </div>
                        <div 
                          className="flex gap-3 text-xs"
                          style={{ color: editData.website_menu_text_color || "#ffffff" }}
                        >
                          <span>Home</span>
                          <span>About</span>
                          <span>Contact</span>
                        </div>
                      </div>
                      <div className="h-16 bg-gray-100 flex items-center justify-center gap-3">
                        <div
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ backgroundColor: editData.website_button_color || "#3b82f6" }}
                        >
                          Book Now
                        </div>
                        <div
                          className="px-4 py-2 rounded text-sm border-2"
                          style={{ borderColor: editData.secondary_colour || "#3b82f6", color: editData.secondary_colour || "#3b82f6" }}
                        >
                          Learn More
                        </div>
                      </div>
                      <div
                        className="h-6 flex items-center justify-center"
                        style={{ backgroundColor: editData.website_footer_bg || "#111827" }}
                      >
                        <span className="text-white/50 text-xs">© 2025 {editData.name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Font & Header Style */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Typography & Header Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>Font Family</Label>
                      <RadioGroup
                        value={editData.website_font || "Inter"}
                        onValueChange={(value) => setEditData({ ...editData, website_font: value })}
                        className="space-y-2"
                      >
                        {fonts.map((font) => (
                          <div key={font.id} className="flex items-center space-x-3">
                            <RadioGroupItem value={font.id} id={`font-${font.id}`} />
                            <Label htmlFor={`font-${font.id}`} className="cursor-pointer" style={{ fontFamily: font.id }}>
                              <span className="font-medium">{font.name}</span>
                              <span className="text-muted-foreground ml-2 text-sm">— {font.sample}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-3">
                      <Label>Header Style</Label>
                      <RadioGroup
                        value={editData.website_header_style || "solid"}
                        onValueChange={(value) => setEditData({ ...editData, website_header_style: value })}
                        className="space-y-2"
                      >
                        {headerStyles.map((style) => (
                          <div key={style.id} className="flex items-center space-x-3">
                            <RadioGroupItem value={style.id} id={`header-${style.id}`} />
                            <Label htmlFor={`header-${style.id}`} className="cursor-pointer">
                              <span className="font-medium">{style.name}</span>
                              <span className="text-muted-foreground ml-2 text-sm">— {style.description}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Logo</CardTitle>
                    <CardDescription>Your business logo displayed in the header</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editData.logo_url && (
                      <div className="relative inline-block">
                        <img
                          src={editData.logo_url}
                          alt="Logo"
                          className="h-24 w-auto object-contain rounded-lg border bg-muted p-2"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => setEditData({ ...editData, logo_url: null })}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo", setUploadingLogo)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Hero Image Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Image</CardTitle>
                    <CardDescription>Main banner image for your website</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editData.hero_image_url && (
                      <div className="relative">
                        <img
                          src={editData.hero_image_url}
                          alt="Hero"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setEditData({ ...editData, hero_image_url: null })}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    <input
                      ref={heroInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero", setUploadingHero)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => heroInputRef.current?.click()}
                      disabled={uploadingHero}
                    >
                      {uploadingHero ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploadingHero ? "Uploading..." : "Upload Hero Image"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Bio */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>About / Bio</CardTitle>
                    <CardDescription>A short description displayed on the website</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={editData.bio || ""}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Write a short bio about the instructor..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Website Pages
                  </CardTitle>
                  <CardDescription>Manage the 5 pages of this mini-website</CardDescription>
                </CardHeader>
                <CardContent>
                  {pagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : pages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No pages found. Pages are created when the instructor signs up.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
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
                                /i/{editData.app_slug}{page.page_type !== "home" ? `/${page.page_type}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={page.is_published ? "default" : "secondary"}>
                              {page.is_published ? "Published" : "Draft"}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => setEditingPage(page)}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Page Edit Modal */}
              {editingPage && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Editing: {editingPage.page_title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <Label>Published</Label>
                      <Switch
                        checked={editingPage.is_published}
                        onCheckedChange={(checked) => setEditingPage({ ...editingPage, is_published: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Heading</Label>
                      <Input
                        value={editingPage.hero_heading || ""}
                        onChange={(e) => setEditingPage({ ...editingPage, hero_heading: e.target.value })}
                        placeholder="Welcome to my driving school"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Subheading</Label>
                      <Textarea
                        value={editingPage.hero_subheading || ""}
                        onChange={(e) => setEditingPage({ ...editingPage, hero_subheading: e.target.value })}
                        placeholder="Professional driving instruction..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Title (SEO)</Label>
                      <Input
                        value={editingPage.meta_title || ""}
                        onChange={(e) => setEditingPage({ ...editingPage, meta_title: e.target.value })}
                        placeholder="Page title for search engines"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description (SEO)</Label>
                      <Textarea
                        value={editingPage.meta_description || ""}
                        onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                        placeholder="Brief description for search results"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
                      <Button onClick={handleSavePage} disabled={savingPage}>
                        {savingPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Engine Optimisation
                  </CardTitle>
                  <CardDescription>
                    Customise how each page appears in Google search results. Leave blank to use auto-generated defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pagesLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading pages…
                    </div>
                  ) : pages.length === 0 ? (
                    <p className="text-muted-foreground">No pages found for this instructor.</p>
                  ) : (
                    pages.map((p) => {
                      const businessName = editData.name || "Instructor";
                      const defaultTitle = p.page_type === "home"
                        ? `${businessName} | Driving Lessons | Drive365`
                        : `${p.page_title} - ${businessName} | Drive365`;
                      return (
                        <div key={p.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium capitalize flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {p.page_title}
                            </h4>
                            <Badge variant={p.is_published ? "default" : "secondary"}>
                              {p.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          {/* Google Preview */}
                          <div className="bg-muted/50 rounded-lg p-3 border text-sm space-y-0.5">
                            <p className="text-xs text-muted-foreground mb-1">Google Preview</p>
                            <p className="text-blue-600 font-medium truncate">
                              {getSeoValue(p.id, "meta_title", p.meta_title) || defaultTitle}
                            </p>
                            <p className="text-green-700 text-xs truncate">
                              {editData.app_slug || "slug"}.everydriver.co.uk{p.page_type === "home" ? "" : `/${p.page_type}`}
                            </p>
                            <p className="text-muted-foreground text-xs line-clamp-2">
                              {getSeoValue(p.id, "meta_description", p.meta_description) || `${businessName} - Professional driving lessons. Book your driving course today with Drive365.`}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Meta Title <span className="text-muted-foreground">({getSeoValue(p.id, "meta_title", p.meta_title).length}/60)</span>
                            </Label>
                            <Input
                              value={getSeoValue(p.id, "meta_title", p.meta_title)}
                              onChange={(e) => handleSeoChange(p.id, "meta_title", e.target.value)}
                              placeholder={defaultTitle}
                              maxLength={60}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Meta Description <span className={`${getSeoValue(p.id, "meta_description", p.meta_description).length > 160 ? "text-destructive" : "text-muted-foreground"}`}>({getSeoValue(p.id, "meta_description", p.meta_description).length}/160)</span>
                            </Label>
                            <Textarea
                              value={getSeoValue(p.id, "meta_description", p.meta_description)}
                              onChange={(e) => handleSeoChange(p.id, "meta_description", e.target.value)}
                              placeholder="Brief description for search results"
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                  {pages.length > 0 && (
                    <Button onClick={handleSaveAllSEO} disabled={savingSEO}>
                      {savingSEO && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save All SEO
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domain" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website URL & Domain
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Website Slug</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">/i/</span>
                      <Input
                        value={editData.app_slug || ""}
                        onChange={(e) => setEditData({
                          ...editData,
                          app_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        })}
                        placeholder="instructor-name"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      URL: {editData.app_slug || "slug"}.everydriver.co.uk
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>Domain Configuration</Label>
                    <RadioGroup
                      value={domainMode}
                      onValueChange={(value) => setDomainMode(value as "none" | "manual" | "purchased" | "wildcard")}
                      className="space-y-2"
                    >
                      {/* Wildcard subdomain option */}
                      {wildcardSubdomain && (
                        <div className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50",
                          domainMode === "wildcard" && "border-primary bg-primary/5"
                        )}>
                          <RadioGroupItem value="wildcard" id="domain-wildcard" />
                          <Label htmlFor="domain-wildcard" className="cursor-pointer flex-1">
                            <span className="font-medium">Use free subdomain</span>
                            <span className="block text-sm text-primary font-mono mt-1">{wildcardSubdomain}</span>
                          </Label>
                        </div>
                      )}
                      
                      {/* Purchased domain option - show first if available */}
                      {instructorDomains.length > 0 && (
                        <div className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50",
                          domainMode === "purchased" && "border-primary bg-primary/5"
                        )}>
                          <RadioGroupItem value="purchased" id="domain-purchased" />
                          <Label htmlFor="domain-purchased" className="cursor-pointer flex-1">
                            <span className="font-medium">Use purchased domain</span>
                            <span className="block text-xs text-muted-foreground">Select from domains purchased in EveryDriver</span>
                          </Label>
                        </div>
                      )}
                      
                      {/* Manual domain entry */}
                      <div className={cn(
                        "flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50",
                        domainMode === "manual" && "border-primary bg-primary/5"
                      )}>
                        <RadioGroupItem value="manual" id="domain-manual" />
                        <Label htmlFor="domain-manual" className="cursor-pointer flex-1">
                          <span className="font-medium">Enter custom domain manually</span>
                          <span className="block text-xs text-muted-foreground">For domains purchased elsewhere (DNS setup required)</span>
                        </Label>
                      </div>
                      
                      {/* No custom domain */}
                      <div className={cn(
                        "flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50",
                        domainMode === "none" && "border-primary bg-primary/5"
                      )}>
                        <RadioGroupItem value="none" id="domain-none" />
                        <Label htmlFor="domain-none" className="cursor-pointer flex-1">
                          <span className="font-medium">No custom domain</span>
                          <span className="block text-xs text-muted-foreground">Use default everydriver.lovable.app URL only</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {domainMode === "manual" && (
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                      <Label>Custom Domain</Label>
                      <Input
                        value={manualDomain}
                        onChange={(e) => setManualDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, ""))}
                        placeholder="www.example.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the full domain (e.g., www.example.com or example.co.uk). DNS must be configured to point to EveryDriver.
                      </p>
                    </div>
                  )}

                  {domainMode === "purchased" && (
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                      <Label>Select Purchased Domain</Label>
                      <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a domain..." />
                        </SelectTrigger>
                        <SelectContent>
                          {instructorDomains.map((domain) => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.domain_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Current domain display */}
                  {domainMode === "wildcard" && wildcardSubdomain ? (
                    <div className="p-4 border rounded-lg bg-primary/10 border-primary/30">
                      <p className="text-sm font-medium text-primary">Your website will be available at:</p>
                      <p className="text-lg font-bold font-mono">{wildcardSubdomain}</p>
                    </div>
                  ) : (domainMode === "manual" && manualDomain) || (domainMode === "purchased" && selectedDomainId) ? (
                    <div className="p-4 border rounded-lg bg-green-500/10 border-green-500/30">
                      <p className="text-sm font-medium text-green-600">Custom domain will be set to:</p>
                      <p className="text-lg font-bold">
                        {domainMode === "manual" 
                          ? manualDomain 
                          : domains.find(d => d.id === selectedDomainId)?.domain_name}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>Displayed in the website header and footer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        value={editData.phone || ""}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        placeholder="07123 456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        value={editData.email || ""}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        placeholder="instructor@example.com"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Email is managed in the instructor profile</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Website Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Website Active</Label>
                      <p className="text-sm text-muted-foreground">
                        When disabled, visitors will see a "Coming Soon" page
                      </p>
                    </div>
                    <Switch
                      checked={editData.is_active}
                      onCheckedChange={(checked) => setEditData({ ...editData, is_active: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
