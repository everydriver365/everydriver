import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, Shield, Clock, Zap, Star, CheckCircle2, Sparkles, Award, CalendarCheck, Timer, BadgeCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import earlyTestBadge from "@/assets/free-retest-badge.png";

const DemoETGBanner = () => {
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const variants = [
    { id: "v1", label: "1 — Floating Card" },
    { id: "v2", label: "2 — Split Gradient" },
    { id: "v3", label: "3 — Dark Cinematic" },
    { id: "v4", label: "4 — Pill Banner" },
    { id: "v5", label: "5 — Feature Grid" },
    { id: "v6", label: "6 — Brutalist" },
    { id: "v7", label: "7 — Glass Card" },
    { id: "v8", label: "8 — Ribbon" },
    { id: "v9", label: "9 — Stacked" },
    { id: "v10", label: "10 — Marquee" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Earlier Test Guarantee — Banner Variants</h1>
              <p className="text-sm text-muted-foreground">Choose a design for the Drive365 homepage</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setActiveVariant(null)}>Show All</Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <Button
                key={v.id}
                size="sm"
                variant={activeVariant === v.id ? "default" : "outline"}
                onClick={() => setActiveVariant(activeVariant === v.id ? null : v.id)}
                className="text-xs h-7 px-2.5"
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-8" />

      {/* V1 — Floating Card with badge */}
      {(!activeVariant || activeVariant === "v1") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V1 — Floating Card</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden bg-white border shadow-xl hover:shadow-2xl transition-all group"
              >
                <div className="flex items-center gap-0">
                  {/* Left emerald panel */}
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 p-8 flex items-center justify-center shrink-0">
                    <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="w-24 h-24 drop-shadow-lg object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-6 flex items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100 text-xs">Guaranteed</Badge>
                        <Badge className="bg-amber-100 text-amber-700 border-0 hover:bg-amber-100 text-xs">Money Back</Badge>
                      </div>
                      <h3 className="text-xl font-black mt-2">Get Your Test Date Sooner</h3>
                      <p className="text-sm text-muted-foreground mt-1">We'll find you an earlier test date — or you get your test fee back.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-sm px-6 py-3 rounded-full shrink-0 group-hover:bg-emerald-700 transition-colors">
                      Learn More <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V2 — Split Gradient */}
      {(!activeVariant || activeVariant === "v2") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V2 — Split Gradient</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
              >
                <div className="grid lg:grid-cols-5">
                  <div className="lg:col-span-2 bg-gradient-to-br from-emerald-700 to-teal-600 p-8 flex flex-col justify-center items-center text-center">
                    <img src={earlyTestBadge} alt="ETG" className="w-20 h-20 drop-shadow-lg object-contain mb-4" />
                    <h3 className="text-2xl font-black text-white leading-tight">Earlier Test<br />Guarantee</h3>
                  </div>
                  <div className="lg:col-span-3 bg-gradient-to-r from-emerald-500 to-amber-400 p-8 flex items-center">
                    <div className="flex-1">
                      <div className="flex gap-6 mb-4">
                        {[
                          { icon: Clock, text: "Average 4 weeks sooner" },
                          { icon: Shield, text: "Money-back guarantee" },
                          { icon: Zap, text: "Instant notifications" },
                        ].map(f => (
                          <div key={f.text} className="flex items-center gap-2 text-white/90">
                            <f.icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium">{f.text}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-white/80 text-sm">Skip months of waiting. We actively monitor cancellations to get you tested faster.</p>
                    </div>
                    <div className="bg-white text-emerald-700 font-bold text-sm px-6 py-3 rounded-full shrink-0 ml-6">
                      Learn More →
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V3 — Dark Cinematic */}
      {(!activeVariant || activeVariant === "v3") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V3 — Dark Cinematic</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl hover:shadow-emerald-500/20 transition-all group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-amber-500/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-20 translate-x-20" />
                <div className="relative p-8 flex items-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                    <img src={earlyTestBadge} alt="ETG" className="relative w-24 h-24 drop-shadow-2xl object-contain group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Exclusive Guarantee</div>
                    <h3 className="text-2xl font-black text-white mb-1">Get Your Test Date Sooner</h3>
                    <p className="text-sm text-zinc-400">We monitor cancellations 24/7 to find you an earlier slot — or your money back.</p>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-full group-hover:bg-emerald-400 transition-colors">
                      <Zap className="h-4 w-4" />
                      Learn More
                    </div>
                    <span className="text-xs text-zinc-500">Avg. 4 weeks sooner</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V4 — Pill Banner */}
      {(!activeVariant || activeVariant === "v4") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V4 — Pill Banner</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg hover:shadow-xl transition-shadow px-4 py-3 flex items-center gap-4 group"
              >
                <img src={earlyTestBadge} alt="ETG" className="w-12 h-12 drop-shadow object-contain shrink-0" />
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-bold text-white text-sm">Earlier Test Guarantee</span>
                  <span className="text-white/70 text-sm hidden md:inline">— We'll find you a sooner test date or your money back</span>
                </div>
                <div className="flex items-center gap-3">
                  {["24/7 Monitoring", "Money Back", "Avg. 4 Weeks Sooner"].map(t => (
                    <span key={t} className="hidden lg:inline-flex items-center gap-1 bg-white/15 text-white text-xs px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />{t}
                    </span>
                  ))}
                  <span className="bg-white text-emerald-700 font-bold text-xs px-5 py-2 rounded-full group-hover:bg-emerald-50 transition-colors">
                    Learn More
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V5 — Feature Grid Card */}
      {(!activeVariant || activeVariant === "v5") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V5 — Feature Grid</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="rounded-2xl border bg-card shadow-lg hover:shadow-xl transition-shadow overflow-hidden group"
              >
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={earlyTestBadge} alt="ETG" className="w-10 h-10 object-contain" />
                    <h3 className="text-lg font-black text-white">Earlier Test Guarantee</h3>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/20">Most Popular</Badge>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { icon: Timer, title: "4 Weeks Sooner", desc: "Average time saved" },
                      { icon: Shield, title: "Money Back", desc: "If we can't find earlier" },
                      { icon: CalendarCheck, title: "24/7 Monitoring", desc: "Automated scanning" },
                      { icon: Zap, title: "Instant Alerts", desc: "SMS & app notifications" },
                    ].map(f => (
                      <div key={f.title} className="text-center">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                          <f.icon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold">{f.title}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Skip months of waiting — we do the hard work for you.</p>
                    <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn More <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V6 — Brutalist */}
      {(!activeVariant || activeVariant === "v6") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V6 — Brutalist</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="bg-zinc-950 hover:bg-zinc-900 transition-colors group"
              >
                <div className="flex items-stretch">
                  <div className="bg-emerald-400 p-8 flex items-center justify-center shrink-0">
                    <img src={earlyTestBadge} alt="ETG" className="w-20 h-20 object-contain" />
                  </div>
                  <div className="p-8 flex items-center gap-8 flex-1">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-400 mb-2">// GUARANTEE</div>
                      <h3 className="text-3xl font-black text-white leading-[0.9]">EARLIER<br />TEST.</h3>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-400 font-mono">We'll find you an earlier test date — or you get your money back. Average 4 weeks sooner.</p>
                    </div>
                    <div className="bg-emerald-400 text-zinc-950 font-mono font-bold uppercase tracking-wider text-xs px-6 py-3 shrink-0 group-hover:bg-emerald-300 transition-colors">
                      Learn More →
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V7 — Glass Card */}
      {(!activeVariant || activeVariant === "v7") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V7 — Glass Card</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden group"
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,transparent_60%)]" />

                {/* Glass content */}
                <div className="relative p-8 flex items-center gap-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0">
                    <img src={earlyTestBadge} alt="ETG" className="w-20 h-20 object-contain drop-shadow-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-1">Earlier Test Guarantee</h3>
                    <p className="text-sm text-white/80 mb-4">Skip the wait. We actively scan for earlier test dates and notify you instantly.</p>
                    <div className="flex gap-4">
                      {["Money-back guarantee", "Avg. 4 weeks sooner", "24/7 automated scanning"].map(t => (
                        <span key={t} className="flex items-center gap-1.5 text-xs text-white/70">
                          <CheckCircle2 className="h-3 w-3 text-white" />{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm text-white font-bold text-sm px-6 py-3 rounded-full border border-white/30 shrink-0 group-hover:bg-white/30 transition-colors">
                    Learn More →
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V8 — Ribbon Banner */}
      {(!activeVariant || activeVariant === "v8") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V8 — Ribbon</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="relative group"
              >
                {/* Main banner */}
                <div className="rounded-2xl bg-emerald-600 p-6 flex items-center gap-6 shadow-lg hover:bg-emerald-500 transition-colors">
                  <img src={earlyTestBadge} alt="ETG" className="w-16 h-16 object-contain shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white">Earlier Test Guarantee</h3>
                    <p className="text-sm text-emerald-100">We'll find you a sooner test date — or your money back.</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden md:block">
                      <div className="text-2xl font-black text-white">4 Weeks</div>
                      <div className="text-xs text-emerald-200">Average time saved</div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ArrowRight className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
                {/* Ribbon tag */}
                <div className="absolute -top-3 left-8 bg-amber-400 text-amber-900 font-bold text-xs px-4 py-1 rounded-full shadow-md">
                  ⭐ Most Popular Add-On
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V9 — Stacked with Stats */}
      {(!activeVariant || activeVariant === "v9") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V9 — Stacked</Badge></div>
          <div className="container max-w-3xl">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow border group"
              >
                {/* Top */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-8 text-center">
                  <img src={earlyTestBadge} alt="ETG" className="w-20 h-20 object-contain mx-auto mb-4 drop-shadow-lg group-hover:scale-105 transition-transform" />
                  <h3 className="text-2xl font-black text-white">Earlier Test Guarantee</h3>
                  <p className="text-sm text-emerald-100 mt-2 max-w-md mx-auto">We'll find you an earlier test date — or you get your test fee back. No stress, no waiting.</p>
                </div>
                {/* Bottom stats */}
                <div className="bg-white grid grid-cols-3 divide-x">
                  {[
                    { value: "4 Weeks", label: "Average time saved" },
                    { value: "100%", label: "Money-back guarantee" },
                    { value: "24/7", label: "Automated monitoring" },
                  ].map(s => (
                    <div key={s.label} className="p-5 text-center">
                      <div className="text-xl font-black text-emerald-600">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* V10 — Marquee / Ticker Style */}
      {(!activeVariant || activeVariant === "v10") && (
        <section className="py-6">
          <div className="container"><Badge variant="outline" className="mb-4">V10 — Ticker</Badge></div>
          <div className="container">
            <Link to="/earlier-test-guarantee">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
                className="rounded-2xl bg-zinc-950 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group"
              >
                <div className="flex items-center">
                  {/* Left badge area */}
                  <div className="bg-emerald-500 p-6 flex items-center gap-4 shrink-0">
                    <img src={earlyTestBadge} alt="ETG" className="w-14 h-14 object-contain" />
                    <div>
                      <h3 className="text-lg font-black text-white leading-tight">Earlier Test<br />Guarantee</h3>
                    </div>
                  </div>

                  {/* Scrolling ticker area */}
                  <div className="flex-1 overflow-hidden py-5 px-6">
                    <div className="flex items-center gap-8 animate-marquee">
                      {[
                        "✓ Average 4 weeks sooner",
                        "✓ Money-back guarantee",
                        "✓ 24/7 cancellation monitoring",
                        "✓ Instant SMS alerts",
                        "✓ No extra stress",
                        "✓ Average 4 weeks sooner",
                        "✓ Money-back guarantee",
                        "✓ 24/7 cancellation monitoring",
                      ].map((t, i) => (
                        <span key={i} className="text-sm text-zinc-300 whitespace-nowrap font-medium">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pr-6 shrink-0">
                    <div className="bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-full group-hover:bg-emerald-400 transition-colors">
                      Learn More →
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      <div className="h-20" />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DemoETGBanner;
