import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Globe, Lock, Search, Shield, Sparkles, Package, Heart } from "lucide-react";
import { useInstructorAddons, type AddonType } from "@/hooks/useInstructorAddons";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddonCard {
  type: AddonType;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  freeEquivalent: string;
}

const ADDONS: AddonCard[] = [
  {
    type: "pro_website",
    name: "Pro Website",
    price: "£4.99",
    description: "Multi-page CMS with custom SEO, Google Analytics, and schema markup",
    features: [
      "5 pages: Home, About, Services, Reviews, Contact",
      "Custom SEO meta tags per page",
      "Google Analytics integration",
      "Schema markup for search engines",
    ],
    icon: <Globe className="h-6 w-6" />,
    freeEquivalent: "1-page mini-site",
  },
  {
    type: "custom_domain",
    name: "Custom Domain",
    price: "£1.99",
    description: "Connect your own domain with automatic DNS management",
    features: [
      "Link your own domain (e.g. johnsdriving.co.uk)",
      "Automatic DNS configuration",
      "Professional email forwarding",
      "Domain health monitoring",
    ],
    icon: <Lock className="h-6 w-6" />,
    freeEquivalent: "Free subdomain",
  },
  {
    type: "ssl_hosting",
    name: "SSL + Hosting",
    price: "£2.99",
    description: "Dedicated SSL certificate, priority CDN hosting, and uptime monitoring",
    features: [
      "Dedicated SSL certificate",
      "Priority CDN hosting",
      "Uptime monitoring badge",
      "Faster page load speeds",
    ],
    icon: <Shield className="h-6 w-6" />,
    freeEquivalent: "Shared hosting",
  },
  {
    type: "seo_boost",
    name: "SEO Boost",
    price: "£3.99",
    description: "Auto-generated sitemap, Search Console integration, and local SEO",
    features: [
      "Auto-generated XML sitemap",
      "Google Search Console integration",
      "Local SEO optimisation",
      "Monthly SEO health report",
    ],
    icon: <Search className="h-6 w-6" />,
    freeEquivalent: "Basic meta tags only",
  },
];

const HEALTHCARE_ADDON: AddonCard = {
  type: "healthcare",
  name: "Healthcare & Wellbeing",
  price: "£19.99",
  description: "Comprehensive health cashback plan — dental, optical, GP access, physio and mental health support",
  features: [
    "Dental cashback up to £150/yr",
    "Optical cashback up to £100/yr",
    "24/7 GP access (phone & video)",
    "Physio & mental health sessions",
    "Employee Assistance Programme (EAP)",
    "No waiting period — instant cover",
  ],
  icon: <Heart className="h-6 w-6" />,
  freeEquivalent: "Not included",
};

const BUNDLE_PRICE = "£9.99";
const BUNDLE_SAVING = "£3.96";

export default function InstructorWebsiteAddons() {
  const { hasAddon, refetch } = useInstructorAddons();
  const { instructor } = useInstructorAuth();
  const [activating, setActivating] = useState<string | null>(null);

  const handleActivate = async (type: AddonType, price: number) => {
    if (!instructor?.id) return;
    setActivating(type);
    try {
      const { error } = await supabase.from("instructor_addons").insert({
        instructor_id: instructor.id,
        addon_type: type,
        price_monthly: price,
        status: "active",
      });
      if (error) throw error;

      // If activating bundle, also activate all 4 individual types
      if (type === "website_pro_pack") {
        for (const addon of ADDONS) {
          await supabase.from("instructor_addons").upsert({
            instructor_id: instructor.id,
            addon_type: addon.type,
            price_monthly: 0,
            status: "active",
          }, { onConflict: "instructor_id,addon_type" });
        }
      }

      await refetch();
      toast.success(`${type === "website_pro_pack" ? "Website Pro Pack" : ADDONS.find(a => a.type === type)?.name} activated!`, {
        description: "Payment will be collected via Direct Debit.",
      });
    } catch {
      toast.error("Failed to activate add-on. Please try again.");
    } finally {
      setActivating(null);
    }
  };

  const hasBundleOrAll = hasAddon("website_pro_pack");

  return (
    <InstructorPortalLayout>
      <InstructorPageHeader lucideIcon={Package} title="Website Add-Ons" subtitle="Enhance your online presence with monthly add-ons" />
      {/* Bundle card */}
      <Card className="border-2 border-primary bg-primary/5 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Website Pro Pack
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Save {BUNDLE_SAVING}/mo
                  </Badge>
                </CardTitle>
                <CardDescription>All 4 add-ons in one bundle</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-foreground">{BUNDLE_PRICE}</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {ADDONS.map(addon => (
              <div key={addon.type} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                {addon.name}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          {hasBundleOrAll ? (
            <Button variant="outline" className="w-full" disabled>
              <Check className="h-4 w-4 mr-2" /> Active
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => handleActivate("website_pro_pack", 9.99)}
              disabled={activating === "website_pro_pack"}
            >
              {activating === "website_pro_pack" ? "Activating..." : "Get the Bundle — " + BUNDLE_PRICE + "/mo"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Individual add-on cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {ADDONS.map(addon => {
          const isActive = hasAddon(addon.type);
          return (
            <Card key={addon.type}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                    {addon.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{addon.name}</CardTitle>
                    <CardDescription className="text-xs">{addon.freeEquivalent} on Free</CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-foreground">{addon.price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{addon.description}</p>
                <ul className="space-y-1.5">
                  {addon.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isActive ? (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    <Check className="h-4 w-4 mr-2" /> Active
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleActivate(addon.type, parseFloat(addon.price.replace("£", "")))}
                    disabled={!!activating}
                  >
                    {activating === addon.type ? "Activating..." : `Add for ${addon.price}/mo`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </InstructorPortalLayout>
  );
}
