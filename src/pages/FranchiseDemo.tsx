import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Eye, Brain, Phone, Stethoscope, Calendar, Car, MapPin, FileText, Smartphone, Globe, Check, X, ChevronRight, Star, ArrowRight, Award, TrendingUp, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import heroImg from "@/assets/franchise-hero-drive365.png";

const healthcareBenefits = [
  { icon: Heart, title: "Dental Cashback", value: "£150/yr", desc: "Routine check-ups, fillings, crowns" },
  { icon: Eye, title: "Optical Cover", value: "£100/yr", desc: "Eye tests, glasses, contact lenses" },
  { icon: Stethoscope, title: "Physio Sessions", value: "Included", desc: "Free sessions for back & neck pain" },
  { icon: Phone, title: "24/7 GP Access", value: "Unlimited", desc: "Video or phone GP consultations" },
  { icon: Brain, title: "Mental Health", value: "Included", desc: "Counselling and CBT sessions" },
  { icon: Shield, title: "Employee Assistance", value: "24/7", desc: "Legal, financial & personal support" },
];

const tiers = [
  { name: "Starter", price: "£50", features: ["Full platform access", "Free healthcare", "£50 intensive bonus", "1-page mini website", "Pupil app access"], excluded: ["GPS tracking", "Dashcam system", "Custom domain"] },
  { name: "Pro", price: "£50", popular: true, features: ["Full platform access", "Free healthcare", "£50 intensive bonus", "Multi-page website", "Pupil app access", "GPS tracking"], excluded: ["Dashcam system", "Custom domain"] },
  { name: "Elite", price: "£50", features: ["Full platform access", "Free healthcare", "£50 intensive bonus", "Multi-page website", "Pupil app access", "GPS tracking", "Dashcam system", "Custom domain website"], excluded: [] },
];

const techFeatures = [
  { icon: Calendar, label: "Smart Diary" },
  { icon: MapPin, label: "GPS Tracking" },
  { icon: Car, label: "Dashcam" },
  { icon: FileText, label: "MTD Tax Filing" },
  { icon: Smartphone, label: "Pupil App" },
  { icon: Globe, label: "Your Own Website" },
];

const competitors = [
  { name: "RED Driving School", weekly: 250 },
  { name: "AA Driving School", weekly: 200 },
  { name: "Bill Plant", weekly: 175 },
  { name: "Drive365", weekly: 50, highlight: true },
];

