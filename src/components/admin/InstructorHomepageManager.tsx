import { useState, useEffect } from "react";
import { Save, Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstructorHomepageContent, QuickAction, PromoBanner } from "@/hooks/useInstructorHomepageContent";
import { toast } from "@/hooks/use-toast";

const ICON_OPTIONS = [
  { value: "Calendar", label: "Calendar" },
  { value: "Users", label: "Users" },
  { value: "Briefcase", label: "Briefcase" },
  { value: "CreditCard", label: "Credit Card" },
  { value: "Clock", label: "Clock" },
  { value: "Settings", label: "Settings" },
  { value: "Car", label: "Car" },
];

export function InstructorHomepageManager() {
  const { content, loading, updateContent } = useInstructorHomepageContent();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [motivationTitle, setMotivationTitle] = useState("");
  const [motivationSubtitle, setMotivationSubtitle] = useState("");
  const [showProgress, setShowProgress] = useState(true);
  const [progressLabel, setProgressLabel] = useState("");
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [secondaryPromoBanners, setSecondaryPromoBanners] = useState<PromoBanner[]>([]);

  useEffect(() => {
    if (content) {
      setHeroImageUrl(content.hero_image_url || "");
      setMotivationTitle(content.motivation_title);
      setMotivationSubtitle(content.motivation_subtitle);
      setShowProgress(content.show_progress_indicator);
      setProgressLabel(content.progress_label);
      setQuickActions(content.quick_actions);
      setPromoBanners(content.promo_banners);
      setSecondaryPromoBanners(content.secondary_promo_banners || []);
    }
  }, [content]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateContent({
      hero_image_url: heroImageUrl || null,
      motivation_title: motivationTitle,
      motivation_subtitle: motivationSubtitle,
      show_progress_indicator: showProgress,
      progress_label: progressLabel,
      quick_actions: quickActions as any,
      promo_banners: promoBanners as any,
      secondary_promo_banners: secondaryPromoBanners as any
    });

    if (success) {
      toast({ title: "Saved", description: "Homepage content updated successfully" });
    } else {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
    setSaving(false);
  };

  const addQuickAction = () => {
    setQuickActions([
      ...quickActions,
      {
        id: `action-${Date.now()}`,
        title: "New Action",
        icon: "Calendar",
        route: "/instructor/portal",
        display_order: quickActions.length + 1
      }
    ]);
  };

  const updateQuickAction = (index: number, updates: Partial<QuickAction>) => {
    setQuickActions(prev => prev.map((action, i) => 
      i === index ? { ...action, ...updates } : action
    ));
  };

  const removeQuickAction = (index: number) => {
    setQuickActions(prev => prev.filter((_, i) => i !== index));
  };

  const addPromoBanner = () => {
    setPromoBanners([
      ...promoBanners,
      {
        id: `banner-${Date.now()}`,
        title: "New Banner",
        subtitle: "Banner description",
        image_url: null,
        link: "/instructor/portal"
      }
    ]);
  };

  const updatePromoBanner = (index: number, updates: Partial<PromoBanner>) => {
    setPromoBanners(prev => prev.map((banner, i) => 
      i === index ? { ...banner, ...updates } : banner
    ));
  };

  const removePromoBanner = (index: number) => {
    setPromoBanners(prev => prev.filter((_, i) => i !== index));
  };

  const addSecondaryPromoBanner = () => {
    setSecondaryPromoBanners([
      ...secondaryPromoBanners,
      {
        id: `sec-banner-${Date.now()}`,
        title: "New Banner",
        subtitle: "Banner description",
        image_url: null,
        link: "/instructor/portal"
      }
    ]);
  };

  const updateSecondaryPromoBanner = (index: number, updates: Partial<PromoBanner>) => {
    setSecondaryPromoBanners(prev => prev.map((banner, i) => 
      i === index ? { ...banner, ...updates } : banner
    ));
  };

  const removeSecondaryPromoBanner = (index: number) => {
    setSecondaryPromoBanners(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Hero Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hero Image URL</Label>
            <Input
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          {heroImageUrl && (
            <img 
              src={heroImageUrl} 
              alt="Hero preview" 
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
        </CardContent>
      </Card>

      {/* Motivational Card */}
      <Card>
        <CardHeader>
          <CardTitle>Motivational Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={motivationTitle}
              onChange={(e) => setMotivationTitle(e.target.value)}
              placeholder="ON YOUR MARKS..."
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Textarea
              value={motivationSubtitle}
              onChange={(e) => setMotivationSubtitle(e.target.value)}
              placeholder="Every lesson is a step towards success."
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Progress Indicator</Label>
            <Switch checked={showProgress} onCheckedChange={setShowProgress} />
          </div>
          {showProgress && (
            <div>
              <Label>Progress Label</Label>
              <Input
                value={progressLabel}
                onChange={(e) => setProgressLabel(e.target.value)}
                placeholder="TODAY"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quick Actions</CardTitle>
          <Button size="sm" variant="outline" onClick={addQuickAction}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickActions.map((action, index) => (
            <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={action.title}
                    onChange={(e) => updateQuickAction(index, { title: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Icon</Label>
                  <Select 
                    value={action.icon} 
                    onValueChange={(v) => updateQuickAction(index, { icon: v })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Route</Label>
                  <Input
                    value={action.route}
                    onChange={(e) => updateQuickAction(index, { route: e.target.value })}
                    className="h-8"
                    placeholder="/instructor/schedule"
                  />
                </div>
                <div>
                  <Label className="text-xs">Order</Label>
                  <Input
                    type="number"
                    value={action.display_order}
                    onChange={(e) => updateQuickAction(index, { display_order: parseInt(e.target.value) || 0 })}
                    className="h-8"
                  />
                </div>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-destructive hover:text-destructive"
                onClick={() => removeQuickAction(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Promo Banners */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Promotional Banners</CardTitle>
          <Button size="sm" variant="outline" onClick={addPromoBanner}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {promoBanners.map((banner, index) => (
            <div key={banner.id} className="p-3 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Banner {index + 1}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-destructive hover:text-destructive h-8 w-8"
                  onClick={() => removePromoBanner(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={banner.title}
                    onChange={(e) => updatePromoBanner(index, { title: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Link</Label>
                  <Input
                    value={banner.link}
                    onChange={(e) => updatePromoBanner(index, { link: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Subtitle</Label>
                  <Input
                    value={banner.subtitle}
                    onChange={(e) => updatePromoBanner(index, { subtitle: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Image URL (optional)</Label>
                  <Input
                    value={banner.image_url || ""}
                    onChange={(e) => updatePromoBanner(index, { image_url: e.target.value || null })}
                    className="h-8"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Secondary Promo Banners */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Secondary Promotional Banners</CardTitle>
          <Button size="sm" variant="outline" onClick={addSecondaryPromoBanner}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These banners appear in a second carousel below the primary banners.
          </p>
          {secondaryPromoBanners.map((banner, index) => (
            <div key={banner.id} className="p-3 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Banner {index + 1}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-destructive hover:text-destructive h-8 w-8"
                  onClick={() => removeSecondaryPromoBanner(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={banner.title}
                    onChange={(e) => updateSecondaryPromoBanner(index, { title: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Link</Label>
                  <Input
                    value={banner.link}
                    onChange={(e) => updateSecondaryPromoBanner(index, { link: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Subtitle</Label>
                  <Input
                    value={banner.subtitle}
                    onChange={(e) => updateSecondaryPromoBanner(index, { subtitle: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Image URL (optional)</Label>
                  <Input
                    value={banner.image_url || ""}
                    onChange={(e) => updateSecondaryPromoBanner(index, { image_url: e.target.value || null })}
                    className="h-8"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
