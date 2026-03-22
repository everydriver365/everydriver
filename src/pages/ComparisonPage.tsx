import { Check, Minus, Star, MapPin, Camera, Video, Building2, Phone, Zap, ChevronLeft, ChevronRight, Heart, Stethoscope, Eye, SmilePlus, Brain, ShieldCheck } from "lucide-react";
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

function CompetitorCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === "string") {
    return <span className={cn("text-xs font-semibold", highlight ? "text-primary" : "text-foreground")}>{value}</span>;
  }
  return value
    ? <Check className={cn("h-4 w-4", highlight ? "text-primary" : "text-emerald-500")} />
    : <Minus className="h-4 w-4 text-muted-foreground/30" />;
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

      {/* Competitor Comparison */}
      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">
            <Zap className="h-3 w-3 mr-1" /> Why Switch?
          </Badge>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">How We Compare to Other Diary Apps</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
            Same diary features, plus GPS, dashcams, healthcare & more — starting from FREE.
          </p>
        </div>

        {/* Desktop: comparison grid */}
        <div className="hidden md:block">
          <div className="rounded-2xl border overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 bg-primary text-primary-foreground">
              <div className="p-4 flex items-end">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Feature</span>
              </div>
              <div className="p-4 text-center bg-primary-foreground/10 border-x border-primary-foreground/10">
                <div className="text-[9px] uppercase tracking-widest font-bold text-warning mb-1">★ EveryDriver</div>
                <div className="text-xl font-black">From FREE</div>
                <div className="text-[10px] opacity-70">to £49/mo</div>
              </div>
              {[
                { name: "Total Drive", price: "~£24/mo" },
                { name: "MyDriveTime", price: "~£19/mo" },
                { name: "ADI Book", price: "~£16/mo" },
              ].map((c) => (
                <div key={c.name} className="p-4 text-center">
                  <div className="text-xs font-semibold opacity-90">{c.name}</div>
                  <div className="text-lg font-bold mt-0.5">{c.price}</div>
                </div>
              ))}
            </div>

            {[
              { feature: "Starting price", ed: "FREE", td: "£24/mo", mdt: "£19/mo", adi: "£16/mo" },
              { feature: "Diary & scheduling", ed: true, td: true, mdt: true, adi: true },
              { feature: "Professional website", ed: true, td: true, mdt: true, adi: true },
              { feature: "Pupil & parent apps", ed: "Both included", td: "Pupil only", mdt: "Limited", adi: "None" },
              { feature: "GPS route tracking", ed: true, td: false, mdt: false, adi: false },
              { feature: "Dashcam telematics", ed: true, td: false, mdt: false, adi: false },
              { feature: "HMRC MTD tax filing", ed: "Free", td: false, mdt: false, adi: false },
              { feature: "Healthcare benefits", ed: "Included (GPS+)", td: false, mdt: false, adi: false },
              { feature: "No tie-in contract", ed: true, td: true, mdt: true, adi: true },
            ].map((row, ri) => (
              <div key={row.feature} className={cn("grid grid-cols-5 border-t border-border/10", ri % 2 !== 0 && "bg-muted/5")}>
                <div className="p-3 pl-4 text-xs font-medium text-foreground flex items-center">{row.feature}</div>
                <div className="p-3 flex items-center justify-center bg-primary/5 border-x border-border/10">
                  <CompetitorCell value={row.ed} highlight />
                </div>
                <div className="p-3 flex items-center justify-center"><CompetitorCell value={row.td} /></div>
                <div className="p-3 flex items-center justify-center"><CompetitorCell value={row.mdt} /></div>
                <div className="p-3 flex items-center justify-center"><CompetitorCell value={row.adi} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: stacked cards */}
        <div className="md:hidden space-y-3">
          {[
            { feature: "Starting price", ed: "FREE", others: "From £16–£24/mo" },
            { feature: "GPS route tracking", ed: "Included", others: "Not available" },
            { feature: "Dashcam telematics", ed: "Included", others: "Not available" },
            { feature: "HMRC MTD tax filing", ed: "Free", others: "Not available" },
            { feature: "Pupil & parent apps", ed: "Both included", others: "Limited or none" },
            { feature: "Healthcare add-on", ed: "£19.99/mo", others: "Not available" },
          ].map((row) => (
            <div key={row.feature} className="rounded-xl border bg-card p-4">
              <div className="text-xs font-bold text-foreground mb-2">{row.feature}</div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-primary">{row.ed}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{row.others}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Healthcare Benefits Showcase */}
      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16">
        <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50/50 to-background dark:from-rose-950/20 dark:to-background overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <Badge className="mb-2 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700 text-xs">
                  <Heart className="h-3 w-3 mr-1" /> Optional Add-On
                </Badge>
                <h2 className="text-2xl md:text-3xl font-black text-foreground">Healthcare & Wellbeing</h2>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
                  The only driving instructor app that offers healthcare benefits.
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  Look after yourself while you look after your pupils. Add comprehensive health cover to any paid plan.
                </p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-3xl font-black text-foreground">£19.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <p className="text-xs text-muted-foreground">Available on any paid plan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <SmilePlus className="h-5 w-5" />, title: "Dental Cashback", desc: "Up to £150/yr back on dental treatments", highlight: "£150/yr" },
                { icon: <Eye className="h-5 w-5" />, title: "Optical Cashback", desc: "Up to £100/yr back on eye tests & glasses", highlight: "£100/yr" },
                { icon: <Stethoscope className="h-5 w-5" />, title: "24/7 GP Access", desc: "Phone & video consultations anytime, day or night", highlight: "Unlimited" },
                { icon: <ShieldCheck className="h-5 w-5" />, title: "Physio Sessions", desc: "Get treated faster — no NHS waiting lists", highlight: "Included" },
                { icon: <Brain className="h-5 w-5" />, title: "Mental Health Support", desc: "Counselling sessions & wellbeing resources", highlight: "Included" },
                { icon: <Heart className="h-5 w-5" />, title: "Employee Assistance", desc: "24/7 confidential helpline for life's challenges", highlight: "24/7" },
              ].map((benefit) => (
                <div key={benefit.title} className="flex gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{benefit.title}</span>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{benefit.highlight}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <Button
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => navigate("/instructor-app/signup")}
              >
                <Heart className="h-4 w-4 mr-2" />
                Get Started & Add Healthcare
              </Button>
              <p className="text-xs text-muted-foreground">No waiting period · Instant cover · Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
