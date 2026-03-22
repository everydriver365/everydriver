import { Check, Minus, Star, MapPin, Camera, Video, Building2, Phone, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useComparisonPlans, useComparisonFeatures, type ComparisonPlan, type ComparisonFeature } from "@/hooks/useComparisonData";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

/** Mobile: swipeable plan cards */
function MobileComparison({
  plans,
  featureGroups,
  popularIdx,
  onCtaClick,
}: {
  plans: ComparisonPlan[];
  featureGroups: { category: string; features: ComparisonFeature[] }[];
  popularIdx: number;
  onCtaClick: (slug: string) => void;
}) {
  const [idx, setIdx] = useState(Math.max(popularIdx, 0));
  const plan = plans[idx];
  if (!plan) return null;

  return (
    <div className="px-4 py-8">
      {/* Plan selector */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1.5">
          {plans.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIdx(i)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                i === idx
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={idx === plans.length - 1}
          onClick={() => setIdx(idx + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Plan header card */}
      <div className={cn(
        "rounded-xl border-2 p-5 text-center mb-6",
        idx === popularIdx ? "border-primary bg-primary/5" : "border-border bg-card"
      )}>
        {plan.is_popular && (
          <Badge className="mb-2 text-[10px]">★ Most Popular</Badge>
        )}
        <div className="text-3xl font-black text-foreground">
          {plan.price}
          <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
        </div>
        <div className="text-sm font-semibold text-foreground mt-1">{plan.name}</div>
        {plan.description && (
          <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
        )}
        <Button
          variant={idx === popularIdx ? "default" : "outline"}
          size="sm"
          className="mt-4 w-full text-xs font-semibold"
          onClick={() => onCtaClick(plan.slug)}
        >
          {plan.slug === "multi_school" && <Phone className="h-3 w-3 mr-1" />}
          {plan.cta_text}
        </Button>
      </div>

      {/* Feature list */}
      <div className="space-y-4">
        {featureGroups.map((group) => (
          <div key={group.category}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
              {group.category}
            </div>
            <div className="rounded-lg border bg-card overflow-hidden">
              {group.features.map((feat, fi) => {
                const val = feat.plan_values[plan.slug] ?? false;
                const isIncluded = val === true || (typeof val === "string" && val.length > 0);
                return (
                  <div
                    key={feat.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs",
                      fi % 2 !== 0 && "bg-muted/5",
                      fi < group.features.length - 1 && "border-b border-border/10"
                    )}
                  >
                    <span className={cn("font-medium", isIncluded ? "text-foreground" : "text-muted-foreground/50")}>
                      {feat.feature_name}
                    </span>
                    <CellValue value={val} popular={idx === popularIdx} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Desktop: full comparison table */
function DesktopComparison({
  plans,
  featureGroups,
  popularIdx,
  onCtaClick,
}: {
  plans: ComparisonPlan[];
  featureGroups: { category: string; features: ComparisonFeature[] }[];
  popularIdx: number;
  onCtaClick: (slug: string) => void;
}) {
  return (
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
                  onClick={() => onCtaClick(plan.slug)}
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
  );
}

export default function ComparisonPage() {
  const { data: plans = [], isLoading: plansLoading } = useComparisonPlans();
  const { data: features = [], isLoading: featuresLoading } = useComparisonFeatures();
  const navigate = useNavigate();

  const featureGroups = useMemo(() => groupFeatures(features), [features]);
  const popularIdx = useMemo(() => plans.findIndex((p) => p.is_popular), [plans]);

  const handleCtaClick = (slug: string) => {
    if (slug === "multi_school") {
      navigate("/instructor-app/contact");
    } else if (slug === "all_in") {
      navigate("/instructor-app/signup?plan=all_in&promo=first-month-free");
    } else if (slug === "free") {
      navigate("/instructor-app/signup");
    } else {
      navigate(`/instructor-app/signup?plan=${slug}`);
    }
  };

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
      <div className="bg-primary text-primary-foreground py-10 md:py-16 px-4">
        <div className="max-w-[1200px] mx-auto text-center">
          <Badge className="mb-4 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 text-xs">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black mb-3">Choose Your Plan</h1>
          <p className="text-primary-foreground/70 text-base md:text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready. No contracts, cancel anytime.
          </p>
        </div>
      </div>

      {/* Mobile: card-based view */}
      <div className="md:hidden">
        <MobileComparison
          plans={plans}
          featureGroups={featureGroups}
          popularIdx={popularIdx}
          onCtaClick={handleCtaClick}
        />
        <div className="text-center pb-8 space-y-1 px-4">
          <p className="text-xs text-muted-foreground">All plans include pupil app, parent portal & unlimited lesson records.</p>
          <p className="text-[10px] text-muted-foreground/60">VAT not included. No tie-ins — cancel anytime.</p>
        </div>
      </div>

      {/* Desktop: full table */}
      <div className="hidden md:block">
        <DesktopComparison
          plans={plans}
          featureGroups={featureGroups}
          popularIdx={popularIdx}
          onCtaClick={handleCtaClick}
        />
      </div>
    </div>
  );
}
