import { useState, useEffect } from "react";
import { Globe, Save, Loader2, Info, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CMSImageUpload } from "./CMSImageUpload";

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  label: string;
  description: string | null;
  display_order: number;
}

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => 
      prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each setting
      for (const setting of settings) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: setting.setting_value })
          .eq("id", setting.id);

        if (error) throw error;
      }

      toast({ title: "Settings saved", description: "Your site settings have been updated" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting: SiteSetting) => {
    const value = setting.setting_value || "";
    
    switch (setting.setting_type) {
      case "textarea":
        return (
          <div className="space-y-1">
            <Textarea
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              rows={3}
              className="resize-none"
            />
            {setting.setting_key === "meta_description" && (
              <p className={`text-xs ${value.length > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {value.length}/160 characters
              </p>
            )}
          </div>
        );
      
      case "image":
        return (
          <CMSImageUpload
            value={value}
            onChange={(url) => handleChange(setting.setting_key, url || "")}
            bucket="instructor-images"
            folder="site-settings"
            label="Upload Image"
          />
        );
      
      case "color":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || "#3b82f6"}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              className="h-10 w-14 rounded border cursor-pointer"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              placeholder="#3b82f6"
              className="w-32 font-mono text-sm"
            />
            {value && (
              <div 
                className="h-10 flex-1 rounded border flex items-center justify-center text-sm"
                style={{ backgroundColor: value, color: value > "#888888" ? "#000" : "#fff" }}
              >
                Preview
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="space-y-1">
            <Input
              type={setting.setting_type === "email" ? "email" : setting.setting_type === "tel" ? "tel" : "text"}
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            />
            {setting.setting_key === "site_title" && (
              <p className={`text-xs ${value.length > 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {value.length}/60 characters
              </p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group settings
  const seoSettings = settings.filter(s => 
    ["site_title", "meta_description", "og_title", "og_description", "og_image_url"].includes(s.setting_key)
  );
  const socialSettings = settings.filter(s => 
    ["twitter_handle", "google_analytics_id"].includes(s.setting_key)
  );
  const contactSettings = settings.filter(s => 
    ["contact_email", "contact_phone", "footer_copyright"].includes(s.setting_key)
  );
  const paymentSettings = settings.filter(s => 
    ["npi_merchant_name", "npi_brand_color", "npi_merchant_logo"].includes(s.setting_key)
  );

  return (
    <div className="space-y-6">
      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SEO & Meta Tags
          </CardTitle>
          <CardDescription>
            Configure how your site appears in search engines and when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {seoSettings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                {setting.label}
                {setting.description && (
                  <span className="text-xs text-muted-foreground font-normal">
                    — {setting.description}
                  </span>
                )}
              </Label>
              {renderInput(setting)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Social & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Social & Analytics</CardTitle>
          <CardDescription>
            Connect your social accounts and analytics tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialSettings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                {setting.label}
                {setting.description && (
                  <span className="text-xs text-muted-foreground font-normal">
                    — {setting.description}
                  </span>
                )}
              </Label>
              {renderInput(setting)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Footer</CardTitle>
          <CardDescription>
            Contact information displayed across the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactSettings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                {setting.label}
                {setting.description && (
                  <span className="text-xs text-muted-foreground font-normal">
                    — {setting.description}
                  </span>
                )}
              </Label>
              {renderInput(setting)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Page Settings */}
      {paymentSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Page Branding
            </CardTitle>
            <CardDescription>
              Customize the hosted payment page appearance for NPI/Cardstream
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentSettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                  {setting.label}
                  {setting.description && (
                    <span className="text-xs text-muted-foreground font-normal">
                      — {setting.description}
                    </span>
                  )}
                </Label>
                {renderInput(setting)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info Note */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Note about SEO changes</p>
          <p>
            Changes to the site title and meta description will take effect immediately for new visitors. 
            Search engines may take a few days to update their cached versions.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
