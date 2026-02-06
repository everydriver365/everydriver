import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Star, CheckCircle, Play, Users, GraduationCap, Heart, TrendingUp,
  Gauge, Camera, MapPin, Shield, Building2, Smartphone, Calendar, CreditCard,
  Globe, Palette, Megaphone, CalendarClock, ClipboardCheck, Layout, Zap,
  ChevronRight, Sparkles, Quote, Eye, Monitor, ChevronDown,
} from "lucide-react";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import heroDashboard from "@/assets/demo/hero-dashboard-mockup.jpg";
import instructorPortrait from "@/assets/demo/instructor-portrait.jpg";
import heroAerial from "@/assets/demo/hero-aerial-car.jpg";
import abstractBg from "@/assets/demo/abstract-tech-bg.jpg";

const features = [
  { icon: Gauge, title: "Live Telematics", desc: "Real-time speed, G-force & route tracking" },
  { icon: Camera, title: "Integrated Dashcam", desc: "Record lessons & clip key moments" },
  { icon: MapPin, title: "GPS Trip Replay", desc: "Animated route playback with reports" },
  { icon: Smartphone, title: "Pupil & Parent Apps", desc: "Dedicated apps for everyone" },
  { icon: Calendar, title: "Smart Diary", desc: "Drag-and-drop scheduling" },
  { icon: CreditCard, title: "Take Payments", desc: "Accept cards, manage packages" },
  { icon: Globe, title: "Free Website", desc: "Professional site included free" },
  { icon: Shield, title: "Incident Reporting", desc: "Insurance-ready documentation" },
  { icon: Building2, title: "White Label", desc: "Your brand, your domain" },
];

const stats = [
  { value: "500+", label: "Active Instructors", icon: Users },
  { value: "12,000+", label: "Pupils Managed", icon: GraduationCap },
  { value: "98%", label: "Satisfaction", icon: Heart },
  { value: "85%", label: "Pass Rate", icon: TrendingUp },
];

const testimonials = [
  { name: "Sarah Mitchell", role: "ADI, Birmingham", content: "EveryDriver transformed my business. The telematics alone are worth it.", rating: 5 },
  { name: "James Cooper", role: "Instructor, Manchester", content: "I went from paper diary to fully digital in one day. Incredible.", rating: 5 },
  { name: "Emma Williams", role: "School Owner, London", content: "Managing 8 instructors has never been easier. The white-label is fantastic.", rating: 5 },
];

/* ═══════════════════════════════════════════════════════════════════
   CONCEPT A — "Product Showcase" (Split hero with dashboard mockup)
   ═══════════════════════════════════════════════════════════════════ */
