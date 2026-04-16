import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowLeft, Mail, Crown, Star, Zap, Users, Building2,
  Sparkles, LogOut, Gauge, CreditCard, ChevronDown, Camera,
  Globe, Calendar, Smartphone, Wrench, Heart, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  description: string | null;
  features: string[];
  is_popular: boolean | null;
  max_pupils: number | null;
  sms_credits_monthly: number | null;
  cta_text: string | null;
  show_contact_us: boolean;
  commission_rate_percent: number | null;
  commission_fixed_pence: number | null;
  payout_speed: string | null;
  is_per_seat: boolean;
  base_price_monthly: number;
  per_seat_price_monthly: number;
  min_seats: number;
}

interface CategoryFeatures {
  [category: string]: {
    [planSlug: string]: string[];
  };
}

const tierIcons: Record<string, typeof Star> = {
  free: Star,
  pro: Star,
  max: Zap,
  multi: Users,
  enterprise: Building2,
};

const tierHeaderBg: Record<string, string> = {
  free: "bg-gradient-to-br from-slate-600 to-slate-800",
  pro: "bg-gradient-to-br from-emerald-600 to-teal-800",
  max: "bg-gradient-to-br from-violet-600 to-purple-800",
  multi: "bg-gradient-to-br from-[#0075c9] to-cyan-800",
  enterprise: "bg-gradient-to-br from-amber-600 to-orange-800",
};

const categoryConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  "Telematics & GPS": { icon: Gauge, color: "text-violet-500", label: "Telematics" },
  "Payments & Finance": { icon: CreditCard, color: "text-blue-500", label: "Payments" },
  "Dashcam": { icon: Camera, color: "text-orange-500", label: "Dashcam" },
  "Website & Marketing": { icon: Globe, color: "text-teal-500", label: "Website" },
  "Diary & Scheduling": { icon: Calendar, color: "text-emerald-500", label: "Diary" },
  "Pupil Management": { icon: Users, color: "text-indigo-500", label: "Pupils" },
  "Apps & Portals": { icon: Smartphone, color: "text-pink-500", label: "Apps" },
  "Tools & Productivity": { icon: Wrench, color: "text-cyan-500", label: "Tools" },
  "Health & Wellbeing": { icon: Heart, color: "text-rose-500", label: "Wellbeing" },
  "Driving Schools": { icon: Building2, color: "text-amber-500", label: "Schools" },
};

