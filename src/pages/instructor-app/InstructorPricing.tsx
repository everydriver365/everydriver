import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  description: string | null;
  features: string[] | null;
  is_popular: boolean;
  cta_text: string | null;
  max_pupils: number | null;
}

export default function InstructorPricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        const typedPlans = data.map(plan => ({
          ...plan,
          features: (plan.features as string[] | null) || []
        }));
        setPlans(typedPlans);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <InstructorSaaSLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </InstructorSaaSLayout>
    );
  }

  return (
    <InstructorSaaSLayout>
      <section className="py-20 bg-background">
        <div className="container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative h-full ${
                    plan.is_popular 
                      ? "border-emerald-500 shadow-lg shadow-emerald-500/10" 
                      : "border-border"
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-foreground">{plan.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                    <div className="pt-4">
                      <span className="text-4xl font-bold text-foreground">
                        £{plan.price_monthly}
                      </span>
                      {plan.price_monthly > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {(plan.features || []).map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={plan.is_popular ? "w-full bg-emerald-500 text-white hover:bg-emerald-600" : "w-full"}
                      variant={plan.is_popular ? undefined : "outline"}
                      asChild
                    >
                      <Link to={`/instructor-app/plan/${plan.slug}`}>
                        Continue
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* FAQ or additional info */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Questions? <Link to="/contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
