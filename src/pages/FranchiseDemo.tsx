import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Eye, Brain, Phone, Stethoscope, Calendar, Car, MapPin, FileText, Smartphone, Globe, Check, X, ChevronRight, Sparkles, Star, ArrowRight, Zap, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import heroImg from "@/assets/franchise-hero-instructor.jpg";

// Shared data
const healthcareBenefits = [
  { icon: Heart, title: "Dental Cashback", value: "£150/yr" },
  { icon: Eye, title: "Optical Cover", value: "£100/yr" },
  { icon: Stethoscope, title: "Physio Sessions", value: "Included" },
  { icon: Phone, title: "24/7 GP Access", value: "Unlimited" },
  { icon: Brain, title: "Mental Health", value: "Included" },
  { icon: Shield, title: "Employee Assistance", value: "24/7" },
];

const tiers = [
  { name: "Starter", price: "£50", features: ["Full platform access", "Free healthcare", "£50 intensive bonus", "1-page mini website", "Pupil app"] },
  { name: "Pro", price: "£50", popular: true, features: ["Everything in Starter", "Multi-page website", "GPS tracking", "Priority support"] },
  { name: "Elite", price: "£50", features: ["Everything in Pro", "Dashcam system", "Custom domain", "White-glove onboarding"] },
];

const techFeatures = [
  { icon: Calendar, label: "Smart Diary" },
  { icon: MapPin, label: "GPS Tracking" },
  { icon: Car, label: "Dashcam" },
  { icon: FileText, label: "MTD Tax Filing" },
  { icon: Smartphone, label: "Pupil App" },
  { icon: Globe, label: "Your Own Website" },
];

