import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Upload, Loader2, Eye, Moon, Sun, Link as LinkIcon, Copy, Check, QrCode, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PupilAppBrandingEditorProps {
  instructorId: string;
}

interface BrandingSettings {
  logo_url: string | null;
  brand_colour: string | null;
  secondary_colour: string | null;
  pupil_app_dark_mode: boolean;
  pupil_app_enabled: boolean;
  app_slug: string | null;
  name: string;
}

export function PupilAppBrandingEditor({ instructorId }: PupilAppBrandingEditorProps) {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [instructorId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("logo_url, brand_colour, secondary_colour, pupil_app_dark_mode, pupil_app_enabled, app_slug, name")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching branding settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      // Generate slug from name if not set
      const slug = settings.app_slug || settings.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { error } = await supabase
        .from("instructors")
        .update({
          logo_url: settings.logo_url,
          brand_colour: settings.brand_colour,
          secondary_colour: settings.secondary_colour,
          pupil_app_dark_mode: settings.pupil_app_dark_mode,
          pupil_app_enabled: settings.pupil_app_enabled,
          app_slug: slug,
        })
        .eq("id", instructorId);

      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, app_slug: slug } : null);
      toast({ title: "Branding saved", description: "Your pupil app settings have been updated" });
    } catch (error) {
      console.error("Error saving branding:", error);
      toast({ title: "Error", description: "Failed to save branding settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(fileName);

      setSettings(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast({ title: "Logo uploaded", description: "Your logo has been updated" });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/p/${settings?.app_slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Share this with your pupils" });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  const previewUrl = `/p/${settings.app_slug || 'preview'}`;
  const portalUrl = `${window.location.origin}/p/${settings.app_slug}`;
  const qrCodeUrl = settings.app_slug
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Pupil App Branding
          </CardTitle>
          <CardDescription>
            Customise your branded pupil portal. Pupils can view lessons, make payments, and contact you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Pupil App</Label>
              <p className="text-sm text-muted-foreground">
                Allow pupils to access their branded portal
              </p>
            </div>
            <Switch
              checked={settings.pupil_app_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, pupil_app_enabled: checked })}
            />
          </div>

          {settings.pupil_app_enabled && (
            <>
              {/* Share Link */}
              {settings.app_slug && (
                <div className="rounded-2xl border bg-muted/50 p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Your Pupil App Link
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={portalUrl}
                        className="bg-background"
                      />
                      <Button variant="outline" size="icon" onClick={copyLink}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setShowQR(!showQR)}
                        className={showQR ? "bg-primary text-primary-foreground" : ""}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {showQR && qrCodeUrl && (
                    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl shadow-lift border">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code for pupil portal"
                        className="w-48 h-48"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Pupils can scan this to access their portal
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = qrCodeUrl;
                          link.download = `pupil-portal-qr-${settings.app_slug}.png`;
                          link.click();
                          toast({ title: "QR Code downloaded!" });
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Your Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.logo_url ? (
                    <div 
                      className="h-16 w-16 rounded-2xl border flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: settings.brand_colour || '#1e3a5f' }}
                    >
                      <img 
                        src={settings.logo_url} 
                        alt="Logo" 
                        className="max-h-full max-w-full object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-2xl border-2 border-dashed flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span>
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Logo
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 200x200px PNG or SVG
                    </p>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Colour</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.brand_colour || '#1e3a5f'}
                      onChange={(e) => setSettings({ ...settings, brand_colour: e.target.value })}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.brand_colour || '#1e3a5f'}
                      onChange={(e) => setSettings({ ...settings, brand_colour: e.target.value })}
                      className="flex-1"
                      placeholder="#1e3a5f"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Colour</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.secondary_colour || '#d4a574'}
                      onChange={(e) => setSettings({ ...settings, secondary_colour: e.target.value })}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.secondary_colour || '#d4a574'}
                      onChange={(e) => setSettings({ ...settings, secondary_colour: e.target.value })}
                      className="flex-1"
                      placeholder="#d4a574"
                    />
                  </div>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  {settings.pupil_app_dark_mode ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      {settings.pupil_app_dark_mode ? 'Dark theme enabled' : 'Light theme enabled'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.pupil_app_dark_mode}
                  onCheckedChange={(checked) => setSettings({ ...settings, pupil_app_dark_mode: checked })}
                />
              </div>

              {/* Preview Card */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="rounded-2xl border p-4 transition-colors"
                  style={{ 
                    backgroundColor: settings.pupil_app_dark_mode ? '#1a1a1a' : '#ffffff',
                    color: settings.pupil_app_dark_mode ? '#ffffff' : '#1a1a1a'
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="h-10 w-10 object-contain" />
                    ) : (
                      <div 
                        className="h-10 w-10 rounded-2xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: settings.brand_colour || '#1e3a5f' }}
                      >
                        {settings.name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{settings.name}'s Driving School</p>
                      <p className="text-xs opacity-70">Pupil Portal</p>
                    </div>
                  </div>
                  <div 
                    className="rounded-2xl p-3 text-center text-white text-sm font-medium"
                    style={{ backgroundColor: settings.brand_colour || '#1e3a5f' }}
                  >
                    Sample Button
                  </div>
                  <div 
                    className="mt-2 rounded-2xl p-3 text-center text-sm font-medium"
                    style={{ 
                      backgroundColor: settings.secondary_colour || '#d4a574',
                      color: '#1a1a1a'
                    }}
                  >
                    Secondary Button
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Branding Settings
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
