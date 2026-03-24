import { Check, Minus, Star, MapPin, Camera, Video, Building2, Phone, Zap, ChevronLeft, ChevronRight, Heart, Stethoscope, Eye, SmilePlus, Brain, ShieldCheck, ArrowRight, Sparkles, Pill, Activity, Users, Plane, Info, Search, Scissors, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useComparisonPlans, useComparisonFeatures, type ComparisonPlan, type ComparisonFeature } from "@/hooks/useComparisonData";
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EnhancedHealthModal } from "@/components/EnhancedHealthModal";

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

/** Health badge for plan headers */
function HealthBadge({ slug }: { slug: string }) {
  if (slug === "gps" || slug === "gps_health") {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300">
        <Heart className="h-2.5 w-2.5" /> Basic Health
      </div>
    );
  }
  if (slug === "single_dashcam" || slug === "dashcam_health") {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300">
        <Heart className="h-2.5 w-2.5" /> Enhanced Health + Cancer Care
      </div>
    );
  }
  return null;
}

/** Check if a feature row is healthcare-related */
function isHealthcareRow(featureName: string) {
  const healthKeywords = ["health", "dental", "optical", "gp access", "physio", "mental", "cancer", "hospital", "eap", "wellbeing", "specialist"];
  const lower = featureName.toLowerCase();
  return healthKeywords.some((k) => lower.includes(k));
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
        <HealthBadge slug={plan.slug} />
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
                const isHealth = isHealthcareRow(feat.feature_name);
                return (
                  <div
                    key={feat.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs",
                      isHealth ? "bg-rose-50/60 dark:bg-rose-950/20" : fi % 2 !== 0 && "bg-muted/5",
                      fi < group.features.length - 1 && "border-b border-border/10"
                    )}
                  >
                    <span className={cn("font-medium", isIncluded ? "text-foreground" : "text-muted-foreground/50")}>
                      {isHealth && "🩺 "}{feat.feature_name}
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
              <HealthBadge slug={plan.slug} />
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
              {group.features.map((feat, fi) => {
                const isHealth = isHealthcareRow(feat.feature_name);
                return (
                  <div key={feat.id} className={cn(
                    "flex border-b border-border/10",
                    isHealth ? "bg-rose-50/50 dark:bg-rose-950/15" : fi % 2 !== 0 && "bg-muted/5"
                  )}>
                    <div className="w-48 shrink-0 p-2.5 pl-4 text-xs text-foreground font-medium flex items-center">
                      {isHealth && <Heart className="h-3 w-3 text-rose-500 mr-1.5 shrink-0" />}
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
                );
              })}
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
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthModalTier, setHealthModalTier] = useState<"basic" | "enhanced">("enhanced");

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
      {/* Hero — Healthcare-led */}
      <div className="bg-primary text-primary-foreground py-10 md:py-16 px-4">
        <div className="max-w-[1200px] mx-auto text-center">
          <Badge className="mb-4 bg-rose-500/20 text-rose-200 border-rose-400/30 text-xs">
            <Heart className="h-3 w-3 mr-1" /> No other ADI app offers this
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black mb-3">
            The Only ADI App with{" "}
            <span className="text-rose-300">FREE Private Healthcare</span>
          </h1>
          <p className="text-primary-foreground/80 text-base md:text-lg max-w-2xl mx-auto mb-2">
            Dental, GP, physio, mental health & cancer care — included free with GPS and Dashcam plans. 
            Underwritten by AXA Health, not a discount card.
          </p>
          <p className="text-primary-foreground/50 text-sm">
            Simple pricing. No contracts, cancel anytime.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: SmilePlus, label: "Dental & Optical" },
              { icon: Stethoscope, label: "24/7 GP Access" },
              { icon: Activity, label: "Physio & Specialists" },
              { icon: Brain, label: "Mental Health" },
              { icon: ShieldCheck, label: "Cancer Care" },
            ].map((item) => (
              <div key={item.label} className="inline-flex items-center gap-1.5 bg-primary-foreground/10 rounded-full px-3 py-1.5 text-[11px] font-semibold text-primary-foreground/90">
                <item.icon className="h-3.5 w-3.5 text-rose-300" />
                {item.label}
              </div>
            ))}
          </div>
          <Link
            to="/health-benefits"
            className="inline-flex items-center gap-1 mt-5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors"
          >
            Full healthcare breakdown <ArrowRight className="h-3 w-3" />
          </Link>
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

      {/* Healthcare Benefits Showcase — Two-tier layout */}
      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <Badge className="mb-2 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700 text-xs">
            <Heart className="h-3 w-3 mr-1" /> Included Free — No Other ADI App Offers This
          </Badge>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">Private Healthcare & Wellbeing</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl mx-auto">
            Underwritten by AXA Health. Real private medical insurance — not a discount card.
            Dental, GP, physio, mental health & cancer care included with your plan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Basic Health — GPS tier */}
          <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50/40 to-background dark:from-rose-950/20 dark:to-background p-6">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-bold text-foreground">Basic Health</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4"><p className="text-xs text-muted-foreground mb-4">Included with GPS + Health · £34.99/mo · Benenden Health</p></p>

            <div className="space-y-2.5 mb-5">
              {[
                { icon: <Stethoscope className="h-4 w-4" />, label: "24/7 GP — phone & video" },
                { icon: <Brain className="h-4 w-4" />, label: "24/7 Mental Health Helpline" },
                { icon: <Activity className="h-4 w-4" />, label: "Physiotherapy — up to 6 sessions" },
                { icon: <Search className="h-4 w-4" />, label: "Medical diagnostics — up to £2,500" },
                { icon: <Scissors className="h-4 w-4" />, label: "Private surgical treatment" },
                { icon: <MessageCircle className="h-4 w-4" />, label: "Cancer advice & support team" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setHealthModalTier("basic"); setHealthModalOpen(true); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <Info className="h-3.5 w-3.5" /> View full cover details
            </button>
          </div>

          {/* Enhanced Health — Dashcam tier */}
          <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/40 to-background dark:from-amber-950/20 dark:to-background p-6 relative">
            <Badge className="absolute -top-2.5 right-4 bg-amber-500 text-white border-amber-500 text-[10px]">
              <Sparkles className="h-3 w-3 mr-1" /> Most Comprehensive
            </Badge>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-bold text-foreground">Enhanced Health + Cancer Care</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Included with Dashcam + Health · £54.99/mo</p>

            <div className="space-y-2.5 mb-5">
              {[
                { icon: <Stethoscope className="h-4 w-4" />, label: "Everything in Basic, plus…" },
                { icon: <Building2 className="h-4 w-4" />, label: "Private hospital treatment — paid in full" },
                { icon: <Heart className="h-4 w-4" />, label: "Cancer care — chemo & radiotherapy" },
                { icon: <Brain className="h-4 w-4" />, label: "Mental health — 8 counselling sessions" },
                { icon: <Activity className="h-4 w-4" />, label: "10 therapy sessions (physio, chiro, osteo)" },
                { icon: <Pill className="h-4 w-4" />, label: "CT, MRI & PET scans — paid in full" },
                { icon: <Users className="h-4 w-4" />, label: "Family cover option" },
                
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setHealthModalTier("enhanced"); setHealthModalOpen(true); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Info className="h-3.5 w-3.5" /> View full cover details
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => navigate("/instructor-app/signup")}
          >
            <Heart className="h-4 w-4 mr-2" />
            Get Healthcare with Your Plan
          </Button>
          <Link
            to="/health-benefits"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Compare health tiers in detail <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">Underwritten by AXA Health · No waiting period · Cancel anytime</p>
      </div>

      <EnhancedHealthModal open={healthModalOpen} onClose={() => setHealthModalOpen(false)} tier={healthModalTier} />

      {/* Competitor Comparison — now below healthcare */}
      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">
            <Zap className="h-3 w-3 mr-1" /> Why Switch?
          </Badge>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">How We Compare to Other Diary Apps</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
            4 simple plans. GPS, dashcams, healthcare & AI included — starting from FREE.
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
                <div className="text-[10px] opacity-70">4 plans up to £54.99/mo</div>
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
              { feature: "Starting price", ed: "FREE (£0)", td: "£24/mo", mdt: "£19/mo", adi: "£16/mo", health: false },
              { feature: "All-in digital plan", ed: "£7.99/mo", td: "£24/mo", mdt: "£19/mo", adi: "£16/mo", health: false },
              { feature: "Diary & scheduling", ed: true, td: true, mdt: true, adi: true, health: false },
              { feature: "Professional website", ed: true, td: true, mdt: true, adi: true, health: false },
              { feature: "Pupil & parent apps", ed: "Both included", td: "Pupil only", mdt: "Limited", adi: "None", health: false },
              { feature: "AI lesson plans & automation", ed: true, td: false, mdt: false, adi: false, health: false },
              { feature: "GPS route tracking", ed: "From £34.99/mo", td: false, mdt: false, adi: false, health: false },
              { feature: "Forward & cabin dashcam", ed: "From £54.99/mo", td: false, mdt: false, adi: false, health: false },
              { feature: "HMRC MTD tax filing", ed: "Free", td: false, mdt: false, adi: false, health: false },
              { feature: "Basic Health cover", ed: "Incl. with GPS", td: false, mdt: false, adi: false, health: true },
              { feature: "Enhanced Health + Cancer Care", ed: "Incl. with Dashcam", td: false, mdt: false, adi: false, health: true },
              { feature: "No tie-in contract", ed: true, td: true, mdt: true, adi: true, health: false },
            ].map((row, ri) => (
              <div key={row.feature} className={cn(
                "grid grid-cols-5 border-t border-border/10",
                row.health ? "bg-rose-50/60 dark:bg-rose-950/20" : ri % 2 !== 0 && "bg-muted/5"
              )}>
                <div className="p-3 pl-4 text-xs font-medium text-foreground flex items-center">
                  {row.health && <Heart className="h-3 w-3 text-rose-500 mr-1.5 shrink-0" />}
                  {row.feature}
                </div>
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
            { feature: "Starting price", ed: "FREE (£0)", others: "From £16–£24/mo", health: false },
            { feature: "All-in digital plan", ed: "Just £7.99/mo", others: "£16–£24/mo", health: false },
            { feature: "AI lesson plans & automation", ed: "Included", others: "Not available", health: false },
            { feature: "GPS route tracking", ed: "£34.99/mo", others: "Not available", health: false },
            { feature: "Forward & cabin dashcam", ed: "£54.99/mo", others: "Not available", health: false },
            { feature: "HMRC MTD tax filing", ed: "Free", others: "Not available", health: false },
            { feature: "Pupil & parent apps", ed: "Both included", others: "Limited or none", health: false },
            { feature: "Basic Health cover", ed: "Incl. with GPS", others: "Not available", health: true },
            { feature: "Enhanced Health + Cancer Care", ed: "Incl. with Dashcam", others: "Not available", health: true },
          ].map((row) => (
            <div key={row.feature} className={cn(
              "rounded-xl border bg-card p-4",
              row.health && "border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/15"
            )}>
              <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                {row.health && <Heart className="h-3 w-3 text-rose-500" />}
                {row.feature}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", row.health ? "bg-rose-500" : "bg-primary")} />
                  <span className={cn("text-xs font-semibold", row.health ? "text-rose-700 dark:text-rose-300" : "text-primary")}>{row.ed}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{row.others}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