// Collapsible feature section for a plan card
function FeatureSection({
  label,
  icon: Icon,
  color,
  features,
}: {
  label: string;
  icon: typeof Star;
  color: string;
  features: string[];
}) {
  const [open, setOpen] = useState(false);

  if (features.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full text-left pb-1.5 border-b border-border group"
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
        <span className="text-[11px] font-semibold text-foreground flex-1">{label}</span>
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
          {features.length}
        </Badge>
        <ChevronDown className={cn(
          "h-3 w-3 text-muted-foreground transition-transform",
          open && "rotate-180"
        )} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-1 pt-1.5"
          >
            {features.map((feature, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <Check className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", color)} />
                <span>{feature}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InstructorPlans() {
  const { subscription, signOut, refreshInstructor, instructor } = useInstructorAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categoryFeatures, setCategoryFeatures] = useState<CategoryFeatures>({});
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const currentPlanSlug = subscription?.plan_slug || "free";

  // Handle return from GoCardless DD setup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dd_complete") === "true") {
      toast.success("Direct Debit set up successfully! Your plan will activate shortly.");
      refreshInstructor();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refreshInstructor]);

  useEffect(() => {
    const fetchData = async () => {
      const [plansRes, assignmentsRes] = await Promise.all([
        supabase
          .from("subscription_plans")
          .select("id, name, slug, price_monthly, price_yearly, description, features, is_popular, max_pupils, sms_credits_monthly, cta_text, show_contact_us, commission_rate_percent, commission_fixed_pence, payout_speed, is_per_seat, base_price_monthly, per_seat_price_monthly, min_seats")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("feature_plan_assignments")
          .select("plan_slug, feature_showcase_items!inner(title, category, display_order)")
          .order("plan_slug"),
      ]);

      if (!plansRes.error && plansRes.data) {
        setPlans(plansRes.data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
          show_contact_us: (p as any).show_contact_us || false,
          commission_rate_percent: (p as any).commission_rate_percent ?? null,
          commission_fixed_pence: (p as any).commission_fixed_pence ?? null,
          payout_speed: (p as any).payout_speed ?? null,
          is_per_seat: (p as any).is_per_seat || false,
          base_price_monthly: (p as any).base_price_monthly ?? 0,
          per_seat_price_monthly: (p as any).per_seat_price_monthly ?? 0,
          min_seats: (p as any).min_seats ?? 1,
        })));
      }

      if (!assignmentsRes.error && assignmentsRes.data) {
        const catMap: CategoryFeatures = {};
        assignmentsRes.data.forEach((row: any) => {
          const slug = row.plan_slug;
          const category = row.feature_showcase_items?.category;
          const title = row.feature_showcase_items?.title;
          if (category && title) {
            if (!catMap[category]) catMap[category] = {};
            if (!catMap[category][slug]) catMap[category][slug] = [];
            if (!catMap[category][slug].includes(title)) {
              catMap[category][slug].push(title);
            }
          }
        });
        setCategoryFeatures(catMap);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChangePlan = async (plan: Plan) => {
    if (!instructor?.id || !subscription?.id) return;

    // Downgrade to free: instant switch
    if (plan.price_monthly === 0) {
      setSwitching(plan.slug);
      try {
        const { error } = await supabase
          .from("instructor_subscriptions")
          .update({ plan_id: plan.id, status: "active" })
          .eq("id", subscription.id);

        if (error) throw error;

        await refreshInstructor();
        toast.success(`Switched to ${plan.name} plan!`);
      } catch (err) {
        console.error("Error switching plan:", err);
        toast.error("Failed to switch plan. Please try again.");
      } finally {
        setSwitching(null);
      }
      return;
    }

    // Contact us plans
    if (plan.show_contact_us) {
      toast.success(`To upgrade to ${plan.name}, please contact us`, {
        description: "Email hello@drive365.co.uk or call us to upgrade your plan.",
        duration: 5000,
      });
      return;
    }

    // Paid plan upgrade: redirect to GoCardless DD setup
    setSwitching(plan.slug);
    try {
      const seatCount = plan.is_per_seat ? plan.min_seats : 1;

      // First update the plan_id so the billing request uses the correct plan
      await supabase
        .from("instructor_subscriptions")
        .update({ plan_id: plan.id, seat_count: seatCount })
        .eq("id", subscription.id);

      const redirectUrl = `${window.location.origin}/instructor/plans?dd_complete=true`;

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "gocardless-create-billing-request",
        {
          body: {
            instructor_id: instructor.id,
            plan_id: plan.id,
            redirect_url: redirectUrl,
            seat_count: seatCount,
          },
        }
      );

      if (fnError || !result?.success) {
        throw new Error(result?.error || fnError?.message || "Failed to set up Direct Debit");
      }

      if (result.authorisation_url) {
        window.location.href = result.authorisation_url;
      } else {
        throw new Error("No authorisation URL returned");
      }
    } catch (err) {
      console.error("Error upgrading plan:", err);
      toast.error("Failed to set up Direct Debit. Please try again.");
      setSwitching(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  // Categories to show as expandable sections
  const sectionCategories = Object.keys(categoryConfig);

  return (
    <InstructorPortalLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/instructor")}
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Log Out
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-6 w-6 text-emerald-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Choose Your Plan
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Compare features and pick the plan that fits your driving school business.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Plan Cards Grid */}
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-12">
              {plans.map((plan, index) => {
                const isCurrent = plan.slug === currentPlanSlug;
                const isPopular = plan.is_popular && !isCurrent;
                const TierIcon = tierIcons[plan.slug] || Star;
                const headerBg = tierHeaderBg[plan.slug] || tierHeaderBg.free;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className={cn(
                      "relative flex flex-col border bg-card overflow-hidden transition-all duration-300",
                      isCurrent && "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.15)]",
                      isPopular && "ring-2 ring-primary shadow-lg scale-[1.02]",
                      !isCurrent && !isPopular && "border-border hover:border-muted-foreground/30 hover:shadow-md"
                    )}
                  >
                    {/* Popular Ribbon */}
                    {isPopular && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 gap-1">
                          <Sparkles className="h-3 w-3" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrent && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5">
                          Current Plan
                        </Badge>
                      </div>
                    )}

                    {/* Gradient Header */}
                    <div className={cn("px-5 pt-5 pb-4", headerBg)}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                          <TierIcon className="h-4.5 w-4.5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1">
                        {plan.is_per_seat ? (
                          <>
                            <span className="text-2xl font-extrabold text-white">£{plan.base_price_monthly}</span>
                            <span className="text-sm text-white/70">/mo base</span>
                          </>
                        ) : plan.show_contact_us ? (
                          <span className="text-2xl font-extrabold text-white">Contact Us</span>
                        ) : plan.price_monthly === 0 ? (
                          <span className="text-3xl font-extrabold text-white">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl font-extrabold text-white">£{plan.price_monthly}</span>
                            <span className="text-sm text-white/70">/mo</span>
                          </>
                        )}
                      </div>

                      {plan.is_per_seat && (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-xs text-white/80 font-medium">
                            + £{plan.per_seat_price_monthly}/mo per instructor
                          </p>
                          <p className="text-[10px] text-white/50">
                            Min {plan.min_seats} seats · From £{(plan.base_price_monthly + plan.min_seats * plan.per_seat_price_monthly).toFixed(2)}/mo
                          </p>
                        </div>
                      )}

                      {!plan.is_per_seat && !plan.show_contact_us && plan.price_yearly && plan.price_monthly > 0 && (
                        <p className="text-xs text-white/60 mt-1">
                          or £{plan.price_yearly}/year (save £{(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)})
                        </p>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 px-5 py-4 flex flex-col">
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                      )}

                      {/* Key Metrics */}
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                        {plan.max_pupils !== null && (
                          <div className="flex-1 text-center">
                            <p className="text-lg font-bold text-foreground">
                              {plan.max_pupils === 999 ? "∞" : plan.max_pupils}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Pupils</p>
                          </div>
                        )}
                        {plan.sms_credits_monthly !== null && (
                          <div className="flex-1 text-center">
                            <p className="text-lg font-bold text-foreground">
                              {plan.sms_credits_monthly === 999 ? "∞" : plan.sms_credits_monthly}
                            </p>
                            <p className="text-[10px] text-muted-foreground">SMS/mo</p>
                          </div>
                        )}
                      </div>

                      {/* Commission / Payment Fees */}
                      {(plan.commission_rate_percent !== null || plan.commission_fixed_pence !== null) && (
                        <div className="mb-3 pb-3 border-b border-border">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-[11px] font-semibold text-foreground">Card Payment Fees</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {plan.commission_rate_percent === 0 && (plan.commission_fixed_pence === 0 || plan.commission_fixed_pence === null)
                              ? <span className="text-emerald-500 font-semibold">0% — No platform fees</span>
                              : (
                                <>
                                  {plan.commission_rate_percent != null && <span className="font-semibold text-foreground">{plan.commission_rate_percent}%</span>}
                                  {plan.commission_fixed_pence != null && plan.commission_fixed_pence > 0 && (
                                    <span className="font-semibold text-foreground"> + {plan.commission_fixed_pence}p</span>
                                  )}
                                  <span> per transaction</span>
                                </>
                              )
                            }
                          </p>
                        </div>
                      )}

                      {/* Payout Speed */}
                      {plan.payout_speed && (
                        <div className="mb-3 pb-3 border-b border-border">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-[11px] font-semibold text-foreground">Payout Speed</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {plan.payout_speed === 'Instant'
                              ? <span className="text-emerald-500 font-semibold">⚡ Instant</span>
                              : <span className="font-semibold text-foreground">{plan.payout_speed}</span>
                            }
                          </p>
                        </div>
                      )}

                      {/* Core Features */}
                      {plan.features.length > 0 && (
                        <ul className="space-y-1.5 mb-3">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Expandable Feature Sections */}
                      <div className="flex-1">
                        {sectionCategories.map((category) => {
                          const cfg = categoryConfig[category];
                          const features = categoryFeatures[category]?.[plan.slug] || [];
                          return (
                            <FeatureSection
                              key={category}
                              label={cfg.label}
                              icon={cfg.icon}
                              color={cfg.color}
                              features={features}
                            />
                          );
                        })}
                      </div>

                      {/* CTA */}
                      <div className="mt-auto pt-2">
                        {isCurrent ? (
                          <Button variant="outline" size="sm" className="w-full" disabled>
                            <Check className="h-4 w-4 mr-1.5" />
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
                            onClick={() => handleChangePlan(plan)}
                            disabled={switching === plan.slug}
                          >
                            {switching === plan.slug ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                            {plan.cta_text || "Contact to Upgrade"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center pb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted/50 border border-border text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Questions? Email{" "}
                <a href="mailto:hello@drive365.co.uk" className="text-primary font-medium hover:underline">
                  hello@drive365.co.uk
                </a>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
