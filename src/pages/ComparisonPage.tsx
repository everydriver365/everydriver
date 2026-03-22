import { Check, Minus, Star, MapPin, Camera, Video, Building2, Phone, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useComparisonPlans, useComparisonFeatures, type ComparisonPlan, type ComparisonFeature } from "@/hooks/useComparisonData";
import { useMemo } from "react";

const iconMap: Record<string, React.ReactNode> = {
  Star: <Star className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  MapPin: <MapPin className="h-4 w-4" />,
  Camera: <Camera className="h-4 w-4" />,
  Video: <Video className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
};

function CellValue({ value, popular }: { value: boolean | string; popular: boolean }) {
  if (typeof value === "string") {
    return <span className={cn("text-xs font-semibold", popular ? "text-primary" : "text-foreground")}>{value}</span>;
  }
  return value
    ? <Check className={cn("h-4 w-4 mx-auto", popular ? "text-primary" : "text-emerald-500")} />
    : <Minus className="h-4 w-4 mx-auto text-muted-foreground/20" />;
}

function groupFeatures(features: ComparisonFeature[]) {
  const groups: { category: string; features: ComparisonFeature[] }[] = [];
  for (const f of features) {
    const existing = groups.find((g) => g.category === f.category);
    if (existing) existing.features.push(f);
    else groups.push({ category: f.category, features: [f] });
  }
  return groups;
}

export default function ComparisonPage() {
  const { data: plans = [], isLoading: plansLoading } = useComparisonPlans();
  const { data: features = [], isLoading: featuresLoading } = useComparisonFeatures();

  const featureGroups = useMemo(() => groupFeatures(features), [features]);
  const popularIdx = useMemo(() => plans.findIndex((p) => p.is_popular), [plans]);

  if (plansLoading || featuresLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading plans...</div>
      </div>
    );
  }

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
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                className={cn(
                  "flex-1 min-w-[100px] p-4 text-center text-primary-foreground",
                  i === popularIdx && "bg-primary-foreground/10"
                )}
              >
                {plan.is_popular && (
                  <div className="text-[9px] uppercase tracking-widest font-bold text-warning mb-1">★ Popular</div>
                )}
                <div className="text-2xl font-black">
                  {plan.price}
                  <span className="text-xs font-normal opacity-60">{plan.period}</span>
                </div>
                <div className="text-xs font-semibold mt-0.5 opacity-90">{plan.name}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="bg-card">
            {featureGroups.map((group) => (
              <div key={group.category}>
                <div className="px-4 py-2 bg-muted/15 border-y border-border/20">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{group.category}</span>
                </div>
                {group.features.map((feat, fi) => (
                  <div key={feat.id} className={cn("flex border-b border-border/10", fi % 2 !== 0 && "bg-muted/5")}>
                    <div className="w-48 shrink-0 p-2.5 pl-4 text-xs text-foreground font-medium flex items-center">
                      {feat.feature_name}
                    </div>
                    {plans.map((plan, vi) => (
                      <div
                        key={plan.id}
                        className={cn(
                          "flex-1 min-w-[100px] p-2.5 flex items-center justify-center",
                          vi === popularIdx && "bg-primary/5"
                        )}
                      >
                        <CellValue
                          value={feat.plan_values[plan.slug] ?? false}
                          popular={vi === popularIdx}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* CTA row */}
            <div className="flex border-t-2 border-primary/20 bg-muted/5">
              <div className="w-48 shrink-0 p-4" />
              {plans.map((plan, i) => (
                <div key={plan.id} className="flex-1 min-w-[100px] p-3 flex items-center justify-center">
                  <Button
                    variant={i === popularIdx ? "default" : "outline"}
                    size="sm"
                    className="text-xs font-semibold w-full"
                  >
                    {plan.slug === "multi_school" && <Phone className="h-3 w-3 mr-1" />}
                    {plan.cta_text}
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
