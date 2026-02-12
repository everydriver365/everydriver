import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft, Mail, Crown, Star, Zap, Users, Building2, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanBadge } from "@/components/instructor/PlanBadge";
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
}

const tierIcons: Record<string, typeof Star> = {
  free: Star,
  pro: Star,
  max: Zap,
  multi: Users,
  enterprise: Building2,
};

const tierAccents: Record<string, string> = {
  free: "from-slate-500/20 to-slate-400/10 border-slate-300/40",
  pro: "from-emerald-500/20 to-teal-400/10 border-emerald-400/50",
  max: "from-violet-500/20 to-purple-400/10 border-violet-400/50",
  multi: "from-[#0075c9]/20 to-cyan-400/10 border-[#0075c9]/50",
  enterprise: "from-amber-500/20 to-orange-400/10 border-amber-400/50",
};

const tierHeaderBg: Record<string, string> = {
  free: "bg-gradient-to-br from-slate-600 to-slate-800",
  pro: "bg-gradient-to-br from-emerald-600 to-teal-800",
  max: "bg-gradient-to-br from-violet-600 to-purple-800",
  multi: "bg-gradient-to-br from-[#0075c9] to-cyan-800",
  enterprise: "bg-gradient-to-br from-amber-600 to-orange-800",
};

export default function InstructorPlans() {
  const { subscription, signOut } = useInstructorAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const currentPlanSlug = subscription?.plan_slug || "free";

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name, slug, price_monthly, price_yearly, description, features, is_popular, max_pupils, sms_credits_monthly, cta_text")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setPlans(data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
        })));
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleUpgrade = (plan: Plan) => {
    toast.success(`To upgrade to ${plan.name}, please contact us`, {
      description: "Email hello@drive365.co.uk or call us to upgrade your plan.",
      duration: 5000,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

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
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                        {plan.price_monthly === 0 ? (
                          <span className="text-3xl font-extrabold text-white">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl font-extrabold text-white">£{plan.price_monthly}</span>
                            <span className="text-sm text-white/70">/mo</span>
                          </>
                        )}
                      </div>

                      {plan.price_yearly && plan.price_monthly > 0 && (
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

                      {/* Features */}
                      {plan.features.length > 0 && (
                        <ul className="space-y-1.5 mb-4 flex-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

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
                            onClick={() => handleUpgrade(plan)}
                          >
                            <Mail className="h-3.5 w-3.5" />
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
