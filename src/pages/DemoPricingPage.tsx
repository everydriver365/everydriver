import { Check, X, Star, MapPin, Camera, Video, Building2, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
  ctaVariant?: "default" | "outline" | "secondary";
  badge?: string;
  contact?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "£0",
    period: "/month",
    description: "Get started with core diary & pupil management",
    icon: <Star className="h-5 w-5" />,
    cta: "Start Free",
    ctaVariant: "outline",
    features: [
      { text: "Lesson diary & scheduling", included: true },
      { text: "Up to 10 active pupils", included: true },
      { text: "Pupil progress tracking", included: true },
      { text: "Basic messaging", included: true },
      { text: "Pupil portal access", included: true },
      { text: "Booking page", included: false },
      { text: "Parent portal", included: false },
      { text: "Payments & invoicing", included: false },
      { text: "GPS tracking", included: false },
      { text: "Dashcam integration", included: false },
    ],
  },
  {
    name: "All-In",
    price: "£4.99",
    period: "/month",
    description: "Everything you need to run your business",
    icon: <Star className="h-5 w-5" />,
    cta: "Get All-In",
    popular: true,
    badge: "Most Popular",
    features: [
      { text: "Unlimited pupils", included: true },
      { text: "Full diary & scheduling", included: true },
      { text: "Online booking page", included: true },
      { text: "Card & bank payments", included: true },
      { text: "Parent portal", included: true },
      { text: "Pupil app access", included: true },
      { text: "Broadcast messaging", included: true },
      { text: "Performance analytics", included: true },
      { text: "GPS tracking", included: false },
      { text: "Dashcam integration", included: false },
    ],
  },
  {
    name: "GPS",
    price: "£16",
    period: "/month",
    description: "All-In features plus live GPS tracking",
    icon: <MapPin className="h-5 w-5" />,
    cta: "Add GPS",
    features: [
      { text: "Everything in All-In", included: true },
      { text: "Live vehicle tracking", included: true },
      { text: "Route recording", included: true },
      { text: "Mileage logging", included: true },
      { text: "Driver behaviour scores", included: true },
      { text: "Speed & harsh event alerts", included: true },
      { text: "Geofence zones", included: true },
      { text: "Fleet overview map", included: true },
      { text: "Single dashcam", included: false },
      { text: "Dual dashcam", included: false },
    ],
  },
  {
    name: "Single Dashcam",
    price: "£25",
    period: "/month",
    description: "GPS tracking with forward-facing camera",
    icon: <Camera className="h-5 w-5" />,
    cta: "Add Dashcam",
    features: [
      { text: "Everything in GPS", included: true },
      { text: "Forward-facing camera", included: true },
      { text: "Incident recording", included: true },
      { text: "Cloud video storage", included: true },
      { text: "Event-triggered clips", included: true },
      { text: "Video review tools", included: true },
      { text: "Insurance evidence", included: true },
      { text: "Lesson video playback", included: true },
      { text: "Cabin camera", included: false },
      { text: "Multi-school tools", included: false },
    ],
  },
  {
    name: "Duo Dashcam",
    price: "£29",
    period: "/month",
    description: "Dual camera coverage — road & cabin",
    icon: <Video className="h-5 w-5" />,
    cta: "Go Duo",
    badge: "Best Value",
    features: [
      { text: "Everything in Single Dashcam", included: true },
      { text: "Cabin-facing camera", included: true },
      { text: "Dual-view playback", included: true },
      { text: "Pupil coaching clips", included: true },
      { text: "Enhanced driver analysis", included: true },
      { text: "Picture-in-picture view", included: true },
      { text: "Priority cloud storage", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Multi-school tools", included: false },
      { text: "Custom branding", included: false },
    ],
  },
  {
    name: "Multi-School",
    price: "Custom",
    period: "",
    description: "Manage multiple instructors under one roof",
    icon: <Building2 className="h-5 w-5" />,
    cta: "Contact Us",
    ctaVariant: "outline",
    contact: true,
    features: [
      { text: "Everything in Duo Dashcam", included: true },
      { text: "Multi-instructor management", included: true },
      { text: "Fleet-wide dashcam", included: true },
      { text: "Centralised billing", included: true },
      { text: "Staff performance reports", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Priority support", included: true },
      { text: "Custom integrations", included: true },
    ],
  },
];

export default function DemoPricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center py-12 px-4">
        <Badge variant="secondary" className="mb-4 text-xs">
          Simple, transparent pricing
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Plans that grow with your business
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base">
          Start free, upgrade when you're ready. No tie-ins, cancel anytime. 
          Every plan includes the pupil & parent app.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border bg-card p-6 flex flex-col transition-shadow hover:shadow-lg",
                plan.popular && "border-primary ring-2 ring-primary/20 shadow-md"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    className={cn(
                      "text-xs px-3 py-0.5 shadow-sm",
                      plan.popular
                        ? "bg-primary text-primary-foreground"
                        : "bg-warning text-warning-foreground"
                    )}
                  >
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      plan.popular
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-foreground"
                    )}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <div
                    key={feature.text}
                    className="flex items-start gap-2.5"
                  >
                    {feature.included ? (
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                variant={plan.ctaVariant || "default"}
                className={cn(
                  "w-full font-semibold",
                  plan.popular && "bg-primary hover:bg-primary/90"
                )}
              >
                {plan.contact && (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-sm text-muted-foreground">
            All plans include the pupil app, parent portal access & unlimited lesson records.
          </p>
          <p className="text-sm text-muted-foreground">
            Hardware plans include a pre-configured tracking device shipped to your door.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-4">
            VAT not included. Multi-School & Enterprise — contact us for a tailored quote.
          </p>
        </div>
      </div>
    </div>
  );
}
