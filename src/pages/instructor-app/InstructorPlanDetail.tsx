import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  description: string | null;
  features: string[];
  is_popular: boolean;
  cta_text: string | null;
  max_pupils: number | null;
  sms_credits_monthly: number | null;
}

interface FeatureDescription {
  feature_key: string;
  display_name: string;
  short_description: string | null;
  long_description: string | null;
  icon_name: string | null;
}

export default function InstructorPlanDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [featureDescriptions, setFeatureDescriptions] = useState<Record<string, FeatureDescription>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [planRes, featRes] = await Promise.all([
        supabase
          .from("subscription_plans")
          .select("*")
          .eq("slug", slug!)
          .eq("is_active", true)
          .single(),
        supabase
          .from("plan_feature_descriptions")
          .select("feature_key, display_name, short_description, long_description, icon_name")
          .order("display_order", { ascending: true }),
      ]);

      if (!planRes.error && planRes.data) {
        setPlan({
          ...planRes.data,
          features: (planRes.data.features as string[] | null) || [],
        });
      }

      if (!featRes.error && featRes.data) {
        const map: Record<string, FeatureDescription> = {};
        featRes.data.forEach((f) => {
          map[f.feature_key] = f as FeatureDescription;
        });
        setFeatureDescriptions(map);
      }

      setLoading(false);
    };
    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <InstructorSaaSLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </InstructorSaaSLayout>
    );
  }

  if (!plan) {
    return (
      <InstructorSaaSLayout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Plan not found</h1>
          <Button asChild variant="outline">
            <Link to="/instructor-app/pricing">Back to Pricing</Link>
          </Button>
        </div>
      </InstructorSaaSLayout>
    );
  }

  return (
    <InstructorSaaSLayout>
      <section className="py-16 bg-background">
        <div className="container max-w-4xl">
          {/* Back link */}
          <Link
            to="/instructor-app/pricing"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Link>

          {/* Plan Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {plan.name}
              </h1>
              {plan.is_popular && (
                <Badge className="bg-emerald-500 text-white">Most Popular</Badge>
              )}
            </div>
            {plan.description && (
              <p className="text-lg text-muted-foreground">{plan.description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-2">
              {plan.price_monthly === 0 ? (
                <span className="text-5xl font-extrabold text-foreground">Free</span>
              ) : (
                <>
                  <span className="text-5xl font-extrabold text-foreground">
                    £{plan.price_monthly}
                  </span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </>
              )}
            </div>
            {plan.price_yearly && plan.price_monthly > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                or £{plan.price_yearly}/year — save £
                {(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)}
              </p>
            )}
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4 mb-10"
          >
            {plan.max_pupils !== null && (
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <Users className="h-6 w-6 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {plan.max_pupils === 999 ? "Unlimited" : plan.max_pupils}
                    </p>
                    <p className="text-sm text-muted-foreground">Pupils</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {plan.sms_credits_monthly !== null && (
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <MessageSquare className="h-6 w-6 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {plan.sms_credits_monthly === 999
                        ? "Unlimited"
                        : plan.sms_credits_monthly}
                    </p>
                    <p className="text-sm text-muted-foreground">SMS / month</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              What's Included
            </h2>
            <div className="space-y-4">
              {plan.features.map((featureKey, i) => {
                const desc = featureDescriptions[featureKey];
                return (
                  <Card key={featureKey}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-foreground">
                            {desc?.display_name || featureKey}
                          </h3>
                          {desc?.long_description ? (
                            <p className="text-sm text-muted-foreground mt-1">
                              {desc.long_description}
                            </p>
                          ) : desc?.short_description ? (
                            <p className="text-sm text-muted-foreground mt-1">
                              {desc.short_description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-center"
          >
            <Button
              size="lg"
              className="bg-emerald-500 text-white hover:bg-emerald-600 px-10"
              asChild
            >
              <Link to={`/instructor-app/signup?plan=${plan.slug}`}>
                Get Started with {plan.name}
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
