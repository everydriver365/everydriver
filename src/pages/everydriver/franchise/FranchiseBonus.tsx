import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, ArrowLeft, Check, Calculator, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";

export default function FranchiseBonus() {
  const [passesPerYear, setPassesPerYear] = useState([20]);
  const bonusAmount = passesPerYear[0] * 50;

  return (
    <MainLayout>
      <SEOHead
        title="£50 Per Intensive Course Bonus | Drive365 Franchise"
        description="Earn £50 for every intensive course your pupil completes. Use the calculator to see how much extra you could earn per year with Drive365."
      />

      <section className="py-12 md:py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl space-y-6 text-center">
          <Button variant="ghost" size="sm" className="text-primary-foreground/60 hover:text-primary-foreground" asChild>
            <Link to="/drive365/franchise"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Franchise</Link>
          </Button>
          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-semibold px-3 py-1">
            <Gift className="w-3 h-3 mr-1" /> BONUS SCHEME
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            £50 Per Intensive.<br /><span className="text-accent">Every Time.</span>
          </h1>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto text-lg">
            No other franchise pays you a bonus on top of your lesson income. Every completed intensive course earns you £50 — automatically.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl space-y-12">
          {/* How it works */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Pupil Books Intensive", desc: "A pupil books an intensive or semi-intensive driving course through your booking system." },
                { icon: Check, title: "Course Completed", desc: "The pupil completes the course — whether they pass or not, you still get the bonus." },
                { icon: TrendingUp, title: "£50 Paid Automatically", desc: "Your £50 bonus is tracked and paid automatically. No forms, no chasing, no delays." },
              ].map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 text-center space-y-3"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Calculator */}
          <motion.div
            className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-10 space-y-8"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-center space-y-2">
              <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-semibold px-3 py-1">
                <Calculator className="w-3 h-3 mr-1" /> BONUS CALCULATOR
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black">See Your Earnings</h2>
            </div>

            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-primary-foreground/50 uppercase tracking-wider">
                  Intensive courses per year
                </p>
                <p className="text-6xl md:text-7xl font-black tabular-nums text-accent">
                  {passesPerYear[0]}
                </p>
              </div>

              <div className="px-2">
                <Slider
                  value={passesPerYear}
                  onValueChange={setPassesPerYear}
                  min={5}
                  max={60}
                  step={1}
                  className="w-full [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:bg-accent [&_[role=slider]]:border-2 [&_[role=slider]]:border-accent [&_[role=slider]]:shadow-[0_0_20px_hsl(var(--accent)/0.4)] [&_span[role=slider]]:ring-offset-primary"
                />
                <div className="flex items-center justify-between text-xs text-primary-foreground/40 mt-2 font-medium">
                  <span>5 courses</span>
                  <span>60 courses</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-primary-foreground/5 rounded-2xl p-5 border border-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/40 uppercase tracking-wider font-medium">Annual bonus</p>
                  <p className="text-3xl md:text-4xl font-black text-accent mt-1">
                    £{bonusAmount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-primary-foreground/5 rounded-2xl p-5 border border-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/40 uppercase tracking-wider font-medium">Monthly extra</p>
                  <p className="text-3xl md:text-4xl font-black text-primary-foreground mt-1">
                    £{Math.round(bonusAmount / 12)}
                  </p>
                  <p className="text-xs text-primary-foreground/40 mt-1">per month</p>
                </div>
              </div>

              <p className="text-sm text-primary-foreground/50 pt-2 text-center">
                That's <span className="text-accent font-semibold">£{bonusAmount.toLocaleString()} extra per year</span> on top of your lesson income.
              </p>
            </div>
          </motion.div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Common Questions</h2>
            <div className="space-y-3">
              {[
                { q: "Does the pupil have to pass their test?", a: "No — the bonus is paid when the intensive course is completed, regardless of the test outcome." },
                { q: "How is it paid?", a: "Bonuses are tracked automatically through the platform and paid directly to you." },
                { q: "Is there a cap?", a: "No cap. The more intensive courses you deliver, the more you earn." },
                { q: "Do semi-intensive courses count?", a: "Yes — any intensive or semi-intensive course that's completed qualifies for the £50 bonus." },
              ].map((faq) => (
                <div key={faq.q} className="bg-card border border-border rounded-xl p-5 space-y-2">
                  <h3 className="font-semibold text-sm">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" asChild>
              <Link to="/drive365/franchise#enquiry-form">Apply Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
