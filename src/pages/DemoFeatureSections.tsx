import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Shield, CreditCard, Calendar, RefreshCw, Eye,
  CheckCircle2, Star, Sparkles, ArrowRight, Zap, Gift,
  ChevronRight, Award, Clock, Heart, Target, Rocket
} from "lucide-react";

const features = [
  { icon: BookOpen, title: "Theory Test Support", description: "Full access to theory test preparation materials and mock tests.", color: "from-blue-500 to-blue-600" },
  { icon: CreditCard, title: "Flexible Payments", description: "Split your course cost into manageable weekly or monthly payments.", color: "from-emerald-500 to-emerald-600" },
  { icon: RefreshCw, title: "Free Cancellation", description: "Cancel or reschedule lessons up to 48 hours before with no charge.", color: "from-violet-500 to-violet-600" },
  { icon: Shield, title: "Free Re-Test", description: "If you don't pass first time, we'll cover your re-test lesson for free.", color: "from-rose-500 to-rose-600" },
  { icon: Calendar, title: "Live Availability", description: "See real-time instructor availability and book instantly online.", color: "from-amber-500 to-amber-600" },
  { icon: Eye, title: "Theory Test Pro", description: "Premium access to the UK's #1 theory test app included free.", color: "from-cyan-500 to-cyan-600" },
];

const variants = [
  "Floating Cards",
  "Icon Towers",
  "Gradient Tiles",
  "Timeline",
  "Hexagon Grid",
  "Split Panel",
  "Accordion Stack",
  "Orbit",
  "Neon Glass",
  "Checklist",
];

export default function DemoFeatureSections() {
  const [active, setActive] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Selector */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b py-4">
        <div className="container">
          <h1 className="text-xl font-bold mb-3">Feature Section Variants — "Everything You Need to Pass"</h1>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => (
              <Button
                key={i}
                size="sm"
                variant={active === i ? "default" : "outline"}
                onClick={() => setActive(i)}
              >
                V{i + 1}: {v}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-12">
        {active === 0 && <V1FloatingCards />}
        {active === 1 && <V2IconTowers />}
        {active === 2 && <V3GradientTiles />}
        {active === 3 && <V4Timeline />}
        {active === 4 && <V5HexagonGrid />}
        {active === 5 && <V6SplitPanel />}
        {active === 6 && <V7AccordionStack />}
        {active === 7 && <V8Orbit />}
        {active === 8 && <V9NeonGlass />}
        {active === 9 && <V10Checklist />}
      </div>
    </div>
  );
}

