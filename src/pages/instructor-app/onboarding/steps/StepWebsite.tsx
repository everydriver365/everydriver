import { useState, useEffect } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { VideoUploadField } from "../components/VideoUploadField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Palette, 
  ExternalLink, 
  Check, 
  MonitorSmartphone,
  Code2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepWebsiteProps {
  data: {
    website_theme: string;
    primary_color: string;
    slug: string;
    name: string;
    welcome_video_url?: string | null;
    website_choice?: "free" | "custom" | "booknow";
    personal_website_url?: string;
  };
  instructorId: string;
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

const websiteOptions = [
  {
    id: "free" as const,
    label: "Free Mini-Website",
    icon: MonitorSmartphone,
    description: "Get a professional mini-website included free with your account at yourname.everydriver.co.uk. Includes booking page, reviews, and your profile.",
  },
  {
    id: "custom" as const,
    label: "Custom Website + Domain",
    icon: Globe,
    description: "Want a full custom website with your own domain (e.g. yourname.co.uk)? We'll build you a bespoke multi-page site with your branding.",
  },
  {
    id: "booknow" as const,
    label: "I already have my own website",
    icon: Code2,
    description: "Skip the mini-website. We'll send you a 'Book Now' button you can drop into your existing site to take online bookings.",
  },
];

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return !!url.hostname && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function StepWebsite({
  data,
  instructorId,
  onUpdate,
  onNext,
  onBack,
}: StepWebsiteProps) {
  const [generatedSlug, setGeneratedSlug] = useState(data.slug);
  const websiteChoice = data.website_choice || "free";

  useEffect(() => {
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
      totalSteps={9}
      title="Your Website"
      description="Choose how you want your online presence to work"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Website Choice Cards */}
        <div className="space-y-3">
          {websiteOptions.map((option) => {
            const isSelected = websiteChoice === option.id;
            const Icon = option.icon;
            return (
              <div
                key={option.id}
                className={cn(
                  "relative flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
                onClick={() => onUpdate({ website_choice: option.id })}
              >
                <div className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{option.label}</span>
                    {option.id === "free" && (
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Included Free
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                </div>
                <div className={cn(
                  "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Booknow: capture existing website URL */}
        {websiteChoice === "booknow" && (
          <div className="space-y-3 bg-muted/40 border border-border rounded-xl p-5">
            <Label htmlFor="existing-website-url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Your existing website URL
            </Label>
            <Input
              id="existing-website-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://www.yourdrivingschool.co.uk"
              value={data.personal_website_url || ""}
              onChange={(e) => onUpdate({ personal_website_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              We'll skip building you a mini-site and email you a Book Now button to embed on this site after sign-up.
            </p>
          </div>
        )}

        {/* Post-signup confirmation for custom */}
        {websiteChoice === "custom" && (
          <div className="bg-success/5 border border-success/20 rounded-xl p-5 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-success">
              <Check className="h-5 w-5" />
              <span className="font-medium">Great choice!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We'll arrange your custom website and domain with you after sign-up is complete.
            </p>
          </div>
        )}

        {/* Free website customisation — only shown when "free" is selected */}
        {websiteChoice === "free" && (
          <>
            {/* Website URL Preview */}
            <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-success mb-1">
                <Check className="h-5 w-5" />
                <span className="font-medium">Free subdomain included!</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-lg mt-2">
                <span className="font-bold text-foreground">{generatedSlug || "your-name"}</span>
                <span className="text-muted-foreground">.everydriver.co.uk</span>
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

            {/* Welcome Video Upload */}
            <VideoUploadField
              label="Welcome Video (Optional)"
              value={data.welcome_video_url || null}
              instructorId={instructorId}
              folder="welcome-video"
              onChange={(url) => onUpdate({ welcome_video_url: url })}
              helpText="Introduce yourself to prospective pupils"
              maxSizeMB={50}
            />

            {/* Preview hint */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-foreground flex items-center justify-center gap-2">
                <ExternalLink className="h-4 w-4" />
                You can customize your website further after setup
              </p>
            </div>
          </>
        )}
      </div>

      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        canProceed={true}
        nextLabel="Continue"
      />
    </OnboardingLayout>
  );
}
