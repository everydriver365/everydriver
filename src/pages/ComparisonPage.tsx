import { Check, Minus, Star, MapPin, Camera, Video, Building2, Phone, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const planNames = ["Free", "All-In", "GPS", "Single Dashcam", "Duo Dashcam", "Multi-School"];
const planPrices = ["£0", "£4.99", "£16", "£25", "£29", "Custom"];
const planPeriods = ["/mo", "/mo", "/mo", "/mo", "/mo", ""];
const planCtas = ["Start Free", "Get All-In", "Add GPS", "Add Dashcam", "Go Duo", "Contact Us"];
const planIcons = [
  <Star className="h-4 w-4" />, <Zap className="h-4 w-4" />, <MapPin className="h-4 w-4" />,
  <Camera className="h-4 w-4" />, <Video className="h-4 w-4" />, <Building2 className="h-4 w-4" />,
];
const popularIdx = 1;
const planDescs = [
  "Get started for free",
  "Everything you need to run your business",
  "Live tracking & mileage logging",
  "Forward-facing dashcam protection",
  "Full dual-camera coverage",
  "For driving schools with multiple instructors",
];

interface FeatureRow {
  category: string;
  features: { name: string; values: (boolean | string)[] }[];
}

const featureData: FeatureRow[] = [
  {
    category: "Core",
    features: [
      { name: "Lesson diary & scheduling", values: [true, true, true, true, true, true] },
      { name: "Active pupils", values: ["10", "Unlimited", "Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
      { name: "Pupil progress tracking", values: [true, true, true, true, true, true] },
      { name: "Basic messaging", values: [true, true, true, true, true, true] },
      { name: "Pupil portal", values: [true, true, true, true, true, true] },
    ],
  },
  {
    category: "Business Tools",
    features: [
      { name: "Online booking page", values: [false, true, true, true, true, true] },
      { name: "Card payments (Square)", values: [false, true, true, true, true, true] },
      { name: "Bank payments (GoCardless)", values: [false, true, true, true, true, true] },
      { name: "Cash payment tracking", values: [false, true, true, true, true, true] },
      { name: "Parent portal", values: [false, true, true, true, true, true] },
      { name: "Pupil app access", values: [false, true, true, true, true, true] },
      { name: "Broadcast messaging", values: [false, true, true, true, true, true] },
      { name: "Performance analytics", values: [false, true, true, true, true, true] },
      { name: "Mini website builder", values: [false, true, true, true, true, true] },
    ],
  },
  {
    category: "GPS & Tracking",
    features: [
      { name: "Live vehicle tracking", values: [false, false, true, true, true, true] },
      { name: "Route recording", values: [false, false, true, true, true, true] },
      { name: "Automatic mileage logging", values: [false, false, true, true, true, true] },
      { name: "Driver behaviour scores", values: [false, false, true, true, true, true] },
      { name: "Speed & harsh event alerts", values: [false, false, true, true, true, true] },
      { name: "Geofence zones", values: [false, false, true, true, true, true] },
      { name: "Fleet overview map", values: [false, false, true, true, true, true] },
    ],
  },
  {
    category: "Dashcam",
    features: [
      { name: "Forward-facing camera", values: [false, false, false, true, true, true] },
      { name: "Incident recording", values: [false, false, false, true, true, true] },
      { name: "Cloud video storage", values: [false, false, false, true, true, true] },
      { name: "Event-triggered clips", values: [false, false, false, true, true, true] },
      { name: "Insurance evidence export", values: [false, false, false, true, true, true] },
      { name: "Cabin-facing camera", values: [false, false, false, false, true, true] },
      { name: "Dual-view playback", values: [false, false, false, false, true, true] },
      { name: "Pupil coaching clips", values: [false, false, false, false, true, true] },
      { name: "Priority cloud storage", values: [false, false, false, false, true, true] },
    ],
  },
  {
    category: "Multi-School",
    features: [
      { name: "Multi-instructor management", values: [false, false, false, false, false, true] },
      { name: "Centralised billing", values: [false, false, false, false, false, true] },
      { name: "Staff performance reports", values: [false, false, false, false, false, true] },
      { name: "Custom branding", values: [false, false, false, false, false, true] },
      { name: "API access", values: [false, false, false, false, false, true] },
      { name: "Dedicated account manager", values: [false, false, false, false, false, true] },
    ],
  },
];

function CellValue({ value, popular }: { value: boolean | string; popular: boolean }) {
  if (typeof value === "string") {
    return <span className={cn("text-xs font-semibold", popular ? "text-primary" : "text-foreground")}>{value}</span>;
  }
  return value
    ? <Check className={cn("h-4 w-4 mx-auto", popular ? "text-primary" : "text-emerald-500")} />
    : <Minus className="h-4 w-4 mx-auto text-muted-foreground/20" />;
}

export default function ComparisonPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-[1200px] mx-auto text-center">
          <Badge className="mb-4 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 text-xs">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-3">Choose Your Plan</h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready. No contracts, cancel anytime.
          </p>
        </div>
      </div>

      {/* Plan summary cards */}
      <div className="max-w-[1200px] mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {planNames.map((name, i) => (
            <div
              key={name}
              className={cn(
                "rounded-2xl border bg-card p-4 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1",
                i === popularIdx && "border-primary ring-2 ring-primary/20 relative"
              )}
            >
              {i === popularIdx && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[9px] shadow-md">Most Popular</Badge>
                </div>
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
                i === popularIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {planIcons[i]}
              </div>
              <h3 className="font-bold text-foreground text-sm">{name}</h3>
              <div className="text-2xl font-black text-foreground mt-1">
                {planPrices[i]}
                {planPeriods[i] && <span className="text-xs font-normal text-muted-foreground">{planPeriods[i]}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{planDescs[i]}</p>
              <Button
                variant={i === popularIdx ? "default" : "outline"}
                size="sm"
                className="w-full mt-3 text-xs font-semibold"
              >
                {planNames[i] === "Multi-School" && <Phone className="h-3 w-3 mr-1" />}
                {planCtas[i]}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">Full Feature Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">Everything included in each plan at a glance</p>
        </div>

        <div className="overflow-x-auto rounded-2xl overflow-hidden border shadow-sm">
          {/* Dark header */}
          <div className="bg-primary flex">
            <div className="w-48 shrink-0 p-5 flex items-end">
              <span className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider">Compare Plans</span>
            </div>
            {planNames.map((name, i) => (
              <div
                key={name}
                className={cn(
                  "flex-1 min-w-[100px] p-4 text-center text-primary-foreground",
                  i === popularIdx && "bg-primary-foreground/10"
                )}
              >
                {i === popularIdx && (
                  <div className="text-[9px] uppercase tracking-widest font-bold text-warning mb-1">★ Popular</div>
                )}
                <div className="text-2xl font-black">
                  {planPrices[i]}
                  <span className="text-xs font-normal opacity-60">{planPeriods[i]}</span>
                </div>
                <div className="text-xs font-semibold mt-0.5 opacity-90">{name}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="bg-card">
            {featureData.map((group) => (
              <div key={group.category}>
                <div className="px-4 py-2 bg-muted/15 border-y border-border/20">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{group.category}</span>
                </div>
                {group.features.map((feat, fi) => (
                  <div key={feat.name} className={cn("flex border-b border-border/10", fi % 2 !== 0 && "bg-muted/5")}>
                    <div className="w-48 shrink-0 p-2.5 pl-4 text-xs text-foreground font-medium flex items-center">
                      {feat.name}
                    </div>
                    {feat.values.map((val, vi) => (
                      <div
                        key={vi}
                        className={cn(
                          "flex-1 min-w-[100px] p-2.5 flex items-center justify-center",
                          vi === popularIdx && "bg-primary/5"
                        )}
                      >
                        <CellValue value={val} popular={vi === popularIdx} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* CTA row */}
            <div className="flex border-t-2 border-primary/20 bg-muted/5">
              <div className="w-48 shrink-0 p-4" />
              {planNames.map((_, i) => (
                <div key={i} className="flex-1 min-w-[100px] p-3 flex items-center justify-center">
                  <Button
                    variant={i === popularIdx ? "default" : "outline"}
                    size="sm"
                    className="text-xs font-semibold w-full"
                  >
                    {planCtas[i]}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer notes */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-sm text-muted-foreground">All plans include pupil app, parent portal & unlimited lesson records.</p>
          <p className="text-xs text-muted-foreground/60">VAT not included. No tie-ins — cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