/* V1: Floating Cards — elevated cards with colored left border */
function V1FloatingCards() {
  return (
    <section className="container">
      <SectionHeader badge="All Included Free" />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            viewport={{ once: true }}
            className="group relative rounded-xl bg-card border shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${f.color}`} />
            <div className="p-6 pl-8">
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.color} p-3`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* V2: Icon Towers — tall vertical cards with large top icon */
function V2IconTowers() {
  return (
    <section className="container">
      <SectionHeader badge="Why Choose Us" />
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            viewport={{ once: true }}
            className="group text-center rounded-2xl border bg-card p-6 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-white/20 transition-colors">
              <f.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-sm font-bold mb-2">{f.title}</h3>
            <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 transition-colors leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* V3: Gradient Tiles — bold gradient backgrounds */
function V3GradientTiles() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="container">
        <SectionHeader badge="Included Free" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className={`rounded-2xl bg-gradient-to-br ${f.color} p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                  <f.icon className="h-6 w-6" />
                </div>
                <Badge className="bg-white/25 text-white border-0 text-xs">FREE</Badge>
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-white/85 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* V4: Timeline — vertical timeline with alternating cards */
function V4Timeline() {
  return (
    <section className="container max-w-3xl">
      <SectionHeader badge="Your Journey" />
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block" />
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className={`relative mb-8 md:w-[45%] ${i % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}
          >
            <div className="rounded-xl border bg-card p-5 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className={`rounded-lg bg-gradient-to-br ${f.color} p-2`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
            <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 ${i % 2 === 0 ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'}`}>
              <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${f.color} ring-4 ring-background`} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* V5: Hexagon Grid — overlapping hexagonal-style cards */
function V5HexagonGrid() {
  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="container">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">All Included</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Pass</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Your complete driving success toolkit — every feature included at no extra cost.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-amber-500/40 hover:bg-white/10 transition-all duration-300"
            >
              <div className="absolute -top-3 -right-3 h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent" />
              <div className="relative">
                <f.icon className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                <div className="mt-4 h-0.5 w-0 bg-gradient-to-r from-amber-500 to-amber-300 group-hover:w-full transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* V6: Split Panel — left heading, right features grid */
function V6SplitPanel() {
  return (
    <section className="container py-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">100% Free</Badge>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Everything You Need to <span className="text-primary">Pass First Time</span></h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">Every course comes packed with premium features at no extra cost. We invest in your success.</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">6</div>
              <div className="text-xs text-muted-foreground">Free Features</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">£0</div>
              <div className="text-xs text-muted-foreground">Extra Cost</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5★</div>
              <div className="text-xs text-muted-foreground">Rated</div>
            </div>
          </div>
        </motion.div>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className="flex gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className={`flex-shrink-0 rounded-lg bg-gradient-to-br ${f.color} p-2.5 h-fit`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* V7: Accordion Stack — expandable feature cards */
function V7AccordionStack() {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <section className="container max-w-2xl">
      <SectionHeader badge="Features Included" />
      <div className="space-y-3">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            viewport={{ once: true }}
            className={`rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer ${expanded === i ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-md'}`}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="flex items-center gap-4 p-4 bg-card">
              <div className={`rounded-lg bg-gradient-to-br ${f.color} p-2.5 flex-shrink-0`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold flex-1">{f.title}</h3>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">FREE</Badge>
              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expanded === i ? 'rotate-90' : ''}`} />
            </div>
            <motion.div
              initial={false}
              animate={{ height: expanded === i ? 'auto' : 0, opacity: expanded === i ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-0">
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  <button className="mt-3 text-sm font-medium text-primary hover:underline">Learn more →</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* V8: Orbit — central badge with orbiting feature cards */
function V8Orbit() {
  return (
    <section className="bg-gradient-to-b from-primary/5 to-background py-20">
      <div className="container">
        <SectionHeader badge="Complete Package" />
        <div className="relative">
          {/* Central element */}
          <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
            <div className="rounded-full bg-primary/10 p-8 border-2 border-dashed border-primary/20">
              <Award className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-card border p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className={`rounded-full bg-gradient-to-br ${f.color} p-3`}>
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold">{f.title}</h3>
                    <span className="text-xs text-emerald-600 font-medium">Included Free</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* V9: Neon Glass — glassmorphism with neon accents */
function V9NeonGlass() {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="container">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Sparkles className="h-3 w-3 mr-1" /> Premium Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need to Pass</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Six premium features included free with every course booking.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const neonColors = ["cyan", "violet", "emerald", "rose", "amber", "blue"];
            const nc = neonColors[i % neonColors.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className={`group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:border-${nc}-400/40 transition-all duration-300 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${nc}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3 backdrop-blur-sm group-hover:shadow-lg transition-shadow">
                    <f.icon className={`h-6 w-6 text-${nc}-400`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Included Free</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* V10: Checklist — clean checklist with progress feel */
function V10Checklist() {
  return (
    <section className="container">
      <SectionHeader badge="Your Success Kit" />
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">What's In Your Course</h3>
                <p className="text-sm text-primary-foreground/80 mt-1">Everything included at no extra cost</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">6/6</div>
                <div className="text-xs text-primary-foreground/70">Features Included</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div className="h-full w-full rounded-full bg-white transition-all" />
            </div>
          </div>
          <div className="divide-y">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-5 hover:bg-muted/50 transition-colors group"
              >
                <div className={`flex-shrink-0 rounded-full bg-gradient-to-br ${f.color} p-2`}>
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{f.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{f.description}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs flex-shrink-0">FREE</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Shared header */
function SectionHeader({ badge }: { badge: string }) {
  return (
    <div className="text-center mb-12">
      <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{badge}</Badge>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Pass</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">Your complete driving success toolkit — every feature included at no extra cost.</p>
    </div>
  );
}
