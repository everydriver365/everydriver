import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Eye, Brain, Phone, Stethoscope, Calendar, Car, MapPin, FileText, Smartphone, Globe, Check, ChevronRight, Sparkles, Star, ArrowRight, Zap, Award, TrendingUp, Gift, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import heroImg from "@/assets/franchise-hero-instructor.jpg";

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
// DESIGN D — "Warm Sand" (warm neutrals, terracotta accent)
// ═══════════════════════════════════════════════════════
function DesignD() {
  const [passes, setPasses] = useState([20]);
  return (
    <div className="bg-[hsl(35,30%,96%)] text-[hsl(25,20%,18%)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[560px]">
          <div className="flex items-center px-8 md:px-16 py-20">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, type: "spring" }}>
              <div className="inline-flex items-center gap-2 bg-[hsl(25,60%,95%)] text-[hsl(25,60%,40%)] rounded-full px-4 py-2 text-sm font-medium mb-6 border border-[hsl(25,40%,88%)]">
                <Sparkles className="h-4 w-4" /> Now Recruiting
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.08]">
                Build your
                <br />
                business,
                <br />
                <span className="text-[hsl(15,70%,50%)]">your way.</span>
              </h1>
              <p className="text-lg text-[hsl(25,10%,50%)] mt-6 leading-relaxed max-w-md">
                Free healthcare. £50 per intensive course. The UK's best tech platform. Just £50/pw with zero car tie-in.
              </p>
              <div className="flex gap-3 mt-8">
                <Button size="lg" className="bg-[hsl(15,70%,50%)] hover:bg-[hsl(15,70%,45%)] text-white rounded-full px-8 h-13 text-base font-semibold shadow-[0_8px_24px_-8px_hsl(15,70%,50%/0.4)]">
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="ghost" className="rounded-full px-8 h-13 text-base text-[hsl(25,10%,40%)]">
                  View Packages
                </Button>
              </div>
            </motion.div>
          </div>
          <div className="relative hidden md:block">
            <img src={heroImg} alt="Driving instructor" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(35,30%,96%)] via-transparent to-transparent w-1/3" />
          </div>
        </div>
      </section>

      {/* Stat ribbon */}
      <section className="bg-[hsl(25,20%,22%)] text-white py-6 px-8">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12">
          {[
            { v: "£50", l: "per week" },
            { v: "£50", l: "per intensive bonus" },
            { v: "Free", l: "private healthcare" },
            { v: "Zero", l: "car tie-in" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-bold text-[hsl(15,70%,60%)]">{s.v}</p>
              <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Healthcare */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Private healthcare, on us</h2>
          <p className="text-[hsl(25,10%,50%)] mb-10 max-w-lg">Every benefit included at no extra cost. No other franchise offers this.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthcareBenefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-6 border border-[hsl(35,20%,90%)] shadow-[0_1px_12px_-4px_hsl(25,20%,20%/0.06)] hover:shadow-[0_4px_20px_-6px_hsl(25,20%,20%/0.1)] transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-[hsl(25,50%,94%)] flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-[hsl(15,70%,50%)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="text-sm text-[hsl(15,70%,50%)] font-medium">{b.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="px-8 md:px-16 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Choose your package</h2>
          <p className="text-center text-[hsl(25,10%,50%)] mb-10">Healthcare + bonuses included in every tier</p>
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-7 flex flex-col ${t.popular ? "bg-[hsl(25,20%,22%)] text-white ring-4 ring-[hsl(15,70%,50%)/0.2]" : "bg-[hsl(35,30%,96%)] border border-[hsl(35,20%,88%)]"}`}
              >
                {t.popular && <span className="text-xs font-bold text-[hsl(15,70%,60%)] mb-3">★ MOST POPULAR</span>}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className={t.popular ? "text-white/50" : "text-[hsl(25,10%,55%)]"}>/pw</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className={`flex items-center gap-3 text-sm ${t.popular ? "text-white/70" : "text-[hsl(25,10%,45%)]"}`}>
                      <Check className={`h-4 w-4 shrink-0 ${t.popular ? "text-[hsl(15,70%,60%)]" : "text-[hsl(15,70%,50%)]"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full mt-6 rounded-full h-12 font-semibold ${t.popular ? "bg-[hsl(15,70%,50%)] hover:bg-[hsl(15,70%,45%)] text-white" : "bg-[hsl(25,20%,22%)] hover:bg-[hsl(25,20%,28%)] text-white"}`}>
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus calc */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 text-center border border-[hsl(35,20%,90%)] shadow-[0_2px_16px_-4px_hsl(25,20%,20%/0.06)]">
          <Gift className="h-8 w-8 text-[hsl(15,70%,50%)] mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-6">Bonus Calculator</h3>
          <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full mb-4" />
          <p className="text-sm text-[hsl(25,10%,55%)]">{passes[0]} intensive courses / year</p>
          <p className="text-5xl font-bold text-[hsl(15,70%,50%)] mt-4">£{(passes[0] * 50).toLocaleString()}</p>
          <p className="text-xs text-[hsl(25,10%,55%)] mt-2">extra per year</p>
        </div>
      </section>

      {/* Tech */}
      <section className="px-8 md:px-16 py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">Tech no other franchise offers</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {techFeatures.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-2xl bg-[hsl(35,30%,96%)] border border-[hsl(35,20%,90%)] flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-[hsl(25,20%,30%)]" />
                </div>
                <span className="text-xs font-medium text-[hsl(25,10%,45%)]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DESIGN E — "Frosted Mint" (cool mint/sage, airy, Apple-like)
// ═══════════════════════════════════════════════════════
function DesignE() {
  const [passes, setPasses] = useState([20]);
  return (
    <div className="bg-white text-[hsl(200,15%,15%)]">
      {/* Hero - large centered text, image below */}
      <section className="pt-20 pb-12 px-8 md:px-16 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-[hsl(160,40%,95%)] text-[hsl(160,50%,30%)] rounded-full px-5 py-2 text-sm font-medium mb-8 border border-[hsl(160,30%,88%)]">
            <Leaf className="h-4 w-4" /> Franchise Opportunities
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
            A better way to
            <br />
            <span className="bg-gradient-to-r from-[hsl(160,50%,40%)] to-[hsl(180,50%,40%)] bg-clip-text text-transparent">
              run your business
            </span>
          </h1>
          <p className="text-lg text-[hsl(200,10%,50%)] mt-6 max-w-xl mx-auto leading-relaxed">
            Free healthcare. £50 per intensive course. World-class tech. Just £50/pw.
          </p>
          <div className="flex gap-4 justify-center mt-10">
            <Button size="lg" className="bg-[hsl(160,50%,38%)] hover:bg-[hsl(160,50%,33%)] text-white rounded-2xl px-10 h-14 text-base font-semibold">
              Apply Now
            </Button>
            <Button size="lg" variant="outline" className="rounded-2xl px-10 h-14 text-base border-[hsl(200,15%,85%)]">
              View Packages
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Hero image strip */}
      <section className="px-8 md:px-16 pb-16">
        <div className="max-w-5xl mx-auto overflow-hidden rounded-3xl h-[280px] relative">
          <img src={heroImg} alt="Driving instructor" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
          {/* Floating pills over image */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
            {[
              { v: "£50/pw", icon: Award },
              { v: "£50 bonus", icon: TrendingUp },
              { v: "Free healthcare", icon: Heart },
              { v: "No car tie-in", icon: Car },
            ].map((s) => (
              <div key={s.v} className="bg-white/90 backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-white/50">
                <s.icon className="h-4 w-4 text-[hsl(160,50%,38%)]" />
                <span className="text-sm font-semibold text-[hsl(200,15%,15%)]">{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Healthcare */}
      <section className="px-8 md:px-16 py-20 bg-[hsl(160,30%,97%)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Private healthcare, included</h2>
            <p className="text-[hsl(200,10%,50%)] mt-2">No other franchise offers this — completely free.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthcareBenefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-6 border border-[hsl(160,20%,92%)] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl bg-[hsl(160,40%,94%)] flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5 text-[hsl(160,50%,38%)]" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-[hsl(160,50%,38%)] font-medium mt-1">{b.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Simple, transparent pricing</h2>
          <p className="text-center text-[hsl(200,10%,50%)] mb-10">Healthcare and bonuses included in every tier</p>
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-7 flex flex-col border-2 ${t.popular ? "border-[hsl(160,50%,38%)] bg-[hsl(160,30%,97%)] shadow-[0_0_0_1px_hsl(160,50%,38%/0.1),0_8px_32px_-8px_hsl(160,50%,38%/0.12)]" : "border-[hsl(200,15%,92%)] bg-white"}`}
              >
                {t.popular && (
                  <span className="text-xs font-bold text-[hsl(160,50%,35%)] bg-[hsl(160,40%,92%)] self-start px-3 py-1 rounded-full mb-4 border border-[hsl(160,30%,86%)]">POPULAR</span>
                )}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="text-[hsl(200,10%,55%)]">/pw</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[hsl(200,10%,40%)]">
                      <Check className="h-4 w-4 text-[hsl(160,50%,38%)] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full mt-6 rounded-2xl h-12 font-semibold ${t.popular ? "bg-[hsl(160,50%,38%)] hover:bg-[hsl(160,50%,33%)] text-white" : "bg-[hsl(200,15%,96%)] hover:bg-[hsl(200,15%,93%)] text-[hsl(200,15%,15%)]"}`}>
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus calc */}
      <section className="px-8 md:px-16 py-20 bg-[hsl(160,30%,97%)]">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 text-center border border-[hsl(160,20%,92%)] shadow-sm">
          <h3 className="text-2xl font-bold mb-6">Bonus Calculator</h3>
          <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full mb-4" />
          <p className="text-sm text-[hsl(200,10%,55%)]">{passes[0]} intensive courses / year</p>
          <p className="text-5xl font-bold text-[hsl(160,50%,38%)] mt-4">£{(passes[0] * 50).toLocaleString()}</p>
          <p className="text-xs text-[hsl(200,10%,55%)] mt-2">extra per year</p>
        </div>
      </section>

      {/* Tech */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">Tech no other franchise offers</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {techFeatures.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-2xl bg-[hsl(160,30%,97%)] border border-[hsl(160,20%,92%)] flex items-center justify-center shadow-sm">
                  <f.icon className="h-7 w-7 text-[hsl(160,50%,38%)]" />
                </div>
                <span className="text-xs font-medium text-[hsl(200,10%,45%)]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DESIGN F — "Soft Lavender" (soft purple, elegant, editorial)
// ═══════════════════════════════════════════════════════
function DesignF() {
  const [passes, setPasses] = useState([20]);
  return (
    <div className="bg-[hsl(260,20%,98%)] text-[hsl(260,20%,15%)]">
      {/* Hero - editorial split */}
      <section className="relative min-h-[580px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(260,20%,98%)] via-[hsl(260,20%,98%/0.92)] to-[hsl(260,20%,98%/0.4)]" />
        </div>
        <div className="relative z-10 px-8 md:px-16 py-24 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-sm font-medium text-[hsl(260,40%,55%)] tracking-widest uppercase mb-6">Drive365 Franchise</p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]">
              Where ambition
              <br />
              meets{" "}
              <span className="text-[hsl(260,40%,55%)]">opportunity</span>
            </h1>
            <p className="text-lg text-[hsl(260,10%,45%)] mt-6 leading-relaxed max-w-md">
              Free private healthcare. £50 per intensive course completed. The best instructor platform. Just £50/pw.
            </p>
            <div className="flex gap-4 mt-10">
              <Button size="lg" className="bg-[hsl(260,40%,50%)] hover:bg-[hsl(260,40%,45%)] text-white rounded-2xl px-10 h-14 text-base font-semibold shadow-[0_8px_24px_-8px_hsl(260,40%,50%/0.35)]">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="ghost" className="rounded-2xl px-8 h-14 text-base text-[hsl(260,10%,40%)]">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats row */}
      <section className="px-8 md:px-16 -mt-6 relative z-20">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-4">
          {[
            { v: "£50", l: "Per week" },
            { v: "£50", l: "Per intensive" },
            { v: "Free", l: "Healthcare" },
            { v: "Zero", l: "Car tie-in" },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-5 text-center shadow-[0_2px_16px_-4px_hsl(260,20%,15%/0.06)] border border-[hsl(260,15%,93%)]"
            >
              <p className="text-2xl font-bold text-[hsl(260,40%,50%)]">{s.v}</p>
              <p className="text-xs text-[hsl(260,10%,55%)] mt-1">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Healthcare */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Healthcare included, free</h2>
          <p className="text-[hsl(260,10%,50%)] mb-10">No other franchise offers this.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthcareBenefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-6 border border-[hsl(260,15%,93%)] shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="h-10 w-10 rounded-xl bg-[hsl(260,30%,95%)] group-hover:bg-[hsl(260,30%,92%)] flex items-center justify-center mb-4 transition-colors">
                  <b.icon className="h-5 w-5 text-[hsl(260,40%,50%)]" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-[hsl(260,40%,55%)] font-medium mt-1">{b.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="px-8 md:px-16 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Your package</h2>
          <p className="text-center text-[hsl(260,10%,50%)] mb-10">Healthcare and bonuses in every tier</p>
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-7 flex flex-col ${t.popular ? "bg-[hsl(260,40%,50%)] text-white shadow-[0_12px_40px_-10px_hsl(260,40%,50%/0.3)]" : "bg-[hsl(260,20%,98%)] border border-[hsl(260,15%,93%)]"}`}
              >
                {t.popular && <span className="text-xs font-bold text-[hsl(260,60%,80%)] mb-3">★ MOST POPULAR</span>}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className={t.popular ? "text-white/60" : "text-[hsl(260,10%,55%)]"}>/pw</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className={`flex items-center gap-3 text-sm ${t.popular ? "text-white/80" : "text-[hsl(260,10%,45%)]"}`}>
                      <Check className={`h-4 w-4 shrink-0 ${t.popular ? "text-[hsl(260,60%,80%)]" : "text-[hsl(260,40%,55%)]"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full mt-6 rounded-2xl h-12 font-semibold ${t.popular ? "bg-white hover:bg-white/90 text-[hsl(260,40%,45%)]" : "bg-[hsl(260,40%,50%)] hover:bg-[hsl(260,40%,45%)] text-white"}`}>
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus calc */}
      <section className="px-8 md:px-16 py-20">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 text-center border border-[hsl(260,15%,93%)] shadow-sm">
          <Star className="h-8 w-8 text-[hsl(260,40%,55%)] mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-6">Bonus Calculator</h3>
          <Slider value={passes} onValueChange={setPasses} min={5} max={60} className="w-full mb-4" />
          <p className="text-sm text-[hsl(260,10%,55%)]">{passes[0]} intensive courses / year</p>
          <p className="text-5xl font-bold text-[hsl(260,40%,50%)] mt-4">£{(passes[0] * 50).toLocaleString()}</p>
          <p className="text-xs text-[hsl(260,10%,55%)] mt-2">extra per year</p>
        </div>
      </section>

      {/* Tech */}
      <section className="px-8 md:px-16 py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">Tech no other franchise offers</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {techFeatures.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-[hsl(260,30%,96%)] border border-[hsl(260,15%,92%)] flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-[hsl(260,40%,50%)]" />
                </div>
                <span className="text-xs font-medium text-[hsl(260,10%,45%)]">{f.label}</span>
              </div>
            ))}
          </div>
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
    { key: "D" as const, label: "Warm Sand", desc: "Warm neutrals, terracotta accent" },
    { key: "E" as const, label: "Frosted Mint", desc: "Cool sage/mint, Apple-like clarity" },
    { key: "F" as const, label: "Soft Lavender", desc: "Elegant purple, editorial feel" },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,20%,97%)]">
      {/* Selector bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[hsl(220,15%,90%)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <span className="text-[hsl(220,10%,40%)] text-sm font-medium shrink-0">Choose a design:</span>
          <div className="flex gap-3">
            {designs.map((d) => (
              <button
                key={d.key}
                onClick={() => setActiveDesign(d.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeDesign === d.key
                    ? "bg-[hsl(220,52%,17%)] text-white shadow-lg"
                    : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
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