function ConceptA() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[#0a1628] overflow-hidden">
        <div className="container py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-6">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Trusted by 500+ ADIs</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-[1.1]">
                The All-in-One Platform for{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Driving Instructors
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-lg">
                Telematics, dashcam, diary, payments, pupil apps & your own website — everything you need to grow.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-8 text-lg">
                  Start Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-lg">
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                <span className="text-white font-medium">4.9/5</span>
                <span>•</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> No credit card</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <img src={heroDashboard} alt="Dashboard preview" className="w-full rounded-2xl shadow-2xl shadow-emerald-500/10 border border-white/10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-slate-900 border-b border-border py-10">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <s.icon className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — Bento grid */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 mb-4">Platform</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Professional-grade tools designed by ADIs, for ADIs.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Card className="h-full hover:shadow-lg hover:border-emerald-500/40 transition-all group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <f.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#0a1628]">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Loved by Instructors</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">{[...Array(t.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-slate-300 mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="text-sm text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-center">
        <div className="container max-w-3xl">
          <Zap className="h-12 w-12 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg text-emerald-100 mb-8">Free forever plan. No credit card required.</p>
          <Button size="lg" className="bg-white text-emerald-700 hover:bg-slate-100 h-14 px-10 text-lg">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONCEPT B — "People First" (Instructor portrait hero, image-heavy)
   ═══════════════════════════════════════════════════════════════════ */
function ConceptB() {
  return (
    <div>
      {/* Hero — Full bleed image with instructor */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <img src={instructorPortrait} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <div className="relative container py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <Badge className="bg-white/10 text-white border-white/20 mb-6 text-sm py-1.5 px-4">🚗 Built for ADIs</Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05]">
              Your Business,<br />
              <span className="text-emerald-400">Supercharged.</span>
            </h1>
            <p className="text-xl text-white/80 mb-10 max-w-lg leading-relaxed">
              The platform that gives driving instructors telematics, dashcam, smart scheduling, payments & a professional website — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-10 text-lg shadow-lg shadow-emerald-500/30">
                Start Free Today <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 h-14 px-8 text-lg">
                <Play className="mr-2 h-5 w-5" /> See It In Action
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature showcase — large image cards */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Why ADIs Choose EveryDriver</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Professional tools that make a real difference to your daily routine.</p>
          </div>

          {/* Large alternating feature rows */}
          {[
            { img: heroDashboard, icon: Gauge, title: "Live Telematics & Analytics", desc: "Monitor speed, G-force, braking patterns, and route compliance in real-time. Generate professional PDF reports your pupils and their parents will love.", reverse: false },
            { img: heroAerial, icon: Camera, title: "Built-In Dashcam System", desc: "Record every lesson automatically. Clip highlights, review incidents, and share progress footage — all from your dashboard.", reverse: true },
            { img: abstractBg, icon: Globe, title: "Your Own Professional Website", desc: "Get a stunning, mobile-optimised website included free. Showcase reviews, accept bookings 24/7, and rank higher on Google.", reverse: false },
          ].map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`grid lg:grid-cols-2 gap-10 items-center mb-16 last:mb-0 ${row.reverse ? "lg:[direction:rtl]" : ""}`}
            >
              <div className="lg:[direction:ltr]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <row.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{row.title}</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">{row.desc}</p>
                <Button variant="outline" className="group">
                  Learn more <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="lg:[direction:ltr]">
                <img src={row.img} alt={row.title} className="w-full rounded-2xl shadow-xl border border-border aspect-video object-cover" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Icon grid — quick features */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">50+ Features Including</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-emerald-500/40 transition-colors">
                  <f.icon className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 text-center mb-16">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-4xl font-bold text-emerald-500">{s.value}</p>
                <p className="text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-emerald-500/30 mb-3" />
                  <p className="text-foreground mb-4 leading-relaxed">"{t.content}"</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <img src={heroAerial} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0a1628]/90" />
        <div className="relative container text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Start Growing Your Business Today</h2>
          <p className="text-lg text-slate-300 mb-8">Free plan available forever. No credit card needed.</p>
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-10 text-lg">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONCEPT C — "Bold & Modern" (Gradient hero, card carousel, visual)
   ═══════════════════════════════════════════════════════════════════ */
function ConceptC() {
  return (
    <div>
      {/* Hero — Bold gradient with floating cards */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#0a3520] min-h-[85vh] flex items-center">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        
        <div className="relative container py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-white/80">Trusted by 500+ driving instructors</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-[1.05] tracking-tight">
                Run Your<br />
                Driving School<br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Like a Pro</span>
              </h1>
              <p className="text-xl text-slate-300 mb-10 max-w-lg">
                Telematics. Dashcam. Smart diary. Payments. Website. Pupil apps. Everything — one platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-10 text-lg rounded-full shadow-lg shadow-emerald-500/25">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-lg rounded-full">
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </Button>
              </div>
            </motion.div>

            {/* Floating feature cards */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative hidden lg:block">
              <div className="relative">
                <img src={heroDashboard} alt="Dashboard" className="w-full rounded-2xl shadow-2xl border border-white/10" />
                {/* Floating stat cards */}
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pass Rate</p>
                      <p className="font-bold text-foreground">85%</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -bottom-4 -left-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="font-bold text-foreground">4.9 / 5</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scrolling logo/trust bar */}
      <section className="bg-card border-y border-border py-6">
        <div className="container flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          {["🏆 Award-Winning Platform", "🔒 GDPR Compliant", "🇬🇧 Built in the UK", "⭐ 4.9/5 Rating", "💳 Stripe Powered"].map((item) => (
            <span key={item} className="text-sm font-medium whitespace-nowrap">{item}</span>
          ))}
        </div>
      </section>

      {/* Features — Large visual cards with images */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 mb-4">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Built Different</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Not just another diary app. A complete business platform.</p>
          </div>

          {/* Featured hero cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[
              { img: heroDashboard, icon: Gauge, title: "Live Telematics Dashboard", desc: "Real-time monitoring of every lesson — speed, G-force, braking, and route compliance." },
              { img: heroAerial, icon: Camera, title: "Integrated Dashcam & GPS", desc: "Record lessons, replay routes, and generate insurance-ready incident reports." },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all border-border">
                  <div className="relative h-52 overflow-hidden">
                    <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                        <card.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{card.title}</h3>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-muted-foreground">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Smaller feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.slice(2).map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-start gap-4 bg-card border border-border rounded-xl p-5 hover:border-emerald-500/40 hover:shadow-md transition-all">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof with images */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 text-center mb-16">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <s.icon className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-4xl font-bold text-foreground">{s.value}</p>
                <p className="text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">{[...Array(t.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                    <p className="text-foreground mb-4 leading-relaxed">"{t.content}"</p>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#0a1628] to-[#0a3520]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative container text-center max-w-3xl">
          <Sparkles className="h-12 w-12 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Start Your Free Account</h2>
          <p className="text-lg text-slate-300 mb-10">Free forever plan available. Upgrade when you're ready.</p>
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-12 text-lg rounded-full shadow-lg shadow-emerald-500/25">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-6 text-sm text-slate-400">No credit card required • Setup in 2 minutes</p>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEMO SELECTOR PAGE
   ═══════════════════════════════════════════════════════════════════ */
const concepts = [
  { id: "A", name: "Product Showcase", desc: "Split hero with dashboard mockup, bento feature grid, clean & professional", component: ConceptA },
  { id: "B", name: "People First", desc: "Full-bleed instructor photo hero, alternating image/text sections, warm & personal", component: ConceptB },
  { id: "C", name: "Bold & Modern", desc: "Gradient hero with floating cards, animated stats, visual-heavy & premium feel", component: ConceptC },
];

export default function DesignDemo() {
  const [active, setActive] = useState<string>("A");
  const ActiveComponent = concepts.find(c => c.id === active)!.component;

  return (
    <InstructorSaaSLayout>
      {/* Sticky concept selector */}
      <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap flex items-center gap-2">
              <Eye className="h-4 w-4" /> Preview:
            </span>
            {concepts.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  active === c.id
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <Monitor className="h-4 w-4" />
                Concept {c.id}: {c.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {concepts.find(c => c.id === active)?.desc}
          </p>
        </div>
      </div>

      {/* Render active concept */}
      <ActiveComponent />
    </InstructorSaaSLayout>
  );
}