// ═══════════════════════════════════════════════════════
// DESIGN D — "Homepage Match" (Matches Drive365 homepage exactly)
// Uses primary bg hero, bold uppercase, card grid, accent CTAs
// ═══════════════════════════════════════════════════════
function DesignD() {
  const [passes, setPasses] = useState([20]);
  const bonus = passes[0] * 50;
  return (
    <div className="bg-background text-foreground">
      {/* Hero - matches Drive365 homepage style */}
      <section className="bg-primary text-primary-foreground py-16 lg:py-24 border-b border-border">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                <Badge className="bg-accent text-accent-foreground text-sm px-4 py-1.5">
                  Now Recruiting Nationwide
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[0.95]">
                  JOIN THE<br /><span className="text-accent">DRIVE365</span><br />FRANCHISE
                </h1>
                <p className="text-lg text-primary-foreground/70 max-w-md">
                  Free private healthcare. £50 bonus for every intensive course completed. The best tech in the business. Just £50/pw.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg text-base font-semibold">
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  View Packages
                </Button>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <span className="text-sm text-primary-foreground/60">Trusted by 500+ instructors</span>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
              <img src={heroImg} alt="Drive365 instructor" className="w-full rounded-2xl shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-card border-b border-border">
        <div className="container max-w-6xl py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: "£50/pw", l: "All-inclusive fee", icon: Zap },
              { v: "£50", l: "Per intensive bonus", icon: Gift },
              { v: "Free", l: "Private healthcare", icon: Heart },
              { v: "Zero", l: "Car tie-in", icon: Car },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Healthcare */}
      <section className="bg-background py-16 md:py-24">
        <div className="container max-w-6xl space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="text-sm">Free. Included. No Catch.</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Private Healthcare, On Us</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every Drive365 franchisee gets comprehensive private healthcare. No other franchise offers this.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {healthcareBenefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-xl p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-accent-foreground bg-accent/80 px-3 py-1 rounded-full">{b.value}</span>
                </div>
                <h3 className="font-semibold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus Calculator */}
      <section className="bg-muted/50 py-16 md:py-24 border-y border-border">
        <div className="container max-w-3xl space-y-8 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">£50 Per Intensive Course. Every Time.</h2>
            <p className="text-muted-foreground">
              Every pupil who completes an intensive course earns you a £50 bonus.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-sm">
            <label className="text-sm font-medium text-muted-foreground">
              How many intensive courses do your pupils complete per year?
            </label>
            <Slider value={passes} onValueChange={setPasses} min={5} max={60} step={1} className="w-full" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>5 courses</span>
              <span className="text-lg font-bold text-foreground">{passes[0]} courses</span>
              <span>60 courses</span>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Your annual bonus income</p>
              <p className="text-5xl font-bold text-primary mt-1">£{bonus.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-2">
                That's £{Math.round(bonus / 12)}/month extra in your pocket
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-background py-16 md:py-24">
        <div className="container max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Choose Your Package</h2>
            <p className="text-muted-foreground">All tiers include healthcare and the £50 per intensive course bonus</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-card border rounded-2xl p-6 space-y-5 relative ${
                  t.popular ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border"
                }`}
              >
                {t.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{t.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="text-muted-foreground">/pw</span>
                </div>
                <ul className="space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                  {t.excluded.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/60">
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={t.popular ? "default" : "outline"}>
                  Get Started <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="bg-muted/50 py-16 md:py-24 border-y border-border">
        <div className="container max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Save Thousands Per Year</h2>
            <p className="text-muted-foreground">See how Drive365 compares</p>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {competitors.map((c, i) => (
              <div key={c.name} className={`flex items-center justify-between px-6 py-4 ${i < competitors.length - 1 ? "border-b border-border" : ""} ${c.highlight ? "bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  {c.highlight && <Badge className="bg-primary text-primary-foreground text-xs">You</Badge>}
                  <span className={`font-medium ${c.highlight ? "text-primary" : ""}`}>{c.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${c.highlight ? "text-primary" : ""}`}>£{c.weekly}/wk</span>
                  <p className="text-xs text-muted-foreground">£{(c.weekly * 52).toLocaleString()}/yr</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="bg-background py-16 md:py-24">
        <div className="container max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Tech That No Other Franchise Offers</h2>
            <p className="text-muted-foreground">Your diary, payments, website, GPS, dashcam, tax filing — all in one platform.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techFeatures.map((f) => (
              <div key={f.label} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3 text-center hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Start Earning More. Stress Less.</h2>
          <p className="text-primary-foreground/70 text-lg">
            Free healthcare. £50 per intensive course. The best tech. Just £50/pw. No car tie-in.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 text-base font-semibold">
            Apply Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DESIGN E — "Split Hero" (image left, content right, softer cards)
// Same Drive365 color tokens but different layout
// ═══════════════════════════════════════════════════════
function DesignE() {
  const [passes, setPasses] = useState([20]);
  const bonus = passes[0] * 50;
  return (
    <div className="bg-background text-foreground">
      {/* Hero - image left, text right */}
      <section className="bg-primary text-primary-foreground border-b border-border">
        <div className="grid lg:grid-cols-2">
          <div className="relative h-[400px] lg:h-auto">
            <img src={heroImg} alt="Drive365 instructor" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="px-8 md:px-16 py-16 lg:py-24 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge className="bg-accent text-accent-foreground text-sm px-4 py-1.5 mb-4">
                Now Recruiting
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
                THE FRANCHISE<br />
                THAT PAYS<br />
                <span className="text-accent">YOU BACK</span>
              </h1>
              <p className="text-base text-primary-foreground/70 mt-4 max-w-md leading-relaxed">
                Free private healthcare. £50 for every intensive course completed. The UK's best instructor tech. Just £50/pw.
              </p>
            </motion.div>
            <div className="flex gap-3">
              <Button size="lg" className="rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { v: "£50/pw", l: "All-inclusive" },
                { v: "Free", l: "Healthcare" },
                { v: "£50", l: "Per intensive" },
                { v: "Zero", l: "Car tie-in" },
              ].map((s) => (
                <div key={s.l} className="bg-primary-foreground/5 rounded-xl p-3 text-center border border-primary-foreground/10">
                  <p className="text-xl font-bold text-accent">{s.v}</p>
                  <p className="text-xs text-primary-foreground/50">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare - horizontal list style */}
      <section className="bg-background py-16 md:py-24">
        <div className="container max-w-6xl space-y-10">
          <div className="space-y-3">
            <Badge variant="outline" className="text-sm">Included Free</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Private Healthcare</h2>
            <p className="text-muted-foreground max-w-lg">
              Dental, optical, physio, GP, mental health — all included. No other franchise offers this.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthcareBenefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers - side by side with dark popular card */}
      <section className="bg-muted/50 py-16 md:py-24 border-y border-border">
        <div className="container max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Your Package</h2>
            <p className="text-muted-foreground">Healthcare + £50 intensive bonus in every tier</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 space-y-5 flex flex-col ${
                  t.popular ? "bg-primary text-primary-foreground shadow-xl" : "bg-card border border-border"
                }`}
              >
                {t.popular && <Badge className="bg-accent text-accent-foreground self-start text-xs">Most Popular</Badge>}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className={t.popular ? "text-primary-foreground/50" : "text-muted-foreground"}>/pw</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${t.popular ? "text-primary-foreground/80" : ""}`}>
                      <Check className={`h-4 w-4 shrink-0 ${t.popular ? "text-accent" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                  {t.excluded.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${t.popular ? "text-primary-foreground/30" : "text-muted-foreground/50"}`}>
                      <X className="h-4 w-4 shrink-0 opacity-40" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${t.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`} variant={t.popular ? "default" : "outline"}>
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus calc */}
      <section className="bg-background py-16 md:py-24">
        <div className="container max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Bonus Calculator</h2>
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-sm">
            <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full" />
            <p className="text-sm text-muted-foreground">{passes[0]} intensive courses / year</p>
            <p className="text-5xl font-bold text-primary">£{bonus.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">extra per year in your pocket</p>
          </div>
        </div>
      </section>

      {/* Tech + CTA */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container max-w-4xl space-y-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Tech No Other Franchise Offers</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {techFeatures.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <span className="text-xs font-medium text-primary-foreground/60">{f.label}</span>
              </div>
            ))}
          </div>
          <div className="pt-8">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 h-14 text-base font-semibold">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DESIGN F — "Full Bleed" (hero image with overlay, magazine feel)
// ═══════════════════════════════════════════════════════
function DesignF() {
  const [passes, setPasses] = useState([20]);
  const bonus = passes[0] * 50;
  return (
    <div className="bg-background text-foreground">
      {/* Hero - full bleed image with dark overlay */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary)/0.95)] via-[hsl(var(--primary)/0.8)] to-[hsl(var(--primary)/0.4)]" />
        <div className="relative z-10 container max-w-6xl py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-xl">
            <Badge className="bg-accent text-accent-foreground text-sm px-4 py-1.5 mb-6">
              Recruiting Nationwide
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-primary-foreground tracking-tight leading-[0.95]">
              YOUR<br />CAREER.<br />
              <span className="text-accent">UPGRADED.</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 mt-6 max-w-md leading-relaxed">
              Free healthcare. £50 per intensive course. The best tech. Just £50/pw. No car tie-in.
            </p>
            <div className="flex gap-3 mt-8">
              <Button size="lg" className="rounded-full h-13 px-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg text-base font-semibold">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-13 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                View Packages
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating stat cards overlapping hero */}
      <section className="container max-w-5xl -mt-10 relative z-20 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: "£50/pw", l: "All-inclusive", icon: Zap },
            { v: "£50", l: "Per intensive", icon: Gift },
            { v: "Free", l: "Healthcare", icon: Heart },
            { v: "Zero", l: "Car tie-in", icon: Car },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5 text-center shadow-lg"
            >
              <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Healthcare */}
      <section className="bg-background py-16 md:py-24">
        <div className="container max-w-6xl space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="text-sm">Free. Included. No Catch.</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Private Healthcare, On Us</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {healthcareBenefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-accent-foreground bg-accent/80 px-3 py-1 rounded-full">{b.value}</span>
                </div>
                <h3 className="font-semibold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-muted/50 py-16 md:py-24 border-y border-border">
        <div className="container max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Choose Your Package</h2>
            <p className="text-muted-foreground">Healthcare + £50 bonus in every tier</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-card border rounded-2xl p-6 space-y-5 relative flex flex-col ${
                  t.popular ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border"
                }`}
              >
                {t.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>
                )}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="text-muted-foreground">/pw</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                  {t.excluded.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                      <X className="h-4 w-4 opacity-40 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={t.popular ? "default" : "outline"}>
                  Get Started <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus + Competitors side by side */}
      <section className="bg-background py-16 md:py-24">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Bonus calc */}
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-sm">
              <h3 className="text-2xl font-bold">Bonus Calculator</h3>
              <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full" />
              <p className="text-sm text-muted-foreground">{passes[0]} courses / year</p>
              <p className="text-5xl font-bold text-primary">£{bonus.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">extra per year</p>
            </div>
            {/* Competitor table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="text-2xl font-bold">Save Thousands</h3>
              </div>
              {competitors.map((c, i) => (
                <div key={c.name} className={`flex items-center justify-between px-6 py-4 ${i < competitors.length - 1 ? "border-b border-border" : ""} ${c.highlight ? "bg-primary/5" : ""}`}>
                  <div className="flex items-center gap-2">
                    {c.highlight && <Badge className="bg-primary text-primary-foreground text-xs">You</Badge>}
                    <span className={`font-medium ${c.highlight ? "text-primary" : ""}`}>{c.name}</span>
                  </div>
                  <span className={`font-bold ${c.highlight ? "text-primary" : ""}`}>£{c.weekly}/wk</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Start Earning More. Stress Less.</h2>
          <p className="text-primary-foreground/70 text-lg">
            Free healthcare. £50 per intensive course. The best tech. Just £50/pw.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 h-14 text-base font-semibold">
            Apply Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DEMO CHOOSER
// ═══════════════════════════════════════════════════════
export default function FranchiseDemo() {
  const [activeDesign, setActiveDesign] = useState<"D" | "E" | "F">("D");

  const designs = [
    { key: "D" as const, label: "Homepage Match", desc: "Matches Drive365 homepage exactly" },
    { key: "E" as const, label: "Split Hero", desc: "Image left, content right" },
    { key: "F" as const, label: "Full Bleed", desc: "Magazine-style image overlay" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Selector bar */}
      <div className="sticky top-0 z-50 bg-primary/95 backdrop-blur-xl border-b border-primary-foreground/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <span className="text-primary-foreground/60 text-sm font-medium shrink-0">Choose a design:</span>
          <div className="flex gap-3">
            {designs.map((d) => (
              <button
                key={d.key}
                onClick={() => setActiveDesign(d.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeDesign === d.key
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "bg-primary-foreground/10 text-primary-foreground/60 hover:bg-primary-foreground/15 hover:text-primary-foreground"
                }`}
              >
                <span className="font-bold">{d.key}.</span> {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeDesign}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeDesign === "D" && <DesignD />}
          {activeDesign === "E" && <DesignE />}
          {activeDesign === "F" && <DesignF />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
