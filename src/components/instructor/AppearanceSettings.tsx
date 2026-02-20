import { useState } from "react";
import { useInstructorAppearance, LayoutStyle } from "@/hooks/useInstructorAppearance";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X, LayoutGrid, Calendar, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

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

/* ── tiny phone-frame preview ── */
function PhonePreview({
  bg,
  heroSrc,
  variant,
}: {
  bg: string;
  heroSrc: string;
  variant: "dashboard" | "schedule" | "lockscreen";
}) {
  return (
    <div
      className="w-full aspect-[9/16] rounded-xl border border-border/60 overflow-hidden shadow-inner"
      style={{ backgroundColor: variant === "lockscreen" ? "#1a1a2e" : bg }}
    >
      {variant === "lockscreen" ? (
        <>
          {/* lock screen preview */}
          <div className="h-[15%]" />
          <div className="px-2 text-center">
            <div className="h-1.5 w-10 mx-auto rounded bg-white/30 mb-0.5" />
            <div className="h-4 w-16 mx-auto rounded bg-white/20 mb-1" />
          </div>
          <div className="px-1.5 space-y-0.5 mt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white/10 h-4 w-full" />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* hero strip */}
          <div className="h-[30%] w-full overflow-hidden">
            <img src={heroSrc} alt="" className="w-full h-full object-cover" />
          </div>
          {/* body */}
          <div className="p-1.5 space-y-1">
            {variant === "dashboard" ? (
              <>
                <div className="rounded bg-card/90 h-5 w-full" />
                <div className="grid grid-cols-3 gap-0.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded bg-card/80 aspect-square" />
                  ))}
                </div>
                <div className="rounded bg-card/60 h-3 w-full" />
              </>
            ) : (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-3 h-1.5 rounded-sm bg-primary/30" />
                    <div className="flex-1 h-2.5 rounded bg-card/80" />
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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

  const currentBg = wallpaperColor || "#E8F1FE";
  const currentHero = heroImageUrl || instructorHeroImg;

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
      {/* ── Live Preview ── */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preview</Label>
        <div className="max-w-[140px] mx-auto">
          <PhonePreview bg={currentBg} heroSrc={currentHero} variant={layoutStyle} />
        </div>
      </div>

      {/* ── Layout Style Picker ── */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Home Layout</Label>
        <div className="grid grid-cols-3 gap-3">
          {/* Dashboard option */}
          <button
            onClick={() => handleLayoutChange("dashboard")}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
              layoutStyle === "dashboard"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="w-full max-w-[80px]">
              <PhonePreview bg={currentBg} heroSrc={currentHero} variant="dashboard" />
            </div>
            <span className="text-xs font-medium mt-1">Dashboard</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              Hero + tiles + widgets
            </span>
            {layoutStyle === "dashboard" && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>

          {/* Schedule option */}
          <button
            onClick={() => handleLayoutChange("schedule")}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
              layoutStyle === "schedule"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="w-full max-w-[80px]">
              <PhonePreview bg={currentBg} heroSrc={currentHero} variant="schedule" />
            </div>
            <span className="text-xs font-medium mt-1">App Style</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              iOS-style launcher grid
            </span>
            {layoutStyle === "schedule" && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>

          {/* Lock Screen option */}
          <button
            onClick={() => handleLayoutChange("lockscreen")}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
              layoutStyle === "lockscreen"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="w-full max-w-[80px]">
              <PhonePreview bg={currentBg} heroSrc={currentHero} variant="lockscreen" />
            </div>
            <span className="text-xs font-medium mt-1">Lock Screen</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              Dark + frosted glass
            </span>
            {layoutStyle === "lockscreen" && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── Hero Image ── */}
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

      {/* ── Wallpaper Colour ── */}
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
