import { useState } from "react";
import { useInstructorAppearance, LayoutStyle } from "@/hooks/useInstructorAppearance";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X, LayoutGrid, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppearanceSettingsProps {
  instructorId: string | undefined;
}

const WALLPAPER_PRESETS = [
  { color: "#E8F1FE", label: "Sky" },
  { color: "#E8F5E9", label: "Mint" },
  { color: "#FFF3E0", label: "Peach" },
  { color: "#F3E5F5", label: "Lavender" },
  { color: "#E0F2F1", label: "Teal" },
  { color: "#FBE9E7", label: "Coral" },
  { color: "#F5F5F5", label: "Light" },
  { color: "#ECEFF1", label: "Slate" },
];

export function AppearanceSettings({ instructorId }: AppearanceSettingsProps) {
  const {
    layoutStyle,
    heroImageUrl,
    wallpaperColor,
    saving,
    updateAppearance,
    uploadHeroImage,
  } = useInstructorAppearance(instructorId);

  const [uploading, setUploading] = useState(false);
  const [customColor, setCustomColor] = useState("");

  const handleLayoutChange = (style: LayoutStyle) => {
    updateAppearance({ layoutStyle: style });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadHeroImage(file);
    setUploading(false);
  };

  const handleRemoveHero = () => {
    updateAppearance({ heroImageUrl: null });
  };

  const handleWallpaperSelect = (color: string | null) => {
    updateAppearance({ wallpaperColor: color });
  };

  const handleCustomColor = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      updateAppearance({ wallpaperColor: customColor });
    } else {
      toast.error("Enter a valid hex colour (e.g. #E8F1FE)");
    }
  };

  return (
    <div className="space-y-6">
      {/* Layout Style Picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Home Layout</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleLayoutChange("dashboard")}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              layoutStyle === "dashboard"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
          >
            <LayoutGrid className="h-8 w-8 text-primary" />
            <span className="text-xs font-medium">Dashboard</span>
            <span className="text-[10px] text-muted-foreground text-center">Hero + tiles + widgets</span>
            {layoutStyle === "dashboard" && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>
          <button
            onClick={() => handleLayoutChange("schedule")}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              layoutStyle === "schedule"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
          >
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xs font-medium">Schedule</span>
            <span className="text-[10px] text-muted-foreground text-center">Clean day-view focus</span>
            {layoutStyle === "schedule" && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Hero Image</Label>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative rounded-xl border-2 border-dashed overflow-hidden bg-muted/50 flex items-center justify-center w-full aspect-video max-w-xs",
              heroImageUrl ? "border-primary" : "border-border"
            )}
          >
            {heroImageUrl ? (
              <>
                <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={handleRemoveHero}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <div className="text-center p-4">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                ) : (
                  <p className="text-xs text-muted-foreground">Upload a hero photo</p>
                )}
              </div>
            )}
          </div>
        </div>
        <label className="cursor-pointer inline-block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleHeroUpload}
            disabled={uploading || saving}
          />
          <Button type="button" variant="outline" size="sm" disabled={uploading || saving} asChild>
            <span>
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {heroImageUrl ? "Change" : "Upload"} Hero
            </span>
          </Button>
        </label>
        <p className="text-[10px] text-muted-foreground">Recommended: landscape, under 5MB</p>
      </div>

      {/* Wallpaper Colour */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Background Colour</Label>
        <div className="flex flex-wrap gap-2">
          {/* Default/none option */}
          <button
            onClick={() => handleWallpaperSelect(null)}
            className={cn(
              "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all",
              wallpaperColor === null
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
            title="Default"
          >
            <span className="text-[8px] font-medium text-muted-foreground">DEF</span>
          </button>
          {WALLPAPER_PRESETS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => handleWallpaperSelect(preset.color)}
              className={cn(
                "w-9 h-9 rounded-full border-2 transition-all",
                wallpaperColor === preset.color
                  ? "border-primary ring-2 ring-primary/20 scale-110"
                  : "border-border hover:border-primary/40"
              )}
              style={{ backgroundColor: preset.color }}
              title={preset.label}
            />
          ))}
        </div>

        {/* Custom hex input */}
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder="#E8F1FE"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-32 h-8 text-xs"
            maxLength={7}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCustomColor}
            disabled={saving}
            className="h-8 text-xs"
          >
            Apply
          </Button>
        </div>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
