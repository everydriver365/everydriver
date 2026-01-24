import { useState, useEffect } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Palette, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepWebsiteProps {
  data: {
    website_theme: string;
    primary_color: string;
    slug: string;
    name: string;
  };
  onUpdate: (data: Partial<StepWebsiteProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

const themes = [
  { id: "modern", label: "Modern", desc: "Clean and minimal" },
  { id: "classic", label: "Classic", desc: "Traditional and trusted" },
  { id: "bold", label: "Bold", desc: "Stand out from the crowd" },
];

const colors = [
  { id: "emerald", value: "#10b981", label: "Emerald" },
  { id: "blue", value: "#3b82f6", label: "Blue" },
  { id: "purple", value: "#8b5cf6", label: "Purple" },
  { id: "orange", value: "#f97316", label: "Orange" },
  { id: "red", value: "#ef4444", label: "Red" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
];

export function StepWebsite({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepWebsiteProps) {
  const [generatedSlug, setGeneratedSlug] = useState(data.slug);

  useEffect(() => {
    // Generate slug from name if not already set
    if (!data.slug && data.name) {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setGeneratedSlug(slug);
      onUpdate({ slug });
    }
  }, [data.name, data.slug, onUpdate]);

  return (
    <OnboardingLayout
      step={7}
      totalSteps={8}
      title="Your Mini-Website"
      description="Customize your professional online presence"
    >
      <div className="max-w-lg mx-auto space-y-8">
        {/* Website URL Preview */}
        <div className="bg-secondary rounded-xl p-6 text-center">
          <Label className="flex items-center justify-center gap-2 mb-3">
            <Globe className="h-4 w-4" />
            Your Website URL
          </Label>
          <div className="flex items-center justify-center gap-2 text-lg">
            <span className="text-muted-foreground">drive365.co.uk/i/</span>
            <span className="font-bold text-foreground">{generatedSlug || "your-name"}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pupils can find and book you at this address
          </p>
        </div>

        {/* Theme Selection */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Website Theme
          </Label>
          
          <RadioGroup
            value={data.website_theme || "modern"}
            onValueChange={(value) => onUpdate({ website_theme: value })}
            className="grid grid-cols-3 gap-3"
          >
            {themes.map((theme) => (
              <label
                key={theme.id}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-center",
                  data.website_theme === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value={theme.id} className="sr-only" />
                <div className="font-medium text-foreground">{theme.label}</div>
                <div className="text-xs text-muted-foreground">{theme.desc}</div>
                {data.website_theme === theme.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Color Selection */}
        <div className="space-y-4">
          <Label>Brand Color</Label>
          
          <div className="flex justify-center gap-3">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => onUpdate({ primary_color: color.value })}
                className={cn(
                  "w-12 h-12 rounded-full transition-all",
                  data.primary_color === color.value
                    ? "ring-2 ring-offset-2 ring-primary scale-110"
                    : "hover:scale-105"
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              >
                {data.primary_color === color.value && (
                  <Check className="h-5 w-5 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview hint */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-sm text-foreground flex items-center justify-center gap-2">
            <ExternalLink className="h-4 w-4" />
            You can customize your website further after setup
          </p>
        </div>
      </div>

      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        canProceed={true}
      />
    </OnboardingLayout>
  );
}
