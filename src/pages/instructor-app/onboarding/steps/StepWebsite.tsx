import { useState, useEffect } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { VideoUploadField } from "../components/VideoUploadField";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Globe, 
  Palette, 
  ExternalLink, 
  Check, 
  Search, 
  Loader2,
  Server,
  Sparkles,
  ArrowRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepWebsiteProps {
  data: {
    website_theme: string;
    primary_color: string;
    slug: string;
    name: string;
    welcome_video_url?: string | null;
    wantsDomain?: boolean;
    selectedDomain?: string | null;
    wantsHosting?: boolean;
    selectedHostingPackage?: string | null;
  };
  instructorId: string;
  onUpdate: (data: Partial<StepWebsiteProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DomainResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
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

const hostingPackages = [
  {
    id: "starter",
    name: "Starter",
    price: 4.99,
    features: ["5GB Storage", "SSL Certificate", "Email Support"],
  },
  {
    id: "professional",
    name: "Professional",
    price: 9.99,
    features: ["25GB Storage", "SSL Certificate", "Priority Support", "Daily Backups"],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 19.99,
    features: ["100GB Storage", "SSL Certificate", "24/7 Support", "Hourly Backups", "CDN"],
  },
];

export function StepWebsite({
  data,
  instructorId,
  onUpdate,
  onNext,
  onBack,
}: StepWebsiteProps) {
  const [generatedSlug, setGeneratedSlug] = useState(data.slug);
  const [wantsDomain, setWantsDomain] = useState(data.wantsDomain ?? false);
  const [searchQuery, setSearchQuery] = useState(data.slug || "");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainResult[]>([]);

  useEffect(() => {
    // Generate slug from name if not already set
    if (!data.slug && data.name) {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setGeneratedSlug(slug);
      setSearchQuery(slug);
      onUpdate({ slug });
    }
  }, [data.name, data.slug, onUpdate]);

  const [searchError, setSearchError] = useState<string | null>(null);

  const handleDomainSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a domain name to search");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    
    try {
      const { data: result, error } = await supabase.functions.invoke("twentyi-api", {
        body: {
          action: "check-multiple",
          domain: searchQuery.toLowerCase().replace(/\s+/g, ""),
        },
      });

      console.log("Domain search response:", { result, error });

      if (error) throw error;

      // Handle both direct array and wrapped response formats
      const domains = Array.isArray(result) ? result : result?.results || result?.data || [];
      
      if (domains.length > 0) {
        setSearchResults(domains);
      } else {
        setSearchError("No results found. Please try a different domain name.");
      }
    } catch (error) {
      console.error("Domain search error:", error);
      setSearchError("Unable to search domains. Please try again later.");
      toast.error("Domain search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectDomain = (domain: string) => {
    onUpdate({ selectedDomain: domain, wantsDomain: true });
  };

  const skipDomain = () => {
    setWantsDomain(false);
    onUpdate({ wantsDomain: false, selectedDomain: null, wantsHosting: false, selectedHostingPackage: null });
    setSearchResults([]);
  };

  return (
    <OnboardingLayout
      step={7}
      totalSteps={9}
      title="Your Mini-Website"
      description="Customize your professional online presence"
    >
      <div className="max-w-2xl mx-auto space-y-8">
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

        {/* Custom Domain Section - Highlighted */}
        <div className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="text-lg font-semibold text-foreground">Want your own custom domain?</Label>
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">
                Stand Out
              </Badge>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Look more professional with a custom domain like <strong className="text-foreground">yourname.co.uk</strong> instead of a subdomain.
          </p>

          {!wantsDomain ? (
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => setWantsDomain(true)}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Search for a domain
              </Button>
              <Button 
                variant="ghost" 
                onClick={skipDomain}
                className="flex-1 text-muted-foreground"
              >
                No thanks, use free subdomain
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDomainSearch()}
                  className="flex-1"
                />
                <Button onClick={handleDomainSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {searchError && (
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
                  <p className="text-sm text-destructive">{searchError}</p>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.domain}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                        result.available
                          ? data.selectedDomain === result.domain
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 cursor-pointer"
                          : "border-border bg-muted/50 opacity-60"
                      )}
                      onClick={() => result.available && selectDomain(result.domain)}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground text-sm">{result.domain}</span>
                        {result.available ? (
                          <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Taken</Badge>
                        )}
                      </div>
                      {result.available && result.price != null && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            £{result.price.toFixed(2)}/yr
                          </span>
                          {data.selectedDomain === result.domain ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      {result.available && result.price == null && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Price TBC</span>
                          {data.selectedDomain === result.domain ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Hosting Section - Only show if domain selected */}
              {data.selectedDomain && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <Label className="text-lg font-semibold">Add Hosting Package</Label>
                    <Badge variant="outline">Recommended</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {hostingPackages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        className={cn(
                          "relative cursor-pointer transition-all",
                          data.selectedHostingPackage === pkg.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50",
                          pkg.popular && "border-emerald-500"
                        )}
                        onClick={() => {
                          onUpdate({ wantsHosting: true, selectedHostingPackage: pkg.id });
                        }}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <Badge className="bg-emerald-500 text-white text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-3 pt-5 text-center">
                          <h4 className="font-semibold text-foreground text-sm mb-1">{pkg.name}</h4>
                          <div className="text-xl font-bold text-foreground mb-2">
                            £{pkg.price.toFixed(2)}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </div>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {pkg.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-1 justify-center">
                                <Check className="h-3 w-3 text-success" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          {data.selectedHostingPackage === pkg.id && (
                            <div className="mt-2 flex items-center justify-center gap-1 text-primary text-xs">
                              <Shield className="h-3 w-3" />
                              Selected
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {data.selectedDomain && (
                <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-medium text-foreground">Domain Reserved</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Selected:</span>
                    <div className="text-right">
                      <div className="text-foreground font-medium">{data.selectedDomain}</div>
                      {data.selectedHostingPackage && (
                        <div className="text-foreground text-xs">
                          + {hostingPackages.find((p) => p.id === data.selectedHostingPackage)?.name} Hosting
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-success/20">
                    <p className="text-sm text-foreground">
                      ✓ Your domain will be registered after payment is set up
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click Continue to proceed to payment setup via Direct Debit
                    </p>
                  </div>
                </div>
              )}

              <Button variant="ghost" onClick={skipDomain} className="w-full text-muted-foreground">
                Skip — I'll use my free subdomain
              </Button>
            </div>
          )}
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
        nextLabel={data.selectedDomain ? "Continue with Domain" : "Continue"}
      />
    </OnboardingLayout>
  );
}