// ═══════════════════════════════════════════════════════
// DESIGN A — "Dark Cinematic" (iOS dark mode, glassmorphism)
// ═══════════════════════════════════════════════════════
function DesignA() {
  const [passes, setPasses] = useState([20]);
  return (
    <div className="bg-[hsl(220,52%,8%)] text-white">
      {/* Hero - full bleed image with dark overlay */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,52%,8%)] via-[hsl(220,52%,8%/0.85)] to-transparent" />
        <div className="relative z-10 px-8 md:px-16 max-w-2xl py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Now Recruiting Nationwide
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Your career.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Supercharged.
              </span>
            </h1>
            <p className="text-lg text-white/60 mt-6 max-w-lg leading-relaxed">
              Free private healthcare. £50 bonus for every intensive course completed. The best tech in the business. Just £50/pw.
            </p>
            <div className="flex gap-4 mt-8">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 text-base font-semibold">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl px-8 h-14 text-base">
                View Packages
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stat pills */}
      <section className="px-8 md:px-16 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-4 max-w-3xl">
          {[
            { label: "Per week", value: "£50", sub: "All tiers" },
            { label: "Per intensive", value: "£50", sub: "Bonus" },
            { label: "Healthcare", value: "Free", sub: "Included" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center"
            >
              <p className="text-3xl font-bold text-emerald-400">{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Healthcare - glass cards */}
      <section className="px-8 md:px-16 py-20">
        <h2 className="text-3xl font-bold mb-2">Private Healthcare, On Us</h2>
        <p className="text-white/50 mb-10 max-w-lg">No other franchise includes this. Dental, optical, physio, GP, mental health — all free.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthcareBenefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">{b.value}</span>
              </div>
              <h3 className="font-semibold text-lg">{b.title}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tier cards - glass */}
      <section className="px-8 md:px-16 py-20">
        <h2 className="text-3xl font-bold mb-2">Choose Your Package</h2>
        <p className="text-white/50 mb-10">All tiers include healthcare and the £50 intensive course bonus</p>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-px ${t.popular ? "bg-gradient-to-b from-emerald-500/50 to-transparent" : "bg-white/10"}`}
            >
              <div className="bg-[hsl(220,52%,10%)] rounded-3xl p-7 h-full flex flex-col">
                {t.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">Most Popular</span>
                  </div>
                )}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="text-white/40">/pw</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full mt-6 rounded-2xl h-12 ${t.popular ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white/10 hover:bg-white/15 text-white"}`}>
                  Get Started
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bonus calculator */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-xl mx-auto bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-6">Bonus Calculator</h3>
          <p className="text-white/50 text-sm mb-6">How many intensive courses do your pupils complete per year?</p>
          <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full mb-4" />
          <p className="text-sm text-white/40">{passes[0]} courses</p>
          <p className="text-5xl font-bold text-emerald-400 mt-4">£{(passes[0] * 50).toLocaleString()}</p>
          <p className="text-xs text-white/40 mt-2">extra per year</p>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DESIGN B — "Clean & Bold" (iOS light, SF-style cards)
// ═══════════════════════════════════════════════════════
function DesignB() {
  const [passes, setPasses] = useState([20]);
  return (
    <div className="bg-[hsl(220,20%,97%)] text-[hsl(220,30%,15%)]">
      {/* Hero - clean white with large type */}
      <section className="relative py-24 px-8 md:px-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <img src={heroImg} alt="" className="w-full h-full object-cover rounded-bl-[80px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,20%,97%)] via-[hsl(220,20%,97%/0.3)] to-transparent" />
        </div>
        <div className="relative z-10 max-w-xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring" }}>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-2 text-sm font-medium mb-8 border border-emerald-200">
              <Zap className="h-4 w-4" /> Recruiting Now
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              The franchise
              <br />
              that pays{" "}
              <span className="relative">
                <span className="text-emerald-600">you</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" fill="none">
                  <path d="M0 6 Q25 0, 50 4 T100 4" stroke="hsl(142,71%,45%)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              {" "}back.
            </h1>
            <p className="text-lg text-[hsl(220,10%,45%)] mt-6 leading-relaxed max-w-md">
              Free healthcare. £50 per intensive course. The UK's best instructor tech. All for just £50/pw.
            </p>
            <div className="flex gap-4 mt-10">
              <Button size="lg" className="bg-[hsl(220,52%,17%)] hover:bg-[hsl(220,52%,22%)] text-white rounded-2xl px-8 h-14 text-base font-semibold shadow-lg">
                Apply Now
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl px-8 h-14 text-base border-[hsl(220,20%,85%)]">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value props - pill cards */}
      <section className="px-8 md:px-16 pb-16">
        <div className="grid grid-cols-3 gap-4 max-w-3xl">
          {[
            { icon: Award, value: "£50/pw", label: "All-inclusive" },
            { icon: TrendingUp, value: "£50", label: "Per intensive bonus" },
            { icon: Heart, value: "Free", label: "Private healthcare" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_-4px_hsl(220,30%,15%/0.08)] border border-[hsl(220,20%,92%)]"
            >
              <s.icon className="h-6 w-6 text-emerald-600 mb-3" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-[hsl(220,10%,55%)]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Healthcare grid */}
      <section className="px-8 md:px-16 py-20 bg-white">
        <h2 className="text-3xl font-bold mb-2">Healthcare included, free</h2>
        <p className="text-[hsl(220,10%,50%)] mb-10">No other franchise offers this. Zero cost. Zero catch.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthcareBenefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-[hsl(220,20%,97%)] rounded-2xl p-6 border border-[hsl(220,20%,93%)] hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <b.icon className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold">{b.title}</h3>
              <p className="text-sm text-emerald-600 font-medium mt-1">{b.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tiers - clean cards */}
      <section className="px-8 md:px-16 py-20">
        <h2 className="text-3xl font-bold text-center mb-2">Simple pricing</h2>
        <p className="text-center text-[hsl(220,10%,50%)] mb-10">Healthcare and bonuses included in every tier</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-3xl p-7 border-2 flex flex-col ${t.popular ? "border-emerald-500 shadow-[0_0_0_1px_hsl(142,71%,45%/0.2),0_8px_30px_-8px_hsl(142,71%,45%/0.15)]" : "border-[hsl(220,20%,92%)]"}`}
            >
              {t.popular && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 self-start px-3 py-1 rounded-full mb-4 border border-emerald-200">POPULAR</span>
              )}
              <h3 className="text-lg font-bold">{t.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">{t.price}</span>
                <span className="text-[hsl(220,10%,55%)]">/pw</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[hsl(220,10%,40%)]">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className={`w-full mt-6 rounded-2xl h-12 ${t.popular ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[hsl(220,20%,97%)] hover:bg-[hsl(220,20%,94%)] text-[hsl(220,30%,15%)]"}`}>
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bonus calc */}
      <section className="px-8 md:px-16 py-20 bg-white">
        <div className="max-w-xl mx-auto bg-[hsl(220,20%,97%)] rounded-3xl p-8 text-center border border-[hsl(220,20%,92%)]">
          <h3 className="text-2xl font-bold mb-6">Bonus Calculator</h3>
          <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full mb-4" />
          <p className="text-sm text-[hsl(220,10%,55%)]">{passes[0]} intensive courses / year</p>
          <p className="text-5xl font-bold text-emerald-600 mt-4">£{(passes[0] * 50).toLocaleString()}</p>
          <p className="text-xs text-[hsl(220,10%,55%)] mt-2">extra per year in your pocket</p>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DESIGN C — "Gradient Luxe" (dark gradients, warm accents)
// ═══════════════════════════════════════════════════════
function DesignC() {
  const [passes, setPasses] = useState([20]);
  return (
    <div className="bg-[hsl(222,47%,11%)] text-white">
      {/* Hero - gradient mesh with floating elements */}
      <section className="relative py-28 px-8 md:px-16 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-20 w-[400px] h-[400px] bg-sky-500/15 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-5 py-2 text-sm mb-8">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              Recruiting Nationwide
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Drive your career
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                further than ever
              </span>
            </h1>
            <p className="text-lg text-white/50 mt-8 max-w-xl mx-auto leading-relaxed">
              Free private healthcare. £50 per intensive course bonus. The UK's most advanced instructor platform. Just £50/pw.
            </p>

            {/* Floating stat cards */}
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              {[
                { v: "£50/pw", l: "All-inclusive" },
                { v: "£50", l: "Per intensive" },
                { v: "Free", l: "Healthcare" },
                { v: "Zero", l: "Car tie-in" },
              ].map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                  className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 min-w-[120px]"
                >
                  <p className="text-xl font-bold text-emerald-400">{s.v}</p>
                  <p className="text-xs text-white/40">{s.l}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-4 justify-center mt-12">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl px-10 h-14 text-base font-semibold shadow-[0_8px_32px_-8px_hsl(142,71%,45%/0.5)]">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Healthcare - horizontal scroll cards */}
      <section className="py-20 px-8 md:px-16">
        <h2 className="text-3xl font-bold mb-2">Healthcare included</h2>
        <p className="text-white/40 mb-10">No other franchise offers this — completely free.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthcareBenefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur border border-white/[0.08] rounded-2xl p-6 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                  <b.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-emerald-400 font-medium">{b.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tiers - gradient border cards */}
      <section className="px-8 md:px-16 py-20">
        <h2 className="text-3xl font-bold text-center mb-2">Choose your package</h2>
        <p className="text-center text-white/40 mb-12">Healthcare and bonuses included in every tier</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative group"
            >
              {t.popular && (
                <div className="absolute -inset-px bg-gradient-to-b from-emerald-500 via-teal-500/50 to-transparent rounded-3xl" />
              )}
              <div className={`relative bg-[hsl(222,47%,13%)] rounded-3xl p-7 h-full flex flex-col ${!t.popular ? "border border-white/10" : ""}`}>
                {t.popular && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-amber-400">MOST POPULAR</span>
                  </div>
                )}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{t.price}</span>
                  <span className="text-white/40">/pw</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full mt-6 rounded-2xl h-12 font-semibold ${t.popular ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-[0_4px_20px_-4px_hsl(142,71%,45%/0.4)]" : "bg-white/10 hover:bg-white/15 text-white"}`}>
                  Get Started
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bonus calc */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-xl mx-auto relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 rounded-[28px] blur-xl" />
          <div className="relative bg-[hsl(222,47%,13%)] border border-white/10 rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-6">Bonus Calculator</h3>
            <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full mb-4" />
            <p className="text-sm text-white/40">{passes[0]} intensive courses / year</p>
            <p className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mt-4">
              £{(passes[0] * 50).toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-2">extra per year</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DEMO CHOOSER PAGE
// ═══════════════════════════════════════════════════════
export default function FranchiseDemo() {
  const [activeDesign, setActiveDesign] = useState<"A" | "B" | "C">("A");

  const designs = [
    { key: "A" as const, label: "Dark Cinematic", desc: "Moody dark glass with emerald accents" },
    { key: "B" as const, label: "Clean & Bold", desc: "Light iOS style, crisp and minimal" },
    { key: "C" as const, label: "Gradient Luxe", desc: "Dark gradient mesh, premium feel" },
  ];

  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)]">
      {/* Design selector bar */}
      <div className="sticky top-0 z-50 bg-[hsl(222,47%,11%)]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <span className="text-white/50 text-sm font-medium shrink-0">Choose a design:</span>
          <div className="flex gap-3">
            {designs.map((d) => (
              <button
                key={d.key}
                onClick={() => setActiveDesign(d.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeDesign === d.key
                    ? "bg-emerald-500 text-white shadow-[0_4px_16px_-4px_hsl(142,71%,45%/0.5)]"
                    : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
                }`}
              >
                <span className="font-bold">{d.key}.</span> {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active design */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDesign}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeDesign === "A" && <DesignA />}
          {activeDesign === "B" && <DesignB />}
          {activeDesign === "C" && <DesignC />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
