import { useState } from "react";
import { ArrowRight, Check, X, Upload, Users, Zap, Shield, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const COMPETITORS = [
  { name: "MyDriveTime", monthly: 29.99 },
  { name: "Total Drive", monthly: 39.99 },
  { name: "ADI Book", monthly: 24.99 },
  { name: "iCab", monthly: 19.99 },
];

const SWITCH_REASONS = [
  { icon: Upload, title: "Import in 5 Minutes", desc: "Upload a CSV of your pupils and you're live. No data left behind." },
  { icon: Shield, title: "Free HMRC MTD Filing", desc: "Quarterly MTD filing included free. Others charge £12+/mo extra." },
  { icon: Zap, title: "GPS + Dashcam Built In", desc: "Real-time tracking, trip replay, and dashcam integration at no extra cost on GPS plans." },
  { icon: Users, title: "Free Forever Tier", desc: "Diary, pupils, messaging — all free. No trial, no expiry, no credit card." },
];

const FEATURE_COMPARISON = [
  { feature: "Core diary & scheduling", everydriver: true, others: true },
  { feature: "Pupil management", everydriver: true, others: true },
  { feature: "Free plan available", everydriver: true, others: false },
  { feature: "HMRC MTD filing (free)", everydriver: true, others: false },
  { feature: "GPS tracking", everydriver: true, others: false },
  { feature: "Dashcam integration", everydriver: true, others: false },
  { feature: "CSV data import", everydriver: true, others: false },
  { feature: "WhatsApp notifications", everydriver: true, others: false },
  { feature: "Mini website builder", everydriver: true, others: "Extra" },
  { feature: "Custom domain", everydriver: "£1.99/mo", others: "£5+/mo" },
  { feature: "Instructor referral rewards", everydriver: true, others: false },
  { feature: "PDI free programme", everydriver: true, others: false },
];

export default function SwitchToEveryDriver() {
  const navigate = useNavigate();
  const [currentCost, setCurrentCost] = useState<string>("");
  const everyDriverCost = 0; // Free plan
  const savings = currentCost ? (parseFloat(currentCost) * 12).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-accent text-accent-foreground">Switch in 5 minutes</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Switch to EveryDriver.<br />Save money. Get more.
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Import your pupils, keep your data, and unlock features your current app charges extra for — 
            or start completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="accent" onClick={() => navigate("/instructor/login")}>
              Start Free Today <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
            <Button size="xl" variant="heroOutline" onClick={() => navigate("/compare")}>
              Compare Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Why Switch */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-10">Why instructors are switching</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {SWITCH_REASONS.map(r => (
            <Card key={r.title} className="border-border">
              <CardContent className="p-6 flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <r.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Savings Calculator */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Calculator className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-2xl">How much could you save?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">What do you currently pay per month?</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-foreground">£</span>
                  <Input
                    type="number"
                    placeholder="e.g. 29.99"
                    value={currentCost}
                    onChange={e => setCurrentCost(e.target.value)}
                    className="text-lg"
                  />
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {COMPETITORS.map(c => (
                  <Button key={c.name} variant="outline" size="sm" onClick={() => setCurrentCost(String(c.monthly))}>
                    {c.name} (£{c.monthly})
                  </Button>
                ))}
              </div>
              {savings && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">You could save up to</p>
                  <p className="text-4xl font-extrabold text-emerald-600">£{savings}</p>
                  <p className="text-sm text-muted-foreground mt-1">per year by switching to EveryDriver Free</p>
                  <Button className="mt-4" onClick={() => navigate("/instructor/login")}>
                    Start Free Now <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">Feature Comparison</h2>
        <div className="border rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 bg-muted/50 p-3 text-sm font-semibold text-foreground">
            <span>Feature</span>
            <span className="text-center">EveryDriver</span>
            <span className="text-center">Others</span>
          </div>
          {FEATURE_COMPARISON.map((f, i) => (
            <div key={i} className="grid grid-cols-3 p-3 border-t items-center text-sm">
              <span className="text-foreground">{f.feature}</span>
              <span className="text-center">
                {f.everydriver === true ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> :
                 f.everydriver === false ? <X className="h-5 w-5 text-red-400 mx-auto" /> :
                 <span className="text-foreground font-medium">{f.everydriver}</span>}
              </span>
              <span className="text-center">
                {f.others === true ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> :
                 f.others === false ? <X className="h-5 w-5 text-red-400 mx-auto" /> :
                 <span className="text-muted-foreground">{f.others}</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* No-Brainer Formula */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              The Math Speaks for Itself
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">The No-Brainer Formula</h2>
          </div>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                {[
                  { text: "Free diary & scheduling", value: "£0" },
                  { text: "Auto mileage tracking = tax savings", value: "£2,250/yr" },
                  { text: "HMRC MTD filing included", value: "Others: £144/yr" },
                  { text: "Pupil app with self-service booking", value: "Included" },
                  { text: "GPS tracking & dashcam", value: "From £17/mo" },
                  { text: "No lock-in, cancel anytime", value: "Always" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span className="text-foreground font-medium">{item.text}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-semibold shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-lg text-foreground/80 italic mb-4">
                  "Save more in tax deductions than the app costs. <strong className="text-foreground">It literally pays for itself.</strong>"
                </p>
                <Button size="xl" variant="accent" onClick={() => navigate("/instructor/login")}>
                  Start Free Today <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to switch?</h2>
        <p className="text-lg opacity-90 mb-6 max-w-lg mx-auto">
          Sign up free, import your pupils, and be live in under 5 minutes.
        </p>
        <Button size="xl" variant="accent" onClick={() => navigate("/instructor/login")}>
          Get Started Free <ArrowRight className="h-5 w-5 ml-1" />
        </Button>
      </section>
    </div>
  );
}
