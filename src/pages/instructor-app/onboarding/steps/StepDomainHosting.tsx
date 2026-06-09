import { useState } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Server, 
  Check, 
  Search, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepDomainHostingProps {
  data: {
    slug: string;
    name: string;
    wantsDomain: boolean;
    wantsHosting: boolean;
    selectedDomain: string | null;
  };
  onUpdate: (data: Partial<StepDomainHostingProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DomainResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
}

const hostingPackages = [
  {
    id: "starter",
    name: "Starter Hosting",
    price: 4.99,
    features: ["5GB Storage", "SSL Certificate", "Email Support"],
  },
  {
    id: "professional",
    name: "Professional Hosting",
    price: 9.99,
    features: ["25GB Storage", "SSL Certificate", "Priority Support", "Daily Backups"],
    popular: true,
  },
  {
    id: "business",
    name: "Business Hosting",
    price: 19.99,
    features: ["100GB Storage", "SSL Certificate", "24/7 Support", "Hourly Backups", "CDN Included"],
  },
];

export function StepDomainHosting({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepDomainHostingProps) {
  const [searchQuery, setSearchQuery] = useState(data.slug || "");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainResult[]>([]);
  const [selectedHosting, setSelectedHosting] = useState<string | null>(null);

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

      if (error) throw error;

      if (Array.isArray(result) && result.length > 0) {
        setSearchResults(result);
      } else if (result?.results && Array.isArray(result.results)) {
        setSearchResults(result.results);
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
    onUpdate({ wantsDomain: false, selectedDomain: null });
  };

  return (
    <OnboardingLayout
      step={8}
      totalSteps={10}
      title="Custom Domain & Hosting"
      description="Get your own professional web address (optional)"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Free Subdomain Info */}
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-success mb-1">
            <Check className="h-5 w-5" />
            <span className="font-medium">Free subdomain included!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your website is already live at <strong>{data.slug || "your-name"}.everydriver.co.uk</strong>
          </p>
        </div>

        {/* Domain Search Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">Want your own custom domain?</Label>
            <Badge variant="outline">Optional</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Stand out with a professional domain like <strong>yourname.co.uk</strong>
          </p>

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
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.domain}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                    result.available
                      ? data.selectedDomain === result.domain
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 cursor-pointer"
                      : "border-border bg-muted/50 opacity-60"
                  )}
                  onClick={() => result.available && selectDomain(result.domain)}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{result.domain}</span>
                    {result.available ? (
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Taken</Badge>
                    )}
                  </div>
                  {result.available && (
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">
                        £{result.price.toFixed(2)}/year
                      </span>
                      {data.selectedDomain === result.domain ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hosting Section - Only show if domain selected */}
        {data.selectedDomain && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Add Hosting Package</Label>
              <Badge variant="outline">Recommended</Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {hostingPackages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={cn(
                    "relative cursor-pointer transition-all",
                    selectedHosting === pkg.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50",
                    pkg.popular && "border-emerald-500"
                  )}
                  onClick={() => {
                    setSelectedHosting(pkg.id);
                    onUpdate({ wantsHosting: true });
                  }}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-4 pt-6 text-center">
                    <h4 className="font-semibold text-foreground mb-1">{pkg.name}</h4>
                    <div className="text-2xl font-bold text-foreground mb-3">
                      £{pkg.price.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 justify-center">
                          <Check className="h-3 w-3 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {selectedHosting === pkg.id && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-primary text-sm">
                        <Shield className="h-4 w-4" />
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
        {(data.selectedDomain || selectedHosting) && (
          <div className="bg-secondary rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected items:</span>
              <div className="text-right">
                {data.selectedDomain && (
                  <div className="text-foreground">{data.selectedDomain}</div>
                )}
                {selectedHosting && (
                  <div className="text-foreground">
                    {hostingPackages.find((p) => p.id === selectedHosting)?.name}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              You'll be able to complete payment after setup
            </p>
          </div>
        )}

        {/* Skip Option */}
        {!data.selectedDomain && searchResults.length === 0 && (
          <div className="text-center">
            <Button variant="ghost" onClick={skipDomain} className="text-muted-foreground">
              Skip for now — I'll use my free subdomain
            </Button>
          </div>
        )}
      </div>

      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        canProceed={true}
        nextLabel={data.selectedDomain ? "Continue with Domain" : "Continue with Free Subdomain"}
      />
    </OnboardingLayout>
  );
}
