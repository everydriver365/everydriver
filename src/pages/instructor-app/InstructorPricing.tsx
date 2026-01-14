import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "Smart diary",
      "Up to 5 pupils",
      "Basic pupil management",
      "Your own mini-website",
      "Mobile app access"
    ],
    cta: "Get Started Free",
    popular: false
  },
  {
    name: "Pro",
    slug: "pro",
    price: 29,
    description: "For established instructors",
    features: [
      "Everything in Free",
      "Up to 50 pupils",
      "Advanced pupil management",
      "Payment tracking & requests",
      "SMS notifications (100/mo)",
      "Telematics tracking",
      "Google Calendar sync",
      "Priority email support"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Business",
    slug: "business",
    price: 49,
    description: "For growing driving schools",
    features: [
      "Everything in Pro",
      "Unlimited pupils",
      "Expense tracking",
      "Custom branding",
      "SMS notifications (500/mo)",
      "Advanced analytics",
      "Priority phone support",
      "Dedicated account manager"
    ],
    cta: "Start Free Trial",
    popular: false
  }
];

export default function InstructorPricing() {
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
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative h-full ${
                    plan.popular 
                      ? "border-accent shadow-lg shadow-accent/10" 
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-accent-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-foreground">{plan.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                    <div className="pt-4">
                      <span className="text-4xl font-bold text-foreground">
                        £{plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      variant={plan.popular ? "accent" : "outline"}
                      className="w-full"
                      asChild
                    >
                      <Link to={`/instructor-app/signup?plan=${plan.slug}`}>
                        {plan.cta}
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
