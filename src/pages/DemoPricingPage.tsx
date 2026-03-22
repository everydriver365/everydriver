import { useState } from "react";
import { Check, X, Star, MapPin, Camera, Video, Building2, Phone, ChevronRight, Zap, Shield, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Shared plan data ─── */
interface PlanFeature { text: string; included: boolean }
interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
  badge?: string;
  contact?: boolean;
  color: string; // tailwind token
}

const plans: Plan[] = [
  {
    name: "Free", price: "£0", period: "/mo", color: "muted",
    description: "Core diary & pupil management",
    icon: <Star className="h-5 w-5" />, cta: "Start Free",
    features: [
      { text: "Lesson diary & scheduling", included: true },
      { text: "Up to 10 active pupils", included: true },
      { text: "Pupil progress tracking", included: true },
      { text: "Basic messaging", included: true },
      { text: "Pupil portal", included: true },
      { text: "Booking page", included: false },
      { text: "Payments", included: false },
      { text: "GPS tracking", included: false },
      { text: "Dashcam", included: false },
    ],
  },
  {
    name: "All-In", price: "£4.99", period: "/mo", color: "primary",
    description: "Everything to run your business", popular: true, badge: "Most Popular",
    icon: <Zap className="h-5 w-5" />, cta: "Get All-In",
    features: [
      { text: "Unlimited pupils", included: true },
      { text: "Online booking page", included: true },
      { text: "Card & bank payments", included: true },
      { text: "Parent portal", included: true },
      { text: "Pupil app", included: true },
      { text: "Broadcast messaging", included: true },
      { text: "Performance analytics", included: true },
      { text: "GPS tracking", included: false },
      { text: "Dashcam", included: false },
    ],
  },
  {
    name: "GPS", price: "£16", period: "/mo", color: "success",
    description: "All-In + live GPS tracking",
    icon: <MapPin className="h-5 w-5" />, cta: "Add GPS",
    features: [
      { text: "Everything in All-In", included: true },
      { text: "Live vehicle tracking", included: true },
      { text: "Route recording", included: true },
      { text: "Mileage logging", included: true },
      { text: "Driver behaviour scores", included: true },
      { text: "Speed alerts", included: true },
      { text: "Fleet map", included: true },
      { text: "Dashcam", included: false },
    ],
  },
  {
    name: "Single Dashcam", price: "£25", period: "/mo", color: "warning",
    description: "GPS + forward-facing camera",
    icon: <Camera className="h-5 w-5" />, cta: "Add Dashcam",
    features: [
      { text: "Everything in GPS", included: true },
      { text: "Forward camera", included: true },
      { text: "Incident recording", included: true },
      { text: "Cloud video storage", included: true },
      { text: "Event-triggered clips", included: true },
      { text: "Insurance evidence", included: true },
      { text: "Cabin camera", included: false },
    ],
  },
  {
    name: "Duo Dashcam", price: "£29", period: "/mo", color: "warning",
    description: "Dual camera — road & cabin", badge: "Best Value",
    icon: <Video className="h-5 w-5" />, cta: "Go Duo",
    features: [
      { text: "Everything in Single", included: true },
      { text: "Cabin-facing camera", included: true },
      { text: "Dual-view playback", included: true },
      { text: "Pupil coaching clips", included: true },
      { text: "Enhanced analytics", included: true },
      { text: "Priority storage", included: true },
    ],
  },
  {
    name: "Multi-School", price: "Custom", period: "", color: "secondary",
    description: "Multiple instructors, one platform", contact: true,
    icon: <Building2 className="h-5 w-5" />, cta: "Contact Us",
    features: [
      { text: "Everything in Duo", included: true },
      { text: "Multi-instructor mgmt", included: true },
      { text: "Centralised billing", included: true },
      { text: "Staff reports", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: true },
      { text: "Dedicated support", included: true },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   DESIGN A — Clean Cards Grid (current)
   ═══════════════════════════════════════════════════════════ */
function DesignA() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative rounded-2xl border bg-card p-6 flex flex-col transition-all hover:shadow-lg",
            plan.popular && "border-primary ring-2 ring-primary/20 shadow-md"
          )}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className={cn("text-xs px-3 py-0.5 shadow-sm",
                plan.popular ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"
              )}>{plan.badge}</Badge>
            </div>
          )}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
                plan.popular ? "bg-primary text-primary-foreground" : "bg-muted/30 text-foreground"
              )}>{plan.icon}</div>
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-foreground">{plan.price}</span>
              {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <div className="flex-1 space-y-2 mb-6">
            {plan.features.map((f) => (
              <div key={f.text} className="flex items-start gap-2.5">
                {f.included
                  ? <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                  : <X className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/30" />}
                <span className={cn("text-sm", f.included ? "text-foreground" : "text-muted-foreground/40")}>{f.text}</span>
              </div>
            ))}
          </div>
          <Button variant={plan.popular ? "default" : "outline"} className="w-full font-semibold">
            {plan.contact && <Phone className="h-4 w-4 mr-2" />}
            {plan.cta}
          </Button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN B — Horizontal Tiered Steps
   ═══════════════════════════════════════════════════════════ */
function DesignB() {
  return (
    <div className="space-y-3">
      {plans.map((plan, i) => (
        <div
          key={plan.name}
          className={cn(
            "relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border bg-card p-5 transition-all hover:shadow-md",
            plan.popular && "border-primary ring-2 ring-primary/20 bg-primary/[0.03]"
          )}
        >
          {/* Number / Icon */}
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold",
            plan.popular
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-foreground"
          )}>
            {plan.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground">{plan.name}</h3>
              {plan.badge && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0">{plan.badge}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {plan.features.filter(f => f.included).slice(0, 4).map(f => (
                <span key={f.text} className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {f.text}
                </span>
              ))}
              {plan.features.filter(f => f.included).length > 4 && (
                <span className="text-xs text-primary font-medium">
                  +{plan.features.filter(f => f.included).length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center gap-4 shrink-0 sm:text-right">
            <div>
              <span className="text-2xl font-bold text-foreground">{plan.price}</span>
              {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
            </div>
            <Button
              variant={plan.popular ? "default" : "outline"}
              size="sm"
              className="font-semibold whitespace-nowrap"
            >
              {plan.cta}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Connector line */}
          {i < plans.length - 1 && (
            <div className="hidden sm:block absolute -bottom-3 left-10 w-0.5 h-3 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN C — Dark Hero Cards with Gradient Accents
   ═══════════════════════════════════════════════════════════ */
function DesignC() {
  const colorMap: Record<string, string> = {
    muted: "from-muted/20 to-muted/5",
    primary: "from-primary/20 to-primary/5",
    success: "from-emerald-500/20 to-emerald-500/5",
    warning: "from-amber-500/20 to-amber-500/5",
    secondary: "from-secondary/20 to-secondary/5",
  };
  const accentMap: Record<string, string> = {
    muted: "bg-muted/50",
    primary: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    secondary: "bg-secondary",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative rounded-2xl overflow-hidden border bg-card flex flex-col",
            plan.popular && "ring-2 ring-primary/30"
          )}
        >
          {/* Gradient header */}
          <div className={cn("bg-gradient-to-b p-6 pb-4", colorMap[plan.color] || colorMap.muted)}>
            {plan.badge && (
              <Badge className="mb-3 text-[10px] bg-primary text-primary-foreground">{plan.badge}</Badge>
            )}
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground", accentMap[plan.color] || accentMap.muted)}>
                {plan.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
              {plan.period && <span className="text-sm text-muted-foreground font-medium">{plan.period}</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
          </div>

          {/* Divider accent */}
          <div className={cn("h-0.5", accentMap[plan.color] || accentMap.muted, "opacity-30")} />

          {/* Features */}
          <div className="p-6 pt-4 flex-1 flex flex-col">
            <div className="flex-1 space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <div key={f.text} className="flex items-start gap-2.5">
                  {f.included
                    ? <div className={cn("w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0", accentMap[plan.color] || accentMap.muted)}>
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    : <X className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/25" />}
                  <span className={cn("text-sm", f.included ? "text-foreground" : "text-muted-foreground/35")}>{f.text}</span>
                </div>
              ))}
            </div>
            <Button
              variant={plan.popular ? "default" : "outline"}
              className={cn("w-full font-semibold")}
            >
              {plan.contact && <Phone className="h-4 w-4 mr-2" />}
              {plan.cta}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN D — Compact Pill Cards (2 rows)
   ═══════════════════════════════════════════════════════════ */
function DesignD() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Software Plans */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Software Plans</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plans.slice(0, 2).map((plan) => (
            <div
              key={plan.name}
              onClick={() => setExpanded(expanded === plan.name ? null : plan.name)}
              className={cn(
                "rounded-2xl border bg-card p-5 cursor-pointer transition-all hover:shadow-md",
                plan.popular && "border-primary ring-1 ring-primary/20",
                expanded === plan.name && "ring-2 ring-primary/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  {plan.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{plan.badge}</Badge>}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>

              {expanded === plan.name && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  {plan.features.map(f => (
                    <div key={f.text} className="flex items-center gap-2">
                      {f.included
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                        : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}
                      <span className={cn("text-sm", f.included ? "text-foreground" : "text-muted-foreground/40")}>{f.text}</span>
                    </div>
                  ))}
                  <Button variant={plan.popular ? "default" : "outline"} size="sm" className="w-full mt-3 font-semibold">{plan.cta}</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hardware Plans */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Hardware Add-Ons <span className="text-muted-foreground/60">(includes All-In software)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.slice(2, 5).map((plan) => (
            <div
              key={plan.name}
              onClick={() => setExpanded(expanded === plan.name ? null : plan.name)}
              className={cn(
                "rounded-2xl border bg-card p-5 cursor-pointer transition-all hover:shadow-md",
                expanded === plan.name && "ring-2 ring-primary/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {plan.icon}
                <h3 className="font-bold text-foreground text-sm">{plan.name}</h3>
                {plan.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{plan.badge}</Badge>}
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-xs text-muted-foreground">{plan.description}</p>

              {expanded === plan.name && (
                <div className="mt-4 pt-3 border-t space-y-2">
                  {plan.features.map(f => (
                    <div key={f.text} className="flex items-center gap-2">
                      {f.included
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                        : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}
                      <span className={cn("text-xs", f.included ? "text-foreground" : "text-muted-foreground/40")}>{f.text}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-3 font-semibold">{plan.cta}</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise */}
      <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          <div>
            <h3 className="font-bold text-foreground">Multi-School & Enterprise</h3>
            <p className="text-sm text-muted-foreground">Custom pricing for driving schools with multiple instructors</p>
          </div>
        </div>
        <Button variant="outline" className="font-semibold shrink-0">
          <Phone className="h-4 w-4 mr-2" />
          Contact Us
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DEMO PAGE
   ═══════════════════════════════════════════════════════════ */
export default function DemoPricingPage() {
  const designs = [
    { id: "A", label: "Clean Cards", component: <DesignA /> },
    { id: "B", label: "Horizontal Steps", component: <DesignB /> },
    { id: "C", label: "Gradient Accents", component: <DesignC /> },
    { id: "D", label: "Grouped + Expandable", component: <DesignD /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 text-xs">Pricing Design Options</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Preferred Layout</h1>
          <p className="text-muted-foreground">4 design options — same plans, different presentations</p>
        </div>

        {/* All designs stacked */}
        <div className="space-y-16">
          {designs.map(({ id, label, component }) => (
            <section key={id}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {id}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{label}</h2>
                  <p className="text-sm text-muted-foreground">
                    {id === "A" && "Classic SaaS pricing grid — familiar and scannable"}
                    {id === "B" && "Vertical stacked rows — shows progression clearly"}
                    {id === "C" && "Colour-coded headers with gradient accents — premium feel"}
                    {id === "D" && "Software vs Hardware grouping — click to expand features"}
                  </p>
                </div>
              </div>
              {component}
              {id !== "D" && <div className="border-b border-border/40 mt-16" />}
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 mb-8 space-y-1">
          <p className="text-sm text-muted-foreground">All plans include pupil app, parent portal & unlimited lesson records.</p>
          <p className="text-xs text-muted-foreground/60">VAT not included. No tie-ins — cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
