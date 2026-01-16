import { useState, useEffect } from "react";
import { Palette, Type, Layout, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ThemeSettings {
  website_theme: string;
  website_font: string;
  website_header_style: string;
  brand_colour: string;
  secondary_colour: string;
  website_button_color: string;
  website_footer_bg: string;
}

interface PresetTheme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    button: string;
    footer: string;
    font: string;
    headerStyle: string;
  };
}

const presetThemes: PresetTheme[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional",
    preview: {
      primary: "#1e3a5f",
      secondary: "#3b82f6",
      button: "#3b82f6",
      footer: "#111827",
      font: "Inter",
      headerStyle: "solid",
    },
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless elegance",
    preview: {
      primary: "#1f2937",
      secondary: "#d4a574",
      button: "#d4a574",
      footer: "#1f2937",
      font: "Playfair Display",
      headerStyle: "solid",
    },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Eye-catching and vibrant",
    preview: {
      primary: "#dc2626",
      secondary: "#fbbf24",
      button: "#dc2626",
      footer: "#18181b",
      font: "Montserrat",
      headerStyle: "solid",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and clean",
    preview: {
      primary: "#ffffff",
      secondary: "#000000",
      button: "#000000",
      footer: "#fafafa",
      font: "Inter",
      headerStyle: "transparent",
    },
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated style",
    preview: {
      primary: "#0f172a",
      secondary: "#a855f7",
      button: "#a855f7",
      footer: "#020617",
      font: "Playfair Display",
      headerStyle: "gradient",
    },
  },
  {
    id: "nature",
    name: "Nature",
    description: "Earthy and calming",
    preview: {
      primary: "#166534",
      secondary: "#84cc16",
      button: "#22c55e",
      footer: "#14532d",
      font: "Poppins",
      headerStyle: "solid",
    },
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

interface MiniWebsiteThemeEditorProps {
  instructorId: string;
  currentSettings: Partial<ThemeSettings>;
  onUpdate: () => void;
}

export function MiniWebsiteThemeEditor({
  instructorId,
  currentSettings,
  onUpdate,
}: MiniWebsiteThemeEditorProps) {
  const [settings, setSettings] = useState<ThemeSettings>({
    website_theme: currentSettings.website_theme || "modern",
    website_font: currentSettings.website_font || "Inter",
    website_header_style: currentSettings.website_header_style || "solid",
    brand_colour: currentSettings.brand_colour || "#1e3a5f",
    secondary_colour: currentSettings.secondary_colour || "#3b82f6",
    website_button_color: currentSettings.website_button_color || "#3b82f6",
    website_footer_bg: currentSettings.website_footer_bg || "#111827",
  });
  const [saving, setSaving] = useState(false);

  const handleApplyPreset = (preset: PresetTheme) => {
    setSettings({
      ...settings,
      website_theme: preset.id,
      website_font: preset.preview.font,
      website_header_style: preset.preview.headerStyle,
      brand_colour: preset.preview.primary,
      secondary_colour: preset.preview.secondary,
      website_button_color: preset.preview.button,
      website_footer_bg: preset.preview.footer,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          website_theme: settings.website_theme,
          website_font: settings.website_font,
          website_header_style: settings.website_header_style,
          brand_colour: settings.brand_colour,
          secondary_colour: settings.secondary_colour,
          website_button_color: settings.website_button_color,
          website_footer_bg: settings.website_footer_bg,
        })
        .eq("id", instructorId);

      if (error) throw error;
      toast.success("Theme settings saved!");
      onUpdate();
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Failed to save theme settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-2">
            <Type className="h-4 w-4" />
            Style
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presetThemes.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={cn(
                  "relative p-3 rounded-lg border-2 transition-all text-left",
                  settings.website_theme === preset.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                {settings.website_theme === preset.id && (
                  <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                
                {/* Mini preview */}
                <div className="mb-2 rounded overflow-hidden border">
                  <div
                    className="h-6 flex items-center px-2"
                    style={{ backgroundColor: preset.preview.primary }}
                  >
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-100 flex items-center justify-center">
                    <div
                      className="w-8 h-3 rounded-sm"
                      style={{ backgroundColor: preset.preview.button }}
                    />
                  </div>
                  <div
                    className="h-4"
                    style={{ backgroundColor: preset.preview.footer }}
                  />
                </div>

                <p className="font-medium text-sm">{preset.name}</p>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Header / Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.brand_colour}
                  onChange={(e) =>
                    setSettings({ ...settings, brand_colour: e.target.value })
                  }
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.brand_colour}
                  onChange={(e) =>
                    setSettings({ ...settings, brand_colour: e.target.value })
                  }
                  placeholder="#1e3a5f"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accent / Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.secondary_colour}
                  onChange={(e) =>
                    setSettings({ ...settings, secondary_colour: e.target.value })
                  }
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.secondary_colour}
                  onChange={(e) =>
                    setSettings({ ...settings, secondary_colour: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Button Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.website_button_color || settings.secondary_colour}
                  onChange={(e) =>
                    setSettings({ ...settings, website_button_color: e.target.value })
                  }
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.website_button_color || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, website_button_color: e.target.value })
                  }
                  placeholder="Same as accent"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Footer Background</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.website_footer_bg}
                  onChange={(e) =>
                    setSettings({ ...settings, website_footer_bg: e.target.value })
                  }
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.website_footer_bg}
                  onChange={(e) =>
                    setSettings({ ...settings, website_footer_bg: e.target.value })
                  }
                  placeholder="#111827"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border">
                <div
                  className="h-10 flex items-center justify-between px-4"
                  style={{ backgroundColor: settings.brand_colour }}
                >
                  <div className="text-white text-sm font-medium">Your Name</div>
                  <div className="flex gap-2">
                    <div className="text-white/70 text-xs">Home</div>
                    <div className="text-white/70 text-xs">About</div>
                    <div className="text-white/70 text-xs">Contact</div>
                  </div>
                </div>
                <div className="h-20 bg-gray-100 flex items-center justify-center gap-3">
                  <div
                    className="px-4 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: settings.website_button_color || settings.secondary_colour }}
                  >
                    Book Now
                  </div>
                  <div
                    className="px-4 py-2 rounded text-sm border-2"
                    style={{ 
                      borderColor: settings.secondary_colour,
                      color: settings.secondary_colour
                    }}
                  >
                    Learn More
                  </div>
                </div>
                <div
                  className="h-8 flex items-center justify-center"
                  style={{ backgroundColor: settings.website_footer_bg }}
                >
                  <span className="text-white/50 text-xs">© 2025 Your Name</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="mt-4 space-y-6">
          {/* Font Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Family
            </Label>
            <RadioGroup
              value={settings.website_font}
              onValueChange={(value) => setSettings({ ...settings, website_font: value })}
              className="grid grid-cols-1 gap-2"
            >
              {fonts.map((font) => (
                <div key={font.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={font.id} id={font.id} />
                  <Label
                    htmlFor={font.id}
                    className="flex-1 cursor-pointer"
                    style={{ fontFamily: font.id }}
                  >
                    <span className="font-medium">{font.name}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      — {font.sample}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Header Style */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Header Style
            </Label>
            <RadioGroup
              value={settings.website_header_style}
              onValueChange={(value) =>
                setSettings({ ...settings, website_header_style: value })
              }
              className="grid grid-cols-3 gap-3"
            >
              {headerStyles.map((style) => (
                <div key={style.id}>
                  <RadioGroupItem
                    value={style.id}
                    id={`header-${style.id}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`header-${style.id}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-sm font-medium">{style.name}</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {style.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Theme Settings"}
      </Button>
    </div>
  );
}