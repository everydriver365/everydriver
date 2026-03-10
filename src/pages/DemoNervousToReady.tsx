import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Award, ArrowRight, ChevronRight, Users, Clock, Shield, Heart, Sparkles, TrendingUp, CheckCircle2, Quote, Zap, Car, Target, ThumbsUp, MapPin, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import testimonialSarahM from "@/assets/testimonial-sarah-m.jpg";
import testimonialEmily from "@/assets/testimonial-emily.jpg";
import testimonialPriya from "@/assets/testimonial-priya.jpg";

const testimonials = [
  { name: "Sarah M.", course: "5-Day Intensive", img: testimonialSarahM, text: "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points." },
  { name: "Emily R.", course: "Semi-Intensive", img: testimonialEmily, text: "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made." },
  { name: "Priya T.", course: "10-Day Course", img: testimonialPriya, text: "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job." },
];

const stats = [
  { value: "98%", label: "Pass Rate" },
  { value: "10,000+", label: "Drivers Trained" },
  { value: "4.9★", label: "Average Rating" },
];

const DemoNervousToReady = () => {
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const variants = [
    { id: "v1", label: "1 — Timeline" },
    { id: "v2", label: "2 — Cards Grid" },
    { id: "v3", label: "3 — Gradient Hero" },
    { id: "v4", label: "4 — Before/After" },
    { id: "v5", label: "5 — Social Proof Wall" },
    { id: "v6", label: "6 — Stacked Carousel" },
    { id: "v7", label: "7 — Magazine" },
    { id: "v8", label: "8 — Brutalist" },
    { id: "v9", label: "9 — Warm Organic" },
    { id: "v10", label: "10 — Compact Stats" },
  ];

  const StarRow = () => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">"Nervous to Ready" Section Variants</h1>
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

      {/* V1 — Journey Timeline */}
      {(!activeVariant || activeVariant === "v1") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V1 — Journey Timeline</Badge></div>
          <div className="bg-gradient-to-br from-emerald-50 to-amber-50/30 py-20">
            <div className="container max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-16">
                <Badge className="mb-4 bg-emerald-500 text-white border-0 hover:bg-emerald-500"><Award className="h-3 w-3 mr-1" />Proven Results</Badge>
                <h2 className="text-4xl font-black">From Nervous to <span className="text-emerald-600">Road Ready</span></h2>
                <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Your transformation journey with us, step by step</p>
              </motion.div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-200 -translate-x-1/2 hidden lg:block" />
                {[
                  { step: "Day 1", title: "Nervous Beginner", desc: "Everyone starts here. We'll make you feel comfortable behind the wheel from the very first minute.", icon: Heart, color: "bg-rose-500" },
                  { step: "Week 1", title: "Building Confidence", desc: "Master the basics — clutch control, steering, and simple junctions in quiet areas.", icon: TrendingUp, color: "bg-amber-500" },
                  { step: "Week 2-3", title: "Real Road Skills", desc: "Roundabouts, dual carriageways, and independent driving. You'll surprise yourself.", icon: Car, color: "bg-blue-500" },
                  { step: "Test Day", title: "Road Ready!", desc: "Walk into your test with genuine confidence. Our 98% pass rate speaks for itself.", icon: Award, color: "bg-emerald-500" },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative flex items-center gap-8 mb-12 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.step}</span>
                      <h3 className="text-xl font-bold mt-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-sm inline-block">{item.desc}</p>
                    </div>
                    <div className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${item.color} shadow-lg`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 hidden lg:block" />
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Button className="gap-2" asChild><Link to="/courses">Start Your Journey <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V2 — Testimonial Cards Grid */}
      {(!activeVariant || activeVariant === "v2") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V2 — Cards Grid</Badge></div>
          <div className="bg-zinc-950 py-20">
            <div className="container">
              <div className="grid lg:grid-cols-5 gap-10 items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="lg:col-span-2">
                  <Badge className="mb-4 bg-emerald-500 text-white border-0 hover:bg-emerald-500"><Award className="h-3 w-3 mr-1" />Proven Results</Badge>
                  <h2 className="text-4xl font-black text-white mb-4">From Nervous to<br /><span className="text-emerald-400">Road Ready</span></h2>
                  <p className="text-zinc-400 mb-6">Join thousands who turned driving anxiety into driving confidence.</p>
                  <div className="flex gap-6 mb-8">
                    {stats.map(s => (
                      <div key={s.label}>
                        <div className="text-2xl font-black text-white">{s.value}</div>
                        <div className="text-xs text-zinc-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <Button className="gap-2" asChild><Link to="/courses">Start Your Journey <ArrowRight className="h-4 w-4" /></Link></Button>
                </motion.div>

                <div className="lg:col-span-3 grid gap-4">
                  {testimonials.map((t, i) => (
                    <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                      className="flex gap-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-5"
                    >
                      <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
                      <div>
                        <StarRow />
                        <p className="text-sm text-zinc-300 mt-2 italic">"{t.text}"</p>
                        <p className="text-xs text-zinc-500 mt-2"><span className="font-semibold text-zinc-400">{t.name}</span> • {t.course}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V3 — Gradient Hero Banner */}
      {(!activeVariant || activeVariant === "v3") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V3 — Gradient Hero</Badge></div>
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 py-24">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            <div className="container relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
                  <h2 className="text-5xl font-black text-white mb-4">From Nervous to Road Ready</h2>
                  <p className="text-xl text-white/80 mb-10">Thousands of learners transformed. You could be next.</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  {testimonials.map((t, i) => (
                    <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.15 }} viewport={{ once: true }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img src={t.img} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-bold text-white">{t.name}</p>
                          <p className="text-xs text-white/60">{t.course}</p>
                        </div>
                      </div>
                      <StarRow />
                      <p className="text-sm text-white/80 mt-3 italic">"{t.text}"</p>
                    </motion.div>
                  ))}
                </div>

                <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-bold gap-2">
                  Start Your Journey <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V4 — Before / After Split */}
      {(!activeVariant || activeVariant === "v4") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V4 — Before / After</Badge></div>
          <div className="py-20 bg-background">
            <div className="container max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-14">
                <h2 className="text-4xl font-black">The Transformation</h2>
                <p className="text-muted-foreground mt-2">See how our learners go from nervous to confident</p>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
                {/* Before */}
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="bg-zinc-100 p-10">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Before</div>
                  <h3 className="text-2xl font-bold text-zinc-500 mb-6">😰 Nervous & Uncertain</h3>
                  <ul className="space-y-3">
                    {["Anxious about being on the road", "Scared of roundabouts & junctions", "No idea where to start", "Worried about failing the test"].map(item => (
                      <li key={item} className="flex items-center gap-3 text-zinc-500">
                        <div className="h-2 w-2 rounded-full bg-zinc-300" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* After */}
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="bg-emerald-600 p-10">
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-4">After</div>
                  <h3 className="text-2xl font-bold text-white mb-6">🎉 Road Ready!</h3>
                  <ul className="space-y-3">
                    {["Confident in any traffic situation", "Navigating complex roads with ease", "Clear structured learning path completed", "Passed with flying colours!"].map(item => (
                      <li key={item} className="flex items-center gap-3 text-emerald-100">
                        <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <div className="mt-10 text-center">
                <div className="flex justify-center gap-6 mb-6">
                  {stats.map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-black">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <Button className="gap-2" asChild><Link to="/courses">Start Your Transformation <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V5 — Social Proof Wall */}
      {(!activeVariant || activeVariant === "v5") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V5 — Social Proof Wall</Badge></div>
          <div className="bg-amber-50/60 py-20">
            <div className="container">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-black">From Nervous to <span className="text-emerald-600">Road Ready</span></h2>
                  <p className="text-muted-foreground mt-1">Real stories from real learners</p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  {stats.map(s => (
                    <div key={s.label} className="rounded-full border bg-white px-5 py-2.5 text-center shadow-sm">
                      <span className="font-bold">{s.value}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {testimonials.map((t, i) => (
                  <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                    className="bg-white rounded-2xl p-6 shadow-md border hover:shadow-lg transition-shadow"
                  >
                    <StarRow />
                    <p className="text-sm text-muted-foreground mt-4 mb-5 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <img src={t.img} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.course}</p>
                      </div>
                      <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0 text-xs hover:bg-emerald-100">Passed ✓</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-10">
                <Button className="gap-2" asChild><Link to="/courses">Join Them <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V6 — Stacked Testimonials with Big Quote */}
      {(!activeVariant || activeVariant === "v6") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V6 — Big Quote Stack</Badge></div>
          <div className="bg-background py-20">
            <div className="container max-w-4xl">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 mb-4">
                  <Sparkles className="h-4 w-4" /> From Nervous to Road Ready
                </div>
                <h2 className="text-4xl font-black">What Our Learners Say</h2>
              </motion.div>

              <div className="space-y-6">
                {testimonials.map((t, i) => (
                  <motion.div key={t.name} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                    className={`flex gap-6 ${i % 2 !== 0 ? 'flex-row-reverse' : ''}`}
                  >
                    <img src={t.img} alt={t.name} className="h-16 w-16 rounded-2xl object-cover shrink-0 shadow-md" />
                    <div className={`flex-1 rounded-2xl bg-zinc-50 border p-6 relative ${i % 2 !== 0 ? 'text-right' : ''}`}>
                      <Quote className="h-8 w-8 text-emerald-200 mb-2" />
                      <p className="text-lg font-medium text-zinc-800 mb-3">"{t.text}"</p>
                      <div className="flex items-center gap-2 justify-between">
                        <div className={i % 2 !== 0 ? 'ml-auto' : ''}>
                          <p className="text-sm font-bold">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.course} • Passed first time</p>
                        </div>
                        <StarRow />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12 flex items-center justify-center gap-6">
                {stats.map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-black">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Button className="gap-2" asChild><Link to="/courses">Start Your Journey <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V7 — Magazine Editorial */}
      {(!activeVariant || activeVariant === "v7") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V7 — Magazine Editorial</Badge></div>
          <div className="bg-stone-100 py-20">
            <div className="container">
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Feature card */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
                  className="lg:col-span-5 bg-emerald-600 rounded-3xl p-10 text-white flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-200 mb-6">Transformations</div>
                    <h2 className="text-4xl font-black leading-tight mb-4">From Nervous<br />to Road Ready</h2>
                    <p className="text-emerald-100 mb-8">Our structured approach takes you from complete beginner to confident driver, guaranteed.</p>
                  </div>
                  <div>
                    <div className="flex gap-6 mb-8 border-t border-emerald-500 pt-6">
                      {stats.map(s => (
                        <div key={s.label}>
                          <div className="text-2xl font-black">{s.value}</div>
                          <div className="text-xs text-emerald-200">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <Button className="bg-white text-emerald-700 hover:bg-white/90 gap-2 font-bold" asChild>
                      <Link to="/courses">Get Started <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </motion.div>

                {/* Testimonials stack */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  {testimonials.map((t, i) => (
                    <motion.div key={t.name} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                      className="bg-white rounded-2xl p-6 shadow-sm flex gap-5 items-start"
                    >
                      <img src={t.img} alt={t.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.course}</p>
                          </div>
                          <StarRow />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V8 — Brutalist */}
      {(!activeVariant || activeVariant === "v8") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V8 — Brutalist</Badge></div>
          <div className="bg-zinc-950 py-20">
            <div className="container">
              <div className="grid lg:grid-cols-2 gap-0">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="bg-emerald-400 p-12">
                  <div className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-900 mb-8">// RESULTS</div>
                  <h2 className="text-6xl font-black leading-[0.85] text-zinc-950 mb-8">
                    NERVOUS<br />→<br />READY.
                  </h2>
                  <div className="flex gap-8 mb-8">
                    {stats.map(s => (
                      <div key={s.label}>
                        <div className="text-3xl font-black text-zinc-950">{s.value}</div>
                        <div className="text-xs font-mono text-emerald-800">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <Button className="bg-zinc-950 text-emerald-400 hover:bg-zinc-800 font-mono uppercase tracking-wider text-xs gap-2">
                    Start Now <ArrowRight className="h-3 w-3" />
                  </Button>
                </motion.div>

                <div className="bg-zinc-900 p-12 flex flex-col justify-center">
                  {testimonials.map((t, i) => (
                    <motion.div key={t.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} viewport={{ once: true }}
                      className={`py-6 ${i !== testimonials.length - 1 ? 'border-b border-zinc-800' : ''}`}
                    >
                      <p className="text-zinc-300 text-sm font-mono mb-3">"{t.text}"</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-mono">{t.name} — {t.course}</span>
                        <StarRow />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V9 — Warm Organic */}
      {(!activeVariant || activeVariant === "v9") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V9 — Warm Organic</Badge></div>
          <div className="bg-gradient-to-b from-orange-50 via-amber-50/40 to-background py-20">
            <div className="container max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-14">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-amber-500 fill-amber-500" />
                  </div>
                </div>
                <h2 className="text-4xl font-black">Every Learner's Journey<br /><span className="text-amber-600">Starts Here</span></h2>
                <p className="text-muted-foreground mt-3">From first lesson nerves to passing-day celebrations</p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((t, i) => (
                  <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 }} viewport={{ once: true }}
                    className="text-center"
                  >
                    <img src={t.img} alt={t.name} className="h-20 w-20 rounded-full object-cover mx-auto mb-4 shadow-lg ring-4 ring-amber-100" />
                    <StarRow />
                    <p className="text-sm text-muted-foreground mt-4 italic leading-relaxed">"{t.text}"</p>
                    <p className="mt-3 text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.course}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} viewport={{ once: true }}
                className="mt-14 bg-white rounded-3xl p-8 shadow-lg border flex items-center justify-between flex-wrap gap-6"
              >
                <div className="flex gap-8">
                  {stats.map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-3xl font-black text-amber-600">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 font-bold" asChild>
                  <Link to="/courses">Start Your Journey <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* V10 — Compact Stats + Testimonials */}
      {(!activeVariant || activeVariant === "v10") && (
        <section>
          <div className="py-6 container"><Badge variant="outline">V10 — Compact Stats</Badge></div>
          <div className="bg-secondary/30 py-20">
            <div className="container max-w-6xl">
              {/* Stats bar */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
                className="grid grid-cols-3 gap-4 mb-12"
              >
                {[
                  { icon: Target, value: "98%", label: "Pass Rate", color: "bg-emerald-500" },
                  { icon: Users, value: "10,000+", label: "Drivers Trained", color: "bg-blue-500" },
                  { icon: Star, value: "4.9/5", label: "Average Rating", color: "bg-amber-500" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                      <s.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  </div>
                ))}
              </motion.div>

              <div className="text-center mb-10">
                <h2 className="text-3xl font-black">From Nervous to <span className="text-emerald-600">Road Ready</span></h2>
              </div>

              {/* Horizontal testimonials */}
              <div className="grid md:grid-cols-3 gap-4">
                {testimonials.map((t, i) => (
                  <motion.div key={t.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                    className="bg-white rounded-xl p-5 shadow-sm border"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img src={t.img} alt={t.name} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.course}</p>
                      </div>
                    </div>
                    <StarRow />
                    <p className="text-sm text-muted-foreground mt-2">"{t.text}"</p>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-10">
                <Button className="gap-2" asChild><Link to="/courses">Start Your Journey <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="h-20" />
    </div>
  );
};

export default DemoNervousToReady;
